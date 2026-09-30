import { NextResponse } from "next/server";
import { getSql } from "../../lib/db";
import { currentHost } from "../../lib/auth";
import { MATS, Sample, cleanSample } from "../../lib/see";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeCode(location?: string) {
  const prefix = (location || "SEE").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "SEE";
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${digits}`;
}

// The producer's tastings, newest first, with how many people finished.
// HQ sees everyone's.
export async function GET() {
  const me = await currentHost();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const sql = getSql();
  const rows = me.role === "hq"
    ? await sql`
        SELECT s.id, s.name, s.location, s.event_code, s.created_at, s.archived, s.revealed, s.samples, s.currency,
               h.name AS host_name,
               (SELECT count(*)::int FROM tastings t WHERE t.session_id = s.id AND t.finished) AS finished,
               (SELECT count(*)::int FROM attendees a WHERE a.session_id = s.id) AS joined
        FROM sessions s JOIN hosts h ON h.id = s.host_id
        ORDER BY s.created_at DESC`
    : await sql`
        SELECT s.id, s.name, s.location, s.event_code, s.created_at, s.archived, s.revealed, s.samples, s.currency,
               h.name AS host_name,
               (SELECT count(*)::int FROM tastings t WHERE t.session_id = s.id AND t.finished) AS finished,
               (SELECT count(*)::int FROM attendees a WHERE a.session_id = s.id) AS joined
        FROM sessions s JOIN hosts h ON h.id = s.host_id
        WHERE s.host_id = ${me.id}
        ORDER BY s.created_at DESC`;
  return NextResponse.json({ ok: true, sessions: rows });
}

// Create a tasting: a name, where, the currency, and four samples in the
// order they go on A–D. Exactly one sample is the producer's own. The line-up
// is locked from the start, so a guest never waits for anyone.
export async function POST(req: Request) {
  const me = await currentHost();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "Enter a name for the tasting." }, { status: 400 });
  const location = String(b.location ?? "").trim() || null;
  const currency = String(b.currency ?? "£").trim().slice(0, 3) || "£";
  const raw = Array.isArray(b.samples) ? b.samples : [];
  if (raw.length !== 4) return NextResponse.json({ ok: false, error: "Four samples are needed." }, { status: 400 });
  const samples: Sample[] = [];
  for (const [i, r] of raw.entries()) {
    const c = cleanSample(r, MATS[i]);
    if (!c.ok) return NextResponse.json({ ok: false, error: c.error }, { status: 400 });
    samples.push(c.sample);
  }
  if (samples.filter((s) => s.mine).length !== 1) {
    return NextResponse.json({ ok: false, error: "Mark exactly one sample as yours." }, { status: 400 });
  }
  const sql = getSql();
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = makeCode(location ?? undefined);
    try {
      const rows = await sql`
        INSERT INTO sessions (host_id, name, location, event_code, currency, samples, line_up_locked)
        VALUES (${me.id}, ${name}, ${location}, ${code}, ${currency}, ${JSON.stringify(samples)}, true)
        RETURNING id, name, location, event_code, created_at`;
      return NextResponse.json({ ok: true, session: rows[0] });
    } catch (err) {
      const pgCode = (err as { code?: string })?.code;
      const msg = (err as { message?: string })?.message ?? "";
      if (!(pgCode === "23505" || /event_code/i.test(msg))) {
        return NextResponse.json({ ok: false, error: `Could not create the tasting: ${msg || "database error"}` }, { status: 500 });
      }
    }
  }
  return NextResponse.json({ ok: false, error: "Could not allocate a code after several attempts" }, { status: 500 });
}
