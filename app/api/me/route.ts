import { NextResponse } from "next/server";
import { currentHost } from "../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const host = await currentHost();
  return NextResponse.json({ host });
}
