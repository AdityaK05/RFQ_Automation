import exceljs from "exceljs";

export type ParsedQuoteRow = {
  lineNumber?: number;
  description?: string;
  partNumber?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  leadTime?: string;
  remarks?: string;
};

export async function parseExcelQuote(buffer: Buffer | ArrayBuffer): Promise<ParsedQuoteRow[]> {
  const workbook = new exceljs.Workbook();
  await workbook.xlsx.load(buffer as any);
  
  // Try to find the sheet that might contain the RFQ response
  let sheet = workbook.getWorksheet("RFQ Items");
  if (!sheet) {
    // Fallback to first sheet
    sheet = workbook.worksheets[0];
  }

  if (!sheet) {
    return [];
  }

  const extractedRows: ParsedQuoteRow[] = [];
  
  // We assume the first row or first few rows are headers.
  // In the generated template, row 1 is the header:
  // [Line Number, Description, Part Number, Quantity, Unit, Specs, Your Unit Price, Total Price, Lead Time (Days), Remarks]
  // Let's dynamically map columns by reading the header row.
  let headerRowIndex = 1;
  let headers: Record<string, number> = {};

  // Scan first 5 rows to find a likely header row
  for (let i = 1; i <= 5; i++) {
    const row = sheet.getRow(i);
    let foundHeaders = 0;
    const tempHeaders: Record<string, number> = {};

    row.eachCell((cell, colNumber) => {
      const val = cell.text?.toLowerCase() || "";
      if (val.includes("line number") || val.includes("item")) {
        tempHeaders.lineNumber = colNumber;
        foundHeaders++;
      } else if (val.includes("description")) {
        tempHeaders.description = colNumber;
        foundHeaders++;
      } else if (val.includes("part number")) {
        tempHeaders.partNumber = colNumber;
      } else if (val.includes("quantity") || val === "qty") {
        tempHeaders.quantity = colNumber;
        foundHeaders++;
      } else if (val.includes("unit price")) {
        tempHeaders.unitPrice = colNumber;
        foundHeaders++;
      } else if (val.includes("total price")) {
        tempHeaders.totalPrice = colNumber;
      } else if (val.includes("lead time")) {
        tempHeaders.leadTime = colNumber;
      } else if (val.includes("remarks") || val.includes("notes")) {
        tempHeaders.remarks = colNumber;
      }
    });

    // If we found a good number of expected headers, assume this is the header row
    if (foundHeaders >= 2) {
      headerRowIndex = i;
      headers = tempHeaders;
      break;
    }
  }

  // Iterate over data rows
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return;

    const getVal = (colNumber?: number) => {
      if (!colNumber) return undefined;
      const cell = row.getCell(colNumber);
      return cell.value;
    };

    const rawLineNum = getVal(headers.lineNumber);
    const lineNumber = typeof rawLineNum === "number" ? rawLineNum : parseInt(String(rawLineNum) || "0", 10);
    
    const description = String(getVal(headers.description) || "").trim();
    const partNumber = String(getVal(headers.partNumber) || "").trim();
    
    const rawQty = getVal(headers.quantity);
    const quantity = typeof rawQty === "number" ? rawQty : parseFloat(String(rawQty));
    
    const rawUnitPrice = getVal(headers.unitPrice);
    let unitPrice = undefined;
    if (typeof rawUnitPrice === "number") {
      unitPrice = rawUnitPrice;
    } else if (typeof rawUnitPrice === "string") {
      const parsed = parseFloat(rawUnitPrice.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) unitPrice = parsed;
    } else if (rawUnitPrice && typeof rawUnitPrice === "object" && "result" in rawUnitPrice) {
      // Handle calculated cell
      unitPrice = Number(rawUnitPrice.result);
    }

    const rawTotalPrice = getVal(headers.totalPrice);
    let totalPrice = undefined;
    if (typeof rawTotalPrice === "number") {
      totalPrice = rawTotalPrice;
    } else if (rawTotalPrice && typeof rawTotalPrice === "object" && "result" in rawTotalPrice) {
      totalPrice = Number(rawTotalPrice.result);
    } else if (typeof rawTotalPrice === "string") {
      const parsed = parseFloat(rawTotalPrice.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) totalPrice = parsed;
    }
    
    const leadTime = String(getVal(headers.leadTime) || "").trim();
    const remarks = String(getVal(headers.remarks) || "").trim();

    // Only include rows that seem to have actual quote data (e.g., have unit price)
    if (unitPrice !== undefined) {
      extractedRows.push({
        lineNumber: isNaN(lineNumber) ? undefined : lineNumber,
        description,
        partNumber,
        quantity: isNaN(quantity) ? undefined : quantity,
        unitPrice,
        totalPrice,
        leadTime,
        remarks,
      });
    }
  });

  return extractedRows;
}
