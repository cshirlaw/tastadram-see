import { NextResponse } from "next/server";
import { getSql } from "../../lib/db";
import { currentHost } from "../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A signed-in host sets their own passcode. Cookie is signed by host id (not
// passcode), so no re-login is needed.
export async function POST(req: Request) {
  const me = await currentHost();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { newPasscode } = await req.json();
  const pc = (newPasscode || "").toString().trim();
  if (pc.length < 4) {
    return NextResponse.json({ ok: false, error: "Use at least 4 characters" }, { status: 400 });
  }
  const sql = getSql();
  const dupe = await sql`SELECT id FROM hosts WHERE passcode = ${pc} AND id <> ${me.id}`;
  if (dupe.length > 0) {
    return NextResponse.json({ ok: false, error: "That passcode is already in use" }, { status: 409 });
  }
  await sql`UPDATE hosts SET passcode = ${pc} WHERE id = ${me.id}`;
  return NextResponse.json({ ok: true });
}
