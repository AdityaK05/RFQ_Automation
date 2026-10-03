import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const rfqId = searchParams.get("rfqId");

  try {
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (rfqId) whereClause.rfqId = rfqId;
    const quotes = await prisma.quote.findMany({
      where: whereClause,
      include: {
        vendor: true,
        rfq: true,
        items: true,
      },
      orderBy: { confidence: 'asc' }, // Review list: low-confidence first
    });
    return NextResponse.json({ quotes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Quote ID required" }, { status: 400 });
    }
    
    // Check if it's a bulk approval
    if (body.bulkApproveIds && Array.isArray(body.bulkApproveIds)) {
       await prisma.quote.updateMany({
         where: { id: { in: body.bulkApproveIds } },
         data: { status: "RECEIVED" }
       });
       return NextResponse.json({ success: true });
    }

    const { id, items, vendor, rfq, ...updateData } = body;
    
    // We only update the parent quote here for simplicity in this phase.
    // If you need to update items, you can loop over them.
    const updated = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        vendor: true,
        rfq: true,
        items: true,
      },
    });
    
    return NextResponse.json({ quote: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
