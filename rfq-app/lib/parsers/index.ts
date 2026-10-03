import { prisma } from "@/lib/prisma";
import { parseExcelQuote } from "./excel";
import { parseQuoteWithLLM } from "./llm";
import type { ParsedQuoteRow } from "./excel";

export async function processEmailToQuote(
  emailId: string,
  rfqId: string,
  vendorId: string,
  bodyText: string,
  attachments: { filename: string; content: Buffer }[] = []
) {
  let extractedItems: ParsedQuoteRow[] = [];
  let confidence = 0;

  // Try parsing Excel attachments first
  const excelAttachment = attachments.find(a => 
    a.filename.toLowerCase().endsWith(".xlsx") || 
    a.filename.toLowerCase().endsWith(".xls") ||
    a.filename.toLowerCase().endsWith(".csv")
  );

  if (excelAttachment) {
    try {
      extractedItems = await parseExcelQuote(excelAttachment.content);
      confidence = 90; // High confidence for structural tabular data
    } catch (err) {
      console.error("Failed to parse Excel attachment:", err);
    }
  }

  // Fallback to LLM Parsing if no structured data found
  if (extractedItems.length === 0 && bodyText.trim().length > 10) {
    try {
      extractedItems = await parseQuoteWithLLM(bodyText);
      confidence = 70; // Medium/Low confidence for LLM extraction
    } catch (err) {
      console.error("LLM Extraction failed:", err);
    }
  }

  if (extractedItems.length > 0) {
    // Check if quote already exists for this RFQ + Vendor
    const existingQuote = await prisma.quote.findFirst({
      where: { rfqId, vendorId },
    });

    const quoteStatus = confidence > 80 ? "RECEIVED" : "PENDING"; // High confidence bypasses review if we want, or goes to PENDING review queue

    let quoteId = existingQuote?.id;

    if (!existingQuote) {
      const newQuote = await prisma.quote.create({
        data: {
          rfqId,
          vendorId,
          emailId,
          status: "PENDING", // Force to review queue first
          confidence,
        },
      });
      quoteId = newQuote.id;
    } else {
      await prisma.quote.update({
        where: { id: existingQuote.id },
        data: {
          confidence,
          emailId, // Update with latest email
        },
      });
    }

    // Insert Quote Items
    // For simplicity, we just wipe old items and insert new ones
    if (existingQuote) {
      await prisma.quoteItem.deleteMany({ where: { quoteId } });
    }

    let totalAmount = 0;
    
    // Fetch RFQ items to map against
    const rfqItems = await prisma.rfqItem.findMany({ where: { rfqId } });

    for (const item of extractedItems) {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice);
      totalAmount += lineTotal;
      
      // Try mapping to actual RFQ Item by line number or description
      const rfqItemMatch = rfqItems.find(r => r.lineNumber === item.lineNumber) || rfqItems[0];

      await prisma.quoteItem.create({
        data: {
          quoteId: quoteId!,
          rfqItemId: rfqItemMatch?.id, // Optional linkage
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: lineTotal,
          leadTimeDays: item.leadTimeDays,
          notes: item.remarks,
        },
      });
    }

    await prisma.quote.update({
      where: { id: quoteId! },
      data: { totalAmount },
    });
  }

  return extractedItems;
}
