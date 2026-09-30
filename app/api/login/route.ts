import { NextResponse } from "next/server";
import { getSql } from "../../lib/db";
import { setAuthCookie } from "../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { passcode } = await req.json();
    if (!passcode || typeof passcode !== "string") {
      return NextResponse.json({ ok: false, error: "Passcode required" }, { status: 400 });
    }
    const sql = getSql();
    const rows = await sql`SELECT id, name, role FROM hosts WHERE passcode = ${passcode.trim()}`;
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Not recognised" }, { status: 401 });
    }
    await setAuthCookie(rows[0].id as number);
    return NextResponse.json({ ok: true, host: rows[0] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
