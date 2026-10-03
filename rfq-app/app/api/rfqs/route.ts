import { NextResponse } from "next/server";
import { fetchAllRfqs, createRfqRecord, updateRfqRecord, deleteRfqRecord } from "@/lib/db-store";
import { sendRfqEmail } from "@/lib/mailer";

export async function GET() {
  const rfqs = await fetchAllRfqs();
  return NextResponse.json({ rfqs });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Title and at least one line item are required" },
        { status: 400 }
      );
    }
    const created = await createRfqRecord(body);

    if (created.status === "SENT" && created.vendors.length > 0) {
      // Send to each vendor conceptually in background
      for (const vendor of created.vendors) {
        const vendorData = { id: vendor.vendorId, email: vendor.vendorEmail, name: vendor.vendorName };
        const bodyText = body.description || `Please find attached the RFQ for ${created.title}.`;
        await sendRfqEmail(created, vendorData, created.title, bodyText, false);
      }
    }

    return NextResponse.json({ rfq: created }, { status: 201 });
  } catch (_) {
    return NextResponse.json({ error: "Failed to create RFQ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "RFQ ID is required" }, { status: 400 });
    }
    const updated = await updateRfqRecord(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }
    return NextResponse.json({ rfq: updated });
  } catch (_) {
    return NextResponse.json({ error: "Failed to update RFQ" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "RFQ ID is required" }, { status: 400 });
    }
    const deleted = await deleteRfqRecord(id);
    return NextResponse.json({ success: deleted });
  } catch (_) {
    return NextResponse.json({ error: "Failed to delete RFQ" }, { status: 500 });
  }
}
