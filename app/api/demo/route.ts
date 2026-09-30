import { NextResponse } from "next/server";
import { getSql } from "../../lib/db";
import { currentHost } from "../../lib/auth";
import { MATS, Sample } from "../../lib/see";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The demonstration: a tasting that is always there for the signed-in
// producer, four samples on A–D from the start. Created archived, so nothing
// tasted in it counts in the results.
//
// GET  — the current demonstration's code, making one if none exists.
// POST { action: "reset" } — the current one is renamed "Demonstration (used)"
//        and a clean one is made; returns the new code.

const DEMO_NAME = "Demonstration";

// Placeholders, 29 Sep 2026. The names are real products on a UK shelf; the
// prices are round figures to be replaced with the shelf prices.
const DEMO_SAMPLES: Omit<Sample, "id" | "mat">[] = [
  { name: "Oat shoyu", producer: "Slow Sauce", category: "shoyu", price: 9, size: "250 ml", mine: true },
  { name: "Naturally brewed soy sauce", producer: "Kikkoman", category: "soy sauce", price: 2.5, size: "250 ml", mine: false },
  { name: "Organic Japanese shoyu", producer: "Clearspring", category: "shoyu", price: 4.5, size: "250 ml", mine: false },
  { name: "Tamari", producer: "Sanchi", category: "tamari", price: 4, size: "300 ml", mine: false },
];

function samplesJson() {
  return JSON.stringify(DEMO_SAMPLES.map((b, i) => ({
    id: `demo${Date.now().toString(36)}${i}`, ...b, mat: MATS[i],
  })));
}

function makeCode() {
  return `SEE-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function currentDemo(sql: ReturnType<typeof getSql>, hostId: number) {
  const rows = await sql`
    SELECT id, event_code FROM sessions
    WHERE host_id = ${hostId} AND name = ${DEMO_NAME}
    ORDER BY created_at DESC LIMIT 1`;
  return rows[0] as { id: number; event_code: string } | undefined;
}

async function makeDemo(sql: ReturnType<typeof getSql>, hostId: number) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = makeCode();
    try {
      const rows = await sql`
        INSERT INTO sessions (host_id, name, location, event_code, currency, samples, line_up_locked, archived)
        VALUES (${hostId}, ${DEMO_NAME}, 'Demonstration', ${code}, '£', ${samplesJson()}, true, true)
        RETURNING id, event_code`;
      return rows[0] as { id: number; event_code: string };
    } catch (err) {
      const pgCode = (err as { code?: string })?.code;
      if (pgCode !== "23505") throw err;
    }
  }
  throw new Error("Could not allocate a code");
}

export async function GET() {
  const me = await currentHost();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const sql = getSql();
  const cur = (await currentDemo(sql, me.id)) ?? (await makeDemo(sql, me.id));
  return NextResponse.json({ ok: true, code: cur.event_code });
}

export async function POST(req: Request) {
  const me = await currentHost();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (b.action !== "reset") return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  const sql = getSql();
  const cur = await currentDemo(sql, me.id);
  if (cur) await sql`UPDATE sessions SET name = ${`${DEMO_NAME} (used)`} WHERE id = ${cur.id}`;
  const fresh = await makeDemo(sql, me.id);
  return NextResponse.json({ ok: true, code: fresh.event_code });
}
