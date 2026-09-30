import { NextResponse } from "next/server";
import { getSql } from "../../../lib/db";
import { currentHost } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Archive or bring back. Nothing is destroyed; an archived tasting stops
// counting in the producer's results.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentHost();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const sid = parseInt(id, 10);
  if (!Number.isFinite(sid)) return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const sql = getSql();
  const rows = await sql`SELECT host_id FROM sessions WHERE id = ${sid}`;
  if (!rows.length) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  if (me.role !== "hq" && rows[0].host_id !== me.id) {
    return NextResponse.json({ ok: false, error: "Not yours" }, { status: 403 });
  }
  if (typeof b.archived === "boolean") {
    await sql`UPDATE sessions SET archived = ${b.archived} WHERE id = ${sid}`;
  }
  return NextResponse.json({ ok: true });
}
