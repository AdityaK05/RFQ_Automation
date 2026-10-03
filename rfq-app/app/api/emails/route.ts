import { NextResponse } from "next/server";
import { fetchEmails } from "@/lib/db-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction");

  const emails = await fetchEmails(direction || undefined);
  return NextResponse.json({ emails });
}
