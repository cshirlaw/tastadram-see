import { NextResponse } from "next/server";
import { getSql } from "../../lib/db";
import { setAuthCookie } from "../../lib/auth";
import { makePasscode } from "../../lib/codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A producer setting itself up. The only unauthenticated write in the app, so
// it asks for the least it can: the business and who is asking.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const producer = String(body.producer ?? "").trim();
    const person = String(body.person ?? "").trim();
    if (!producer) {
      return NextResponse.json({ ok: false, error: "Enter the name of your business." }, { status: 400 });
    }
    if (producer.length > 120 || person.length > 120) {
      return NextResponse.json({ ok: false, error: "That name is too long." }, { status: 400 });
    }
    const sql = getSql();
    const name = person ? `${producer} — ${person}` : producer;
    // Sign-in is passcode-only, so the passcode must be unused: generate and
    // insert in one statement.
    let host: { id: number; name: string; role: string } | null = null;
    let passcode = "";
    for (let attempt = 0; attempt < 40 && !host; attempt++) {
      passcode = makePasscode(producer, attempt >= 20);
      const rows = await sql`
        INSERT INTO hosts (name, passcode, role)
        SELECT ${name}, ${passcode}, 'host'
        WHERE NOT EXISTS (SELECT 1 FROM hosts WHERE passcode = ${passcode})
        RETURNING id, name, role`;
      if (rows.length > 0) host = rows[0] as { id: number; name: string; role: string };
    }
    if (!host) {
      return NextResponse.json({ ok: false, error: "Could not generate a passcode. Try again." }, { status: 500 });
    }
    await setAuthCookie(host.id);
    return NextResponse.json({ ok: true, passcode, host });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
