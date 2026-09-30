import { NextResponse } from "next/server";
import { getSql } from "../../lib/db";
import { currentHost } from "../../lib/auth";
import { Sample, priceLine } from "../../lib/see";
import { cleanChoice, splitFor } from "../../lib/pairs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The tasting, guest and producer sides, with an `action` on the way in.
// Guests are gated on knowing the code; producer actions go through
// currentHost(). A guest is never shown a product name before the answers:
// names travel only with the answer.

type Row = Record<string, unknown>;

async function loadByCode(code: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, host_id, name, location, event_code, currency, samples, line_up_locked, revealed
    FROM sessions
    WHERE upper(event_code) = ${code.toUpperCase()}`;
  return { sql, s: (rows[0] as Row) || null };
}

const samplesOf = (s: Row): Sample[] => (Array.isArray(s.samples) ? (s.samples as Sample[]) : []);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || "").toUpperCase();
  if (!code) return NextResponse.json({ ok: false, error: "No code" }, { status: 400 });
  const { sql, s } = await loadByCode(code);
  if (!s) return NextResponse.json({ ok: true, found: false });
  const sid = s.id as number;
  const currency = (s.currency as string) || "£";
  const samples = samplesOf(s);

  // ?attendee=N restores that person's own tasting after a reload.
  type Mine = { pair_choices: unknown; pair_split: number | null; finished: boolean; buy: boolean | null };
  let mine: Mine | null = null;
  const attParam = url.searchParams.get("attendee");
  if (attParam) {
    const aid = parseInt(attParam, 10);
    if (Number.isFinite(aid)) {
      const rows = await sql`
        SELECT pair_choices, pair_split, coalesce(finished, false) AS finished, buy
        FROM tastings WHERE session_id = ${sid} AND attendee_id = ${aid} LIMIT 1`;
      mine = (rows[0] as unknown as Mine) ?? null;
    }
  }

  // The price of the sample this person preferred, for the buy question —
  // the price, not the name.
  let buyAsk: { mat: string; price: string } | null = null;
  if (mine && mine.finished && mine.buy == null) {
    const choices = Array.isArray(mine.pair_choices) ? (mine.pair_choices as { r: number; w: string }[]) : [];
    const fin = choices.find((c) => c.r === 3);
    const sm = fin ? samples.find((x) => x.mat === fin.w) : null;
    if (fin && sm) buyAsk = { mat: fin.w, price: priceLine(currency, sm) };
  }

  // The answers: to everyone once the producer shows them, and to a person
  // the moment they have answered the buy question.
  const show = !!s.revealed || !!(mine && mine.finished && mine.buy != null);
  const answer = show
    ? samples.map((b) => ({ mat: b.mat, name: b.name, producer: b.producer, price: priceLine(currency, b) }))
    : null;

  let room: unknown[] = [];
  if (show) {
    room = await sql`
      SELECT attendee_id, pair_choices, coalesce(finished, false) AS finished, buy
      FROM tastings WHERE session_id = ${sid}`;
  }

  const me = await currentHost();
  let hostSamples: Sample[] | null = null;
  let progress: unknown[] | null = null;
  let hostRoom: unknown[] | null = null;
  if (me && (me.role === "hq" || me.id === s.host_id)) {
    hostSamples = samples;
    progress = await sql`
      SELECT a.id, a.pseudonym,
             coalesce(jsonb_array_length(t.pair_choices), 0) AS chosen,
             coalesce(t.finished, false) AS finished, t.buy
      FROM attendees a
      LEFT JOIN tastings t ON t.attendee_id = a.id
      WHERE a.session_id = ${sid}
      ORDER BY a.created_at`;
    hostRoom = await sql`
      SELECT attendee_id, pair_choices, buy FROM tastings WHERE session_id = ${sid}`;
  }

  return NextResponse.json({
    ok: true,
    found: true,
    session: {
      id: sid, name: s.name, location: s.location, code: s.event_code, currency,
      locked: !!s.line_up_locked, revealed: show, hostRevealed: !!s.revealed,
    },
    mine, buyAsk, answer, room, hostSamples, progress, hostRoom,
  });
}

export async function POST(req: Request) {
  const b = await req.json();
  const code = (b.code || "").toString().toUpperCase();
  if (!code) return NextResponse.json({ ok: false, error: "No code" }, { status: 400 });
  const { sql, s } = await loadByCode(code);
  if (!s) return NextResponse.json({ ok: false, error: "No such code" }, { status: 404 });
  const sid = s.id as number;

  try {
    switch (b.action) {
      // One name to a tasting. The tastings row is made here so the dealt
      // split survives a reload.
      case "join": {
        const pseudonym = (b.pseudonym || "").toString().trim();
        if (!pseudonym) return NextResponse.json({ ok: false, error: "Name required" }, { status: 400 });
        const taken = await sql`
          SELECT 1 FROM attendees
          WHERE session_id = ${sid}
            AND lower(regexp_replace(pseudonym, '\s+', ' ', 'g')) =
                lower(regexp_replace(${pseudonym}, '\s+', ' ', 'g'))
          LIMIT 1`;
        if (taken.length > 0) return NextResponse.json({ ok: false, error: "NAME_TAKEN" }, { status: 409 });
        const rows = await sql`
          INSERT INTO attendees (session_id, pseudonym) VALUES (${sid}, ${pseudonym})
          RETURNING id, pseudonym`;
        const aid = rows[0].id as number;
        const split = splitFor(aid);
        await sql`
          INSERT INTO tastings (session_id, attendee_id, pair_choices, pair_split)
          VALUES (${sid}, ${aid}, '[]'::jsonb, ${split})
          ON CONFLICT (session_id, attendee_id) WHERE attendee_id IS NOT NULL DO NOTHING`;
        return NextResponse.json({ ok: true, attendee: rows[0], split });
      }

      // One comparison, saved the moment it is made; replaced by round so a
      // re-tap cannot write a fourth.
      case "choice": {
        const attendeeId = b.attendeeId ?? null;
        if (attendeeId == null) return NextResponse.json({ ok: false, error: "Join first" }, { status: 400 });
        if (!s.line_up_locked) return NextResponse.json({ ok: false, error: "The tasting has not started" }, { status: 409 });
        const c = cleanChoice(b.choice);
        if (!c) return NextResponse.json({ ok: false, error: "Bad choice" }, { status: 400 });
        await sql`
          INSERT INTO tastings (session_id, attendee_id, pair_choices, pair_split)
          VALUES (${sid}, ${attendeeId}, '[]'::jsonb, ${splitFor(Number(attendeeId))})
          ON CONFLICT (session_id, attendee_id) WHERE attendee_id IS NOT NULL DO NOTHING`;
        const saved = await sql`
          UPDATE tastings t
          SET pair_choices = coalesce((
                SELECT jsonb_agg(e)
                FROM jsonb_array_elements(coalesce(t.pair_choices, '[]'::jsonb)) e
                WHERE (e->>'r')::int IS DISTINCT FROM ${c.r}
              ), '[]'::jsonb) || ${JSON.stringify([c])}::jsonb
          WHERE t.session_id = ${sid} AND t.attendee_id = ${attendeeId}
          RETURNING id, pair_choices`;
        if (saved.length === 0) return NextResponse.json({ ok: false, error: "Could not save that choice" }, { status: 500 });
        await sql`
          UPDATE tastings
          SET finished = jsonb_array_length(coalesce(pair_choices, '[]'::jsonb)) >= 3
          WHERE session_id = ${sid} AND attendee_id = ${attendeeId}`;
        return NextResponse.json({ ok: true, choices: saved[0].pair_choices });
      }

      // Would you buy the one you preferred, at its price. Yes or no, once.
      case "buy": {
        const attendeeId = b.attendeeId ?? null;
        if (attendeeId == null) return NextResponse.json({ ok: false, error: "Join first" }, { status: 400 });
        if (typeof b.buy !== "boolean") return NextResponse.json({ ok: false, error: "Yes or no" }, { status: 400 });
        const rows = await sql`
          UPDATE tastings SET buy = ${b.buy}
          WHERE session_id = ${sid} AND attendee_id = ${attendeeId} AND finished AND buy IS NULL
          RETURNING id`;
        if (rows.length === 0) {
          const had = await sql`SELECT buy FROM tastings WHERE session_id = ${sid} AND attendee_id = ${attendeeId}`;
          if (had.length && had[0].buy != null) return NextResponse.json({ ok: true, buy: had[0].buy });
          return NextResponse.json({ ok: false, error: "Finish the three comparisons first" }, { status: 409 });
        }
        return NextResponse.json({ ok: true, buy: b.buy });
      }

      // Producer: show the answers to everyone at once, or hide them again.
      case "reveal": {
        const me = await currentHost();
        if (!me || (me.role !== "hq" && me.id !== s.host_id)) {
          return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
        }
        await sql`UPDATE sessions SET revealed = ${b.revealed !== false} WHERE id = ${sid}`;
        return NextResponse.json({ ok: true, revealed: b.revealed !== false });
      }

      default:
        return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
