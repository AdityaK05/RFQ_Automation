import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";
import { EmailDirection } from "@prisma/client";
import { processEmailToQuote } from "./parsers";

export async function syncImapEmails() {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST || "imap.ethereal.email",
    port: parseInt(process.env.IMAP_PORT || "993", 10),
    secure: process.env.IMAP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER || "ethereal.user@ethereal.email",
      pass: process.env.SMTP_PASS || "ethereal.password",
    },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      // Fetch unseen messages
      for await (const message of client.fetch("1:*", {
        envelope: true,
        source: true,
      })) {
        if (!message.source) continue;

        const parsed = await simpleParser(message.source);
        const messageId = parsed.messageId || `inbound-${Date.now()}-${Math.random()}`;

        // Check if already exists
        const existing = await prisma.email.findUnique({
          where: { messageId },
        });

        if (existing) continue; // Skip already ingested

        const fromAddress = parsed.from?.value[0]?.address || "unknown@example.com";
        const fromName = parsed.from?.value[0]?.name || fromAddress;

        // Try to associate with a vendor and RFQ by looking up standard emails
        const vendor = await prisma.vendor.findUnique({
          where: { email: fromAddress },
        });

        // Basic thread grouping: check subject for RFQ title or RFQ number
        let rfqId: string | undefined;
        let threadId: string | undefined;

        if (parsed.inReplyTo) {
          const originalOutbound = await prisma.email.findUnique({
            where: { messageId: parsed.inReplyTo },
          });
          if (originalOutbound) {
            rfqId = originalOutbound.rfqId || undefined;
            threadId = originalOutbound.threadId || originalOutbound.messageId || undefined;
          }
        }

        const toAddressObj = Array.isArray(parsed.to) ? parsed.to[0] : parsed.to;
        const toAddress = toAddressObj?.value?.[0]?.address || "procurement@example.com";

        // Save email
        const newEmail = await prisma.email.create({
          data: {
            messageId,
            threadId,
            rfqId,
            vendorId: vendor?.id,
            from: fromName,
            fromEmail: fromAddress,
            to: toAddress,
            subject: parsed.subject || "No Subject",
            bodyText: parsed.text || "",
            bodyHtml: parsed.html || "",
            direction: EmailDirection.INBOUND,
            isRead: false,
            receivedAt: parsed.date || new Date(),
          },
        });
        
        // Pass to Extraction Pipeline if it belongs to an RFQ and Vendor
        if (rfqId && vendor?.id) {
          const attachments = parsed.attachments.map(att => ({
            filename: att.filename || "attachment",
            content: att.content
          }));
          
          await processEmailToQuote(newEmail.id, rfqId, vendor.id, parsed.text || "", attachments);
        }
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error("IMAP Sync Error:", error);
    // If it fails (e.g. ethereal credentials not set or invalid), gracefully return
    // instead of crashing.
  } finally {
    try {
      await client.logout();
    } catch {}
  }
}
