"use client";

// The tasting, guest side. Four samples A–D, fully blind, three choices: two
// pairs, then the two preferred meet. Then one question: would you buy the
// one you preferred, at its price. Then the names. The guest is never shown a
// product name before that — names travel only with the answer.
//
// Cut from tastaDRAM Tea's Pairs page on 29 Sep 2026; app/lib/pairs.ts has
// the split rotation and why the app deals the pairing.

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import BrandMark from "../../components/BrandMark";
import { S } from "../../lib/strings";
import { PairChoice, nextRound, pairForRound, pairTallies } from "../../lib/pairs";
import { tallyByMat, Answer } from "../../lib/results";

interface State {
  found: boolean;
  session?: { id: number; name: string; location: string | null; code: string; currency: string; locked: boolean; revealed: boolean };
  mine?: { pair_choices: PairChoice[] | null; pair_split: number | null; finished: boolean; buy: boolean | null } | null;
  buyAsk?: { mat: string; price: string } | null;
  answer?: { mat: string; name: string; producer: string | null; price: string }[] | null;
  room?: (Answer & { attendee_id: number | null })[];
}

const KEY = (code: string) => `td_see_${code}`;

// Top level, not inside the component: a component defined inside another
// remounts on every poll and loses its inputs.
function Shell({ eyebrow, err, children }: { eyebrow: string; err: string; children: React.ReactNode }) {
  return (
    <div className="tw-frame">
      <div className="tw-top"><BrandMark /></div>
      <div className="tw-body">
        <span className="tw-eyebrow">{eyebrow}</span>
        {children}
        {err && <div className="tw-err">{err}</div>}
      </div>
    </div>
  );
}

function Bare({ line }: { line: string }) {
  return (
    <div className="tw-frame">
      <div className="tw-top"><BrandMark /></div>
      <div className="tw-body"><p className="tw-lede" style={{ marginTop: 24 }}>{line}</p></div>
    </div>
  );
}

export default function GuestPage() {
  const params = useParams();
  const code = ((Array.isArray(params.code) ? params.code[0] : params.code) || "").toUpperCase();
  const g = S.guest;

  const [st, setSt] = useState<State | null>(null);
  const [me, setMe] = useState<{ id: number; pseudonym: string } | null>(null);
  const [split, setSplit] = useState<number>(0);
  const [choices, setChoices] = useState<PairChoice[]>([]);
  const [buy, setBuy] = useState<boolean | null>(null);
  const [nameIn, setNameIn] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const shownAt = useRef<number>(Date.now());

  const load = useCallback(async (attendee?: number) => {
    const q = attendee ? `&attendee=${attendee}` : "";
    const r = await fetch(`/api/pairs?code=${encodeURIComponent(code)}${q}`, { cache: "no-store" });
    const d = await r.json();
    if (d?.ok) setSt(d);
    return d;
  }, [code]);

  useEffect(() => { load(me?.id); }, [load, me?.id]);

  // Remember who they are on this phone; restore the split and the choices
  // from the server.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(code));
      if (raw) { const v = JSON.parse(raw); if (v?.id) setMe(v); }
    } catch { /* ignore */ }
  }, [code]);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (!me || hydrated) return;
    let gone = false;
    (async () => {
      const resp = await load(me.id);
      if (gone) return;
      const mine = resp?.mine as State["mine"];
      if (mine) {
        if (Array.isArray(mine.pair_choices)) setChoices(mine.pair_choices);
        if (mine.pair_split != null) setSplit(mine.pair_split);
        if (mine.buy != null) setBuy(mine.buy);
      }
      setHydrated(true);
      shownAt.current = Date.now();
    })();
    return () => { gone = true; };
  }, [me, hydrated, load]);

  // The producer's "show the answers" arrives without a refresh.
  useEffect(() => {
    const h = setInterval(() => { load(me?.id); }, 6000);
    return () => clearInterval(h);
  }, [load, me?.id]);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/pairs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ...body }),
      });
      const d = await r.json();
      if (!d?.ok && d?.error !== "NAME_TAKEN") setErr(d?.error || g.somethingWrong);
      return d;
    } finally { setBusy(false); }
  };

  function joinAsAnother() {
    try { localStorage.removeItem(KEY(code)); } catch { /* ignore */ }
    setMe(null); setChoices([]); setSplit(0); setBuy(null); setNameIn(""); setHydrated(false); setErr("");
  }

  if (!st) return <Bare line={g.loading} />;
  if (!st.found) return <Bare line={g.noSession} />;

  const sess = st.session!;
  const eyebrow = `${sess.name}${sess.location ? ` · ${sess.location}` : ""}`;

  const notYou = (
    <p className="tw-lede" style={{ fontSize: 13, marginTop: 18 }}>
      {g.notYou}{" "}
      <button type="button" className="link-btn" style={{ color: "var(--gold-deep)" }} onClick={joinAsAnother}>
        {g.joinAsAnother}
      </button>
    </p>
  );

  // ------------------------------------------------------------------ join
  if (!me) {
    return (
      <Shell eyebrow={eyebrow} err={err}>
        <h1>{g.joinTitle}</h1>
        <label className="tw-label" htmlFor="nm">{g.yourName}</label>
        <input id="nm" className="tw-input" value={nameIn} autoFocus
          onChange={(e) => setNameIn(e.target.value)} placeholder={g.yourNamePh} />
        <p className="tw-lede" style={{ fontSize: 13, marginTop: 8 }}>{g.anonNote}</p>
        <div className="tw-spacer" />
        <button className="tw-btn" disabled={!nameIn.trim() || busy}
          onClick={async () => {
            const d = await post({ action: "join", pseudonym: nameIn.trim() });
            if (d?.error === "NAME_TAKEN") { setErr(g.nameTaken); return; }
            if (d?.ok) {
              setMe(d.attendee);
              if (typeof d.split === "number") setSplit(d.split);
              setHydrated(true);
              shownAt.current = Date.now();
              try { localStorage.setItem(KEY(code), JSON.stringify(d.attendee)); } catch { /* ignore */ }
            }
          }}>
          {g.joinBtn}
        </button>
      </Shell>
    );
  }

  // --------------------------------------------------------- the answers
  if (sess.revealed && st.answer) {
    const nameOn = (mat: string) => st.answer!.find((a) => a.mat === mat)?.name || "—";
    const priceOn = (mat: string) => st.answer!.find((a) => a.mat === mat)?.price || "";
    const finalChoice = choices.find((c) => c.r === 3);
    const room = (st.room || []).filter((r) => Array.isArray(r.pair_choices) && r.pair_choices.length > 0);
    const tally = tallyByMat(room);
    const ranked = [...st.answer].sort((a, b) => (tally[b.mat]?.preferred ?? 0) - (tally[a.mat]?.preferred ?? 0));
    const detail = pairTallies(room.map((r) => r.pair_choices as PairChoice[]));
    return (
      <Shell eyebrow={eyebrow} err={err}>
        <h1>{g.answersTitle}</h1>
        {finalChoice && (
          <div className="tw-callout gold" style={{ marginTop: 12 }}>
            <span className="k">{g.yourPick}</span>
            <div className="v">{finalChoice.w} — {nameOn(finalChoice.w)}</div>
            {buy != null && <p className="p">{g.yourBuy(buy, priceOn(finalChoice.w))}</p>}
          </div>
        )}
        <span className="tw-eyebrow" style={{ marginTop: 22 }}>{g.roomHead}</span>
        <div className="tw-reveal" style={{ marginTop: 10 }}>
          {ranked.map((a, i) => {
            const t = tally[a.mat];
            return (
              <div key={a.mat} className="tw-card2" style={{ marginBottom: 0 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 19 }}>{i + 1}. {a.name}</div>
                <div style={{ fontSize: 13, color: "var(--fg-faint)", marginTop: 3 }}>
                  {a.producer ? `${a.producer} · ` : ""}{g.was(a.mat, a.name)} · {a.price}
                </div>
                <div style={{ fontSize: 14, color: "var(--fg-soft)", marginTop: 6 }}>
                  {g.preferred(t?.preferred ?? 0)}{t && t.asked > 0 ? ` · ${g.wouldBuy(t.wouldBuy, t.asked)}` : ""}
                </div>
              </div>
            );
          })}
        </div>
        {detail.length > 0 && (
          <>
            <span className="tw-eyebrow" style={{ marginTop: 22 }}>{g.detailHead}</span>
            <table className="tw-table" style={{ marginTop: 8 }}>
              <tbody>
                {detail.map((d) => (
                  <tr key={`${d.a}${d.b}`}>
                    <td>{d.a}</td>
                    <td style={{ textAlign: "center" }}>{d.aWins} : {d.bWins}</td>
                    <td style={{ textAlign: "right" }}>{d.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {notYou}
      </Shell>
    );
  }

  // ------------------------------------------------------------- waiting
  if (!sess.locked) {
    return (
      <Shell eyebrow={eyebrow} err={err}>
        <h1>{g.waiting}</h1>
        {notYou}
      </Shell>
    );
  }

  // ---------------------------------------------------- the buy question
  const round = nextRound(choices);
  if (round > 3) {
    const finalChoice = choices.find((c) => c.r === 3);
    const ask = st.buyAsk ?? null;
    if (buy == null && finalChoice) {
      const price = ask?.price ?? "";
      return (
        <Shell eyebrow={eyebrow} err={err}>
          <h1>{g.buyTitle} {finalChoice.w}.</h1>
          <p className="tw-lede" style={{ fontSize: 17, marginTop: 10 }}>{g.buyQ(finalChoice.w, price)}</p>
          <div className="tw-glasses" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 18 }}>
            {[true, false].map((v) => (
              <button key={String(v)} className="tw-glass" disabled={busy || !price}
                onClick={async () => {
                  const d = await post({ action: "buy", attendeeId: me.id, buy: v });
                  if (d?.ok) { setBuy(v); await load(me.id); }
                }}>
                <div className="lab">{v ? g.yes : g.no}</div>
              </button>
            ))}
          </div>
          {notYou}
        </Shell>
      );
    }
    return (
      <Shell eyebrow={eyebrow} err={err}>
        <h1>{g.done}</h1>
        {notYou}
      </Shell>
    );
  }

  // ------------------------------------------------------------ a round
  const pair = pairForRound(split, choices, round);
  if (!pair) return <Bare line={g.loading} />;
  const [a, b] = pair;
  const tap = async (w: string) => {
    const ms = Date.now() - shownAt.current;
    const choice: PairChoice = { r: round, a, b, w, ms };
    setChoices((cs) => cs.filter((c) => c.r !== round).concat(choice));
    shownAt.current = Date.now();
    await post({ action: "choice", attendeeId: me.id, choice });
    if (round === 3) await load(me.id);
  };
  return (
    <Shell eyebrow={eyebrow} err={err}>
      <h1>{g.roundOf(round)}</h1>
      {round === 3 && <p className="tw-lede" style={{ fontSize: 15, marginTop: 6 }}>{g.finalRound}</p>}
      <p className="tw-lede" style={{ fontSize: 15, marginTop: 6 }}>{g.tastePair(a, b)} {g.whichPrefer}</p>
      <div className="tw-glasses" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 18 }}>
        <button className="tw-glass" disabled={busy} onClick={() => tap(a)}><div className="lab">{a}</div></button>
        <button className="tw-glass" disabled={busy} onClick={() => tap(b)}><div className="lab">{b}</div></button>
      </div>
      {notYou}
    </Shell>
  );
}
