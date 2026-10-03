import { NextResponse } from "next/server";
import { fetchAllRfqs } from "@/lib/db-store";
import { sendRfqEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rfqId, vendorId, isReminder = false } = body;

    if (!rfqId || !vendorId) {
      return NextResponse.json(
        { error: "rfqId and vendorId are required" },
        { status: 400 }
      );
    }

    const rfqs = await fetchAllRfqs();
    const rfq = rfqs.find((r) => r.id === rfqId);
    if (!rfq) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    const vendor = rfq.vendors.find((v) => v.vendorId === vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not associated with this RFQ" },
        { status: 404 }
      );
    }

    const vendorData = {
      id: vendor.vendorId,
      email: vendor.vendorEmail,
      name: vendor.vendorName,
    };

    const subject = rfq.title;
    const bodyText = rfq.description || `Please find attached the RFQ for ${rfq.title}.`;

    const success = await sendRfqEmail(rfq, vendorData, subject, bodyText, isReminder);

    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
