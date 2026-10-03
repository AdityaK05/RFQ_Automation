import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import exceljs from "exceljs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rfqId = searchParams.get("rfqId");

  if (!rfqId) {
    return NextResponse.json({ error: "rfqId is required" }, { status: 400 });
  }

  try {
    const rfq = await prisma.rfq.findUnique({
      where: { id: rfqId },
      include: { items: true },
    });
    
    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

    const quotes = await prisma.quote.findMany({
      where: { rfqId, status: { in: ["RECEIVED", "SHORTLISTED", "AWARDED"] } },
      include: { vendor: true, items: true },
    });

    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet("Comparison");

    const header = ["Line #", "Description", "Part No.", "Qty", "Target Price", ...quotes.map(q => q.vendor.name)];
    sheet.addRow(header);

    rfq.items.forEach(item => {
      const row = [
        item.lineNumber,
        item.description,
        item.partNumber || "",
        Number(item.quantity),
        item.targetPrice ? Number(item.targetPrice) : "",
      ];

      quotes.forEach(quote => {
        const quoteItem = quote.items.find(qi => qi.rfqItemId === item.id);
        row.push(quoteItem ? Number(quoteItem.unitPrice) : "NO QUOTE");
      });

      sheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="comparison_${rfq.number}.xlsx"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
