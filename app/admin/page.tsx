"use client";

// The producer's console: sign in or set up a login; a new tasting with its
// four samples; the tastings so far; every product across all of them; and
// the passcode. Nothing else.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandMark from "../components/BrandMark";
import { S, CURRENCIES } from "../lib/strings";
import { Sample } from "../lib/see";
import { ProductTotal } from "../lib/results";

interface Host { id: number; name: string; role: string }
interface SessionRow {
  id: number; name: string; location: string | null; event_code: string; created_at: string;
  archived: boolean; revealed: boolean; samples: Sample[] | null; currency: string; host_name: string;
  finished: number; joined: number;
}
type SampleIn = { name: string; producer: string; category: string; price: string; size: string };
const EMPTY: SampleIn = { name: "", producer: "", category: "", price: "", size: "" };

const when = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function AdminPage() {
  const router = useRouter();
  const a = S.admin;
  const [me, setMe] = useState<Host | null | undefined>(undefined);

  // sign in / set up
  const [passcode, setPasscode] = useState("");
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [producer, setProducer] = useState("");
  const [person, setPerson] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(true);
  const [err, setErr] = useState("");

  // new tasting
  const [cName, setCName] = useState("");
  const [cLoc, setCLoc] = useState("");
  const [cCur, setCCur] = useState<string>("£");
  const [samples, setSamples] = useState<SampleIn[]>([{ ...EMPTY }, { ...EMPTY }, { ...EMPTY }, { ...EMPTY }]);
  const [mine, setMine] = useState<number>(0);
  const [createErr, setCreateErr] = useState("");
  const [creating, setCreating] = useState(false);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [products, setProducts] = useState<ProductTotal[]>([]);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  // passcode
  const [pc1, setPc1] = useState("");
  const [pc2, setPc2] = useState("");
  const [pcMsg, setPcMsg] = useState("");

  const loadMe = useCallback(async () => {
    const r = await fetch("/api/me", { cache: "no-store" });
    const j = await r.json();
    setMe(j.host ?? null);
  }, []);
  const loadAll = useCallback(async () => {
    const [s, p, d] = await Promise.all([
      fetch("/api/sessions", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch("/api/results", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch("/api/demo", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ]);
    if (s?.ok) setSessions(s.sessions as SessionRow[]);
    if (p?.ok) setProducts(p.products as ProductTotal[]);
    if (d?.ok && d.code) setDemoCode(String(d.code).toUpperCase());
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);
  useEffect(() => { if (me) loadAll(); }, [me, loadAll]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode }) });
    const j = await r.json();
    if (!j.ok) { setErr(j.error || a.failed); return; }
    setPasscode(""); loadMe();
  }

  async function register(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const r = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ producer, person }) });
    const j = await r.json();
    if (!j.ok) { setErr(j.error || a.failed); return; }
    setNewCode(j.passcode); loadMe();
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    setMe(null); setNewCode(null); setSessions([]); setProducts([]);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault(); setCreateErr("");
    if (!cName.trim()) { setCreateErr(a.errName); return; }
    setCreating(true);
    try {
      const body = {
        name: cName, location: cLoc, currency: cCur,
        samples: samples.map((s, i) => ({ ...s, mine: i === mine })),
      };
      const r = await fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!j.ok) { setCreateErr(j.error || a.failed); return; }
      router.push(`/p/${j.session.event_code}/host`);
    } finally { setCreating(false); }
  }

  async function changePasscode(e: React.FormEvent) {
    e.preventDefault(); setPcMsg("");
    if (pc1 !== pc2) { setPcMsg(a.noMatch); return; }
    const r = await fetch("/api/change-passcode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPasscode: pc1 }) });
    const j = await r.json();
    setPcMsg(j.ok ? a.passcodeChanged : j.error || a.failed);
    if (j.ok) { setPc1(""); setPc2(""); }
  }

  const setS = (i: number, k: keyof SampleIn, v: string) =>
    setSamples((prev) => prev.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  if (me === undefined) return <div className="tw-admin"><p className="tw-lede">{S.guest.loading}</p></div>;

  // ------------------------------------------------------- not signed in
  if (!me) {
    return (
      <div className="tw-admin" style={{ maxWidth: 460 }}>
        <div className="tw-top"><BrandMark /></div>
        {mode === "signin" ? (
          <form onSubmit={signIn} style={{ marginTop: 20 }}>
            <h1>{a.signInHead}</h1>
            <p className="tw-lede" style={{ fontSize: 15, marginTop: 6 }}>{a.signInLede}</p>
            <label className="tw-label" htmlFor="pc" style={{ marginTop: 16 }}>{a.passcode}</label>
            <input id="pc" className="tw-input" value={passcode} onChange={(e) => setPasscode(e.target.value)} autoFocus autoCapitalize="none" autoComplete="off" />
            {err && <div className="tw-err">{err}</div>}
            <button className="tw-btn" type="submit" style={{ marginTop: 14 }} disabled={!passcode.trim()}>{a.signIn}</button>
            <p className="tw-lede" style={{ fontSize: 14, marginTop: 16 }}>
              <button type="button" className="link-btn" style={{ color: "var(--gold-deep)" }} onClick={() => { setMode("register"); setErr(""); }}>{a.noLogin}</button>
            </p>
          </form>
        ) : (
          <form onSubmit={register} style={{ marginTop: 20 }}>
            <h1>{a.registerHead}</h1>
            <p className="tw-lede" style={{ fontSize: 15, marginTop: 6 }}>{a.registerLede}</p>
            <label className="tw-label" htmlFor="pr" style={{ marginTop: 16 }}>{a.producer}</label>
            <input id="pr" className="tw-input" value={producer} onChange={(e) => setProducer(e.target.value)} placeholder={a.producerPh} autoFocus />
            <label className="tw-label" htmlFor="pe" style={{ marginTop: 12 }}>{a.person}</label>
            <input id="pe" className="tw-input" value={person} onChange={(e) => setPerson(e.target.value)} placeholder={a.personPh} />
            {err && <div className="tw-err">{err}</div>}
            <button className="tw-btn" type="submit" style={{ marginTop: 14 }} disabled={!producer.trim()}>{a.registerBtn}</button>
            <p className="tw-lede" style={{ fontSize: 14, marginTop: 16 }}>
              <button type="button" className="link-btn" style={{ color: "var(--gold-deep)" }} onClick={() => { setMode("signin"); setErr(""); }}>{a.backToSignIn}</button>
            </p>
          </form>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------- signed in
  return (
    <div className="tw-admin">
      <div className="tw-top">
        <BrandMark />
        <span className="tw-exit">{me.name} · <Link href="/guide" style={{ color: "var(--gold-deep)" }}>{a.guide}</Link></span>
      </div>

      {newCode && (
        <div className="tw-callout gold" style={{ marginTop: 16 }}>
          <span className="k">{a.passcodeHead}</span>
          <div className="v">{showCode ? newCode : "••••••••"}</div>
          <p className="p">{a.passcodeLede}</p>
          <button type="button" className="link-btn" onClick={() => setShowCode((v) => !v)}>{showCode ? "Hide" : "Show"}</button>
        </div>
      )}

      {/* the demonstration */}
      {demoCode && (
        <div className="tw-card2" style={{ marginTop: 16 }}>
          <span className="tw-eyebrow">{a.demoHead}</span>
          <p className="tw-lede" style={{ fontSize: 15, marginTop: 6 }}>{a.demoLine}</p>
          <Link className="tw-btn" href={`/p/${demoCode}/host`} style={{ display: "inline-block", width: "auto", marginTop: 12 }}>{a.demoOpen}</Link>
        </div>
      )}

      {/* new tasting */}
      <form className="tw-card2" onSubmit={create} style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 22 }}>{a.createHead}</h2>
        <div className="tw-row2" style={{ marginTop: 12 }}>
          <div>
            <label className="tw-label" htmlFor="cn">{a.sessionName}</label>
            <input id="cn" className="tw-input" value={cName} onChange={(e) => setCName(e.target.value)} placeholder={a.sessionNamePh} />
          </div>
          <div>
            <label className="tw-label" htmlFor="cl">{a.location}</label>
            <input id="cl" className="tw-input" value={cLoc} onChange={(e) => setCLoc(e.target.value)} placeholder={a.locationPh} />
          </div>
        </div>
        <div style={{ marginTop: 12, maxWidth: 160 }}>
          <label className="tw-label" htmlFor="cc">{a.currency}</label>
          <select id="cc" className="tw-input" value={cCur} onChange={(e) => setCCur(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <span className="tw-eyebrow" style={{ marginTop: 22 }}>{a.samplesHead}</span>
        <p className="tw-lede" style={{ fontSize: 14, marginTop: 4 }}>{a.samplesLede}</p>
        {samples.map((s, i) => (
          <div key={i} style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--serif)", fontSize: 18 }}>{["A", "B", "C", "D"][i]}</span>
              <label style={{ fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="radio" name="mine" checked={mine === i} onChange={() => setMine(i)} />
                {a.mine}
              </label>
            </div>
            <div className="tw-row2" style={{ marginTop: 8 }}>
              <div>
                <label className="tw-label">{a.name}</label>
                <input className="tw-input" value={s.name} onChange={(e) => setS(i, "name", e.target.value)} placeholder={i === 0 ? a.namePh : ""} />
              </div>
              <div>
                <label className="tw-label">{a.producerOf}</label>
                <input className="tw-input" value={s.producer} onChange={(e) => setS(i, "producer", e.target.value)} placeholder={i === 0 ? a.producerOfPh : ""} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 1fr", gap: 12, marginTop: 8 }}>
              <div>
                <label className="tw-label">{a.category}</label>
                <input className="tw-input" value={s.category} onChange={(e) => setS(i, "category", e.target.value)} placeholder={i === 0 ? a.categoryPh : ""} />
              </div>
              <div>
                <label className="tw-label">{a.price}</label>
                <input className="tw-input" inputMode="decimal" value={s.price} onChange={(e) => setS(i, "price", e.target.value)} placeholder={cCur} />
              </div>
              <div>
                <label className="tw-label">{a.size}</label>
                <input className="tw-input" value={s.size} onChange={(e) => setS(i, "size", e.target.value)} placeholder={i === 0 ? a.sizePh : ""} />
              </div>
            </div>
          </div>
        ))}
        {createErr && <div className="tw-err">{createErr}</div>}
        <button className="tw-btn" type="submit" style={{ marginTop: 18, width: "auto" }} disabled={creating}>{a.createBtn}</button>
      </form>

      {/* the tastings */}
      <div className="tw-card2">
        <h2 style={{ fontSize: 22 }}>{a.sessionsHead}</h2>
        {sessions.length === 0 ? (
          <p className="tw-lede" style={{ fontSize: 15 }}>{a.noSessions}</p>
        ) : (
          <table className="tw-table" style={{ marginTop: 10 }}>
            <thead><tr><th>{a.colTasting}</th><th style={{ textAlign: "right" }}>{a.colPeople}</th><th></th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} style={{ opacity: s.archived ? 0.55 : 1 }}>
                  <td>
                    {s.name}
                    <div style={{ fontSize: 12.5, color: "var(--fg-faint)", marginTop: 2 }}>
                      {[when(s.created_at), s.location, me.role === "hq" ? s.host_name : null].filter(Boolean).join(" · ")}
                      {" · "}<span className="tw-code" style={{ fontSize: 13 }}>{s.event_code}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{s.finished}{s.joined !== s.finished ? ` of ${s.joined}` : ""}</td>
                  <td style={{ whiteSpace: "nowrap" }}><Link href={`/p/${s.event_code}/host`} style={{ color: "var(--gold-deep)" }}>{a.open} →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* every product, all tastings together */}
      <div className="tw-card2">
        <h2 style={{ fontSize: 22 }}>{a.resultsHead}</h2>
        <p className="tw-lede" style={{ fontSize: 14, marginTop: 4 }}>{a.resultsLede}</p>
        {products.length === 0 ? (
          <p className="tw-lede" style={{ fontSize: 15 }}>{a.noResults}</p>
        ) : (
          <table className="tw-table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>{a.colProduct}</th>
                <th style={{ textAlign: "right" }}>{S.host.colPreferred}</th>
                <th style={{ textAlign: "right" }}>{S.host.colBuy}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.name.toLowerCase()}>
                  <td>
                    {p.name}{p.mine ? " ★" : ""}
                    <div style={{ fontSize: 12.5, color: "var(--fg-faint)", marginTop: 2 }}>
                      {[p.producer, a.tastingsTasters(p.tastings, p.tasters)].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{p.preferred}{p.tasters ? ` of ${p.tasters}` : ""}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{p.asked ? `${p.wouldBuy} of ${p.asked}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* passcode, sign out */}
      <form className="tw-card2" onSubmit={changePasscode}>
        <h2 style={{ fontSize: 22 }}>{a.changeHead}</h2>
        <p className="tw-lede" style={{ fontSize: 14, marginTop: 4 }}>{a.changeLede}</p>
        <div className="tw-row2" style={{ marginTop: 10 }}>
          <div>
            <label className="tw-label" htmlFor="p1">{a.newPasscode}</label>
            <input id="p1" className="tw-input" value={pc1} onChange={(e) => setPc1(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label className="tw-label" htmlFor="p2">{a.repeatIt}</label>
            <input id="p2" className="tw-input" value={pc2} onChange={(e) => setPc2(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        {pcMsg && <div className="tw-ok">{pcMsg}</div>}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 12 }}>
          <button className="tw-btn" type="submit" style={{ width: "auto" }} disabled={pc1.length < 4}>{a.changeBtn}</button>
          <button type="button" className="link-btn" onClick={signOut}>{a.signOut}</button>
        </div>
      </form>
    </div>
  );
}
