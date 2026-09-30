"use client";

// One step at a time, with Back and Next (and the arrow keys). Used by the
// producer's guide and by the guide for the people tasting.

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandMark from "../components/BrandMark";
import { Step } from "../lib/guide";

export default function GuideSteps({ head, steps, other }: { head: string; steps: Step[]; other: { href: string; label: string }[] }) {
  const [i, setI] = useState(0);
  const n = steps.length;
  const go = (d: number) => setI((x) => Math.max(0, Math.min(n - 1, x + d)));
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  useEffect(() => { window.scrollTo(0, 0); }, [i]);
  const st = steps[i];
  return (
    <div className="tw-frame">
      <div className="tw-top"><BrandMark /></div>
      <div className="tw-body">
        <span className="tw-eyebrow">{head} · {i + 1} of {n}</span>
        <h1 style={{ fontSize: 30 }}>{st.title}</h1>
        {st.lines.map((l, k) => <p key={k} className="tw-lede" style={{ fontSize: 16, marginTop: 10 }}>{l}</p>)}
        <div style={{ marginTop: 18, border: "1px solid var(--line2)", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
          <img src={st.img} alt={st.alt} style={{ display: "block", width: "100%", height: "auto" }} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button type="button" className="tw-btn ghost" style={{ flex: 1 }} disabled={i === 0} onClick={() => go(-1)}>&larr; Back</button>
          <button type="button" className="tw-btn" style={{ flex: 1 }} disabled={i === n - 1} onClick={() => go(1)}>Next &rarr;</button>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
          {steps.map((_, k) => (
            <button key={k} type="button" aria-label={`Step ${k + 1}`} onClick={() => setI(k)}
              style={{ width: 9, height: 9, borderRadius: 5, border: 0, padding: 0, cursor: "pointer", background: k === i ? "var(--fg)" : "var(--line2)" }} />
          ))}
        </div>
        <p className="tw-lede" style={{ fontSize: 14, marginTop: 22 }}>
          {other.map((o, k) => (
            <span key={o.href}>{k > 0 ? " · " : ""}<Link href={o.href} style={{ color: "var(--gold-deep)" }}>{o.label}</Link></span>
          ))}
        </p>
      </div>
    </div>
  );
}
