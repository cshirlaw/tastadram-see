import { NextResponse } from "next/server";
import { getSql } from "../../lib/db";
import { currentHost } from "../../lib/auth";
import { Sample } from "../../lib/see";
import { Answer, totalsByProduct } from "../../lib/results";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The producer's products across every tasting that is not archived.
export async function GET() {
  const me = await currentHost();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const sql = getSql();
  const sessions = me.role === "hq"
    ? await sql`SELECT id, samples FROM sessions WHERE NOT archived`
    : await sql`SELECT id, samples FROM sessions WHERE host_id = ${me.id} AND NOT archived`;
  const ids = sessions.map((s) => s.id as number);
  const answers = ids.length
    ? await sql`SELECT session_id, pair_choices, buy, finished FROM tastings WHERE session_id = ANY(${ids})`
    : [];
  const rows = sessions.map((s) => ({
    samples: (Array.isArray(s.samples) ? s.samples : []) as Sample[],
    answers: answers.filter((a) => a.session_id === s.id) as unknown as Answer[],
  }));
  return NextResponse.json({ ok: true, products: totalsByProduct(rows) });
}
