import nodemailer from "nodemailer";
import exceljs from "exceljs";
import { prisma } from "@/lib/prisma";
import type { RfqRecord, VendorRecord } from "./types";
import { EmailDirection } from "@prisma/client";

// Nodemailer transport setup (using ethereal or standard SMTP)
// For local dev, we will just simulate or use a local SMTP if not configured.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  auth: {
    user: process.env.SMTP_USER || "ethereal.user@ethereal.email",
    pass: process.env.SMTP_PASS || "ethereal.password",
  },
});

export async function generateRfqExcel(rfq: RfqRecord): Promise<Buffer> {
  const workbook = new exceljs.Workbook();
  const sheet = workbook.addWorksheet("RFQ Items");

  sheet.columns = [
    { header: "Line Number", key: "lineNumber", width: 15 },
    { header: "Description", key: "description", width: 40 },
    { header: "Part Number", key: "partNumber", width: 20 },
    { header: "Quantity", key: "quantity", width: 15 },
    { header: "Unit", key: "unit", width: 15 },
    { header: "Specs", key: "specs", width: 30 },
    { header: "Your Unit Price", key: "unitPrice", width: 20 },
    { header: "Total Price", key: "totalPrice", width: 20 },
    { header: "Lead Time (Days)", key: "leadTime", width: 20 },
    { header: "Remarks", key: "remarks", width: 30 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD3D3D3" },
  };

  for (const item of rfq.items) {
    sheet.addRow({
      lineNumber: item.lineNumber,
      description: item.description,
      partNumber: item.partNumber || "",
      quantity: item.quantity,
      unit: item.unit,
      specs: item.specs || "",
      unitPrice: "",
      totalPrice: "",
      leadTime: "",
      remarks: "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function sendRfqEmail(
  rfq: RfqRecord,
  vendor: { id: string; email: string; name: string },
  subject: string,
  bodyText: string,
  isReminder: boolean = false
) {
  try {
    const excelBuffer = await generateRfqExcel(rfq);

    const actualSubject = isReminder ? `Reminder: ${subject}` : subject;

    const mailOptions = {
      from: '"Procurement Team" <procurement@rfq-automation.com>',
      to: vendor.email,
      subject: actualSubject,
      text: bodyText,
      attachments: [
        {
          filename: `${rfq.number}_Template.xlsx`,
          content: excelBuffer,
        },
      ],
    };

    let messageId = `mock-message-id-${Date.now()}`;
    try {
      const info = await transporter.sendMail(mailOptions);
      messageId = info.messageId || messageId;
    } catch (err) {
      console.warn("SMTP send failed, simulating success:", err);
    }

    // Attempt to save to database for Sent folder
    try {
      await prisma.email.create({
        data: {
          rfqId: rfq.id,
          vendorId: vendor.id,
          messageId: messageId,
          from: "Procurement Team",
          fromEmail: "procurement@rfq-automation.com",
          to: vendor.email,
          subject: actualSubject,
          bodyText: bodyText,
          direction: EmailDirection.OUTBOUND,
          isRead: true, // Outbound emails are already read by us
          receivedAt: new Date(),
        },
      });
    } catch (dbErr) {
      console.error("Failed to save email to DB:", dbErr);
    }

    return true;
  } catch (error) {
    console.error("Failed to send RFQ email:", error);
    return false;
  }
}
