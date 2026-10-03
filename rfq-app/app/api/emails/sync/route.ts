import { NextResponse } from "next/server";
import { syncImapEmails } from "@/lib/imap-service";

export async function POST() {
  try {
    await syncImapEmails();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to sync emails" }, { status: 500 });
  }
}
