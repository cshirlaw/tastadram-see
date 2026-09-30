"use client";

// The tasting, producer side. The link and the QR first, because at a stall
// or a table that is the thing to show; then the four samples on A–D; the
// result as people finish; who has tasted; and More for the rest.
// The line-up is set at creation, so there is nothing to lock here.

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import BrandMark from "../../../components/BrandMark";
import { S } from "../../../lib/strings";
import { Sample, priceLine } from "../../../lib/see";
import { PairChoice, pairTallies } from "../../../lib/pairs";
import { tallyByMat, Answer } from "../../../lib/results";

interface Progress { id: number; pseudonym: string; chosen: number; finished: boolean; buy: boolean | null }

export default function HostPage() {
  const params = useParams();
  const router = useRouter();
  const code = ((Array.isArray(params.code) ? params.code[0] : params.code) || "").toUpperCase();
  const h = S.host;

  const [d, setD] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [more, setMore] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [archived, setArchived] = useState<boolean | null>(null);

  const sess = (d?.session ?? null) as { id: number; name: string; location: string | null; code: string; currency: string; revealed: boolean; hostRevealed: boolean } | null;
  const samples = ((d?.hostSamples ?? []) as Sample[] | null) ?? [];
  const progress = ((d?.progress ?? []) as Progress[] | null) ?? [];
  const hostRoom = ((d?.hostRoom ?? []) as (Answer & { attendee_id: number | null })[] | null) ?? [];

  const load = useCallback(async () => {
    const r = await fetch(`/api/pairs?code=${encodeURIComponent(code)}`, { cache: "no-store" });
    const j = await r.json();
    if (j?.ok) setD(j);
  }, [code]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/demo", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.ok && j.code) setDemoCode(String(j.code).toUpperCase()); }).catch(() => {});
  }, []);
  useEffect(() => { const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  const link = typeof window !== "undefined" ? `${window.location.origin}/p/${code}` : "";
  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { width: 480, margin: 1, color: { dark: "#1b2235", light: "#ffffff" } })
      .then(setQrUrl).catch(() => {});
  }, [link]);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/pairs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ...body }),
      });
      const j = await r.json();
      if (!j?.ok) setErr(j?.error || S.guest.somethingWrong);
      else await load();
      return j;
    } finally { setBusy(false); }
  };

  async function resetDemo() {
    setMsg("");
    const r = await fetch("/api/demo", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    const j = await r.json();
    if (j?.ok && j.code) { setMsg(h.resetDemoDone); router.push(`/p/${j.code}/host`); }
    else setMsg(j?.error || S.admin.failed);
  }

  async function setArchive(v: boolean) {
    if (!sess) return;
    const r = await fetch(`/api/sessions/${sess.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: v }),
    });
    const j = await r.json();
    if (j?.ok) { setArchived(v); setMsg(v ? h.archived : ""); }
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/admin");
  }

  if (!d) return <div className="tw-admin"><p className="tw-lede">{S.guest.loading}</p></div>;
  if (!sess) return <div className="tw-admin"><p className="tw-lede">{S.guest.noSession}</p></div>;
  if (!d.hostSamples) {
    return (
      <div className="tw-admin">
        <p className="tw-lede">{h.signInFirst}</p>
        <Link className="tw-btn" href="/admin" style={{ display: "inline-block", marginTop: 12 }}>{h.signIn}</Link>
      </div>
    );
  }

  const isDemo = demoCode !== null && demoCode === code;
  const answered = hostRoom.filter((r) => Array.isArray(r.pair_choices) && r.pair_choices.length > 0);
  const tally = tallyByMat(answered);
  const detail = pairTallies(answered.map((r) => r.pair_choices as PairChoice[]));
  const finished = progress.filter((p) => p.finished).length;
  const ranked = [...samples].sort((a, b) => (tally[b.mat]?.preferred ?? 0) - (tally[a.mat]?.preferred ?? 0));
  const chip: React.CSSProperties = { width: "auto", flex: "0 0 auto", padding: "8px 14px", fontSize: 13.5, textDecoration: "none" };

  return (
    <div className="tw-admin" style={{ maxWidth: 720 }}>
      <div className="tw-top"><BrandMark /><span className="tw-exit">{sess.code}</span></div>

      <h1 style={{ marginTop: 16 }}>{sess.name}</h1>
      {sess.location && <p className="tw-lede" style={{ marginTop: 4, fontSize: 15 }}>{sess.location}</p>}

      <span className="tw-eyebrow" style={{ marginTop: 16 }}>{h.sendLinkHead}</span>
      <p style={{ fontSize: 17, fontWeight: 600, marginTop: 6, wordBreak: "break-all", userSelect: "all" as const }}>
        {link.replace(/^https?:\/\//, "")}
      </p>
      <p style={{ fontSize: 15, marginTop: 4 }}>{h.codeWord} <span className="tw-code">{sess.code}</span></p>
      {qrUrl && (
        <img src={qrUrl} alt={link} width={240} height={240}
          style={{ display: "block", width: 240, height: 240, maxWidth: "100%", margin: "10px 0 0", border: "1px solid var(--line2)" }} />
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <button type="button" className="tw-grade" style={chip}
          onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? h.copied : h.copyLink}
        </button>
        {qrUrl && <a className="tw-grade" style={chip} href={qrUrl} download={`tasting-${sess.code}.png`}>QR</a>}
      </div>

      <div className="tw-callout gold" style={{ marginTop: 18 }}>
        <p className="p" style={{ margin: 0 }}>{h.beforeLine}</p>
      </div>

      <span className="tw-eyebrow" style={{ marginTop: 22 }}>{h.samplesHead}</span>
      <div style={{ marginTop: 8 }}>
        {samples.map((b) => (
          <div key={b.id} className="tw-card2" style={{ marginTop: 8, marginBottom: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 18 }}>
                {b.name}{b.mine ? <span style={{ fontSize: 12, color: "var(--gold-deep)", marginLeft: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h.yours}</span> : null}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--fg-faint)" }}>
                {[b.producer, b.category, priceLine(sess.currency, b)].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 26 }}>{b.mat}</div>
          </div>
        ))}
      </div>

      {err && <div className="tw-err" style={{ marginTop: 10 }}>{err}</div>}

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        {!sess.hostRevealed && (
          <button className="tw-btn" style={{ width: "auto" }} disabled={busy}
            onClick={() => post({ action: "reveal", revealed: true })}>{h.revealBtn}</button>
        )}
        {sess.hostRevealed && (
          <button className="tw-btn ghost" style={{ width: "auto" }} disabled={busy}
            onClick={() => post({ action: "reveal", revealed: false })}>{h.unrevealBtn}</button>
        )}
      </div>

      <span className="tw-eyebrow" style={{ marginTop: 28 }}>{h.resultsHead}</span>
      <table className="tw-table" style={{ marginTop: 8 }}>
        <thead><tr><th>{h.colSample}</th><th style={{ textAlign: "right" }}>{h.colPreferred}</th><th style={{ textAlign: "right" }}>{h.colBuy}</th></tr></thead>
        <tbody>
          {ranked.map((b) => {
            const t = tally[b.mat];
            return (
              <tr key={b.mat}>
                <td>{b.mat} — {b.name}{b.mine ? " ★" : ""}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{t?.preferred ?? 0}{finished ? ` of ${finished}` : ""}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{t && t.asked > 0 ? `${t.wouldBuy} of ${t.asked}` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {detail.length > 0 && (
        <>
          <span className="tw-eyebrow" style={{ marginTop: 20 }}>{h.detailHead}</span>
          <table className="tw-table" style={{ marginTop: 8 }}>
            <tbody>
              {detail.map((x) => (
                <tr key={`${x.a}${x.b}`}>
                  <td>{x.a}</td>
                  <td style={{ textAlign: "center" }}>{x.aWins} : {x.bWins}</td>
                  <td style={{ textAlign: "right" }}>{x.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <span className="tw-eyebrow" style={{ marginTop: 28 }}>{h.roomHead}</span>
      <table className="tw-table" style={{ marginTop: 8 }}>
        <thead><tr><th>{h.colWho}</th><th>{h.colTasted}</th><th>{h.colFinished}</th></tr></thead>
        <tbody>
          {progress.map((p) => (
            <tr key={p.id}>
              <td>{p.pseudonym}</td>
              <td>{h.nOfM(p.chosen, 3)}</td>
              <td>{p.finished && p.buy != null ? h.yes : "—"}</td>
            </tr>
          ))}
          {progress.length === 0 && <tr><td colSpan={3}>{h.nobodyJoined}</td></tr>}
        </tbody>
      </table>

      <button type="button" className="tw-grade" onClick={() => setMore((m) => !m)}
        style={{ width: "100%", marginTop: 28, textAlign: "left", display: "flex", justifyContent: "space-between", padding: "12px 14px" }}>
        <span style={{ fontWeight: 600 }}>{h.more}</span>
        <span aria-hidden="true">{more ? "⌄" : "›"}</span>
      </button>

      {more && (
        <div className="tw-card2" style={{ marginTop: 8 }}>
          {isDemo ? (
            <button className="tw-btn ghost" style={{ width: "auto" }} disabled={busy} onClick={resetDemo}>{h.resetDemo}</button>
          ) : (
            <button className="tw-btn ghost" style={{ width: "auto" }} disabled={busy} onClick={() => setArchive(!(archived ?? false))}>
              {archived ? h.unarchive : h.archive}
            </button>
          )}
          {msg && <div className="tw-ok">{msg}</div>}
          <p className="tw-lede" style={{ fontSize: 13, marginTop: 18, color: "var(--fg-faint)" }}>
            <Link href="/admin" style={{ color: "var(--fg-soft)" }}>{h.sessionsList}</Link>
            {" · "}<button type="button" className="link-btn" onClick={signOut} style={{ color: "var(--fg-soft)" }}>{h.signOut}</button>
          </p>
        </div>
      )}
    </div>
  );
}
