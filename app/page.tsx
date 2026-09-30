"use client";

// The front page, in the layout of the 19 Sep 2026 redesign: the four marks
// in the grey panel, one line of purpose, the door for a person with a code,
// the door for the producer, and how it works folded away.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandMark from "./components/BrandMark";
import { S } from "./lib/strings";

// Four samples on the table, A to D, drawn in thin line.
function FourMarks() {
  return (
    <svg width="300" height="150" viewBox="0 0 300 150" fill="none" stroke="var(--ink)" strokeWidth="1" strokeLinecap="round" aria-hidden="true">
      {["A", "B", "C", "D"].map((m, i) => {
        const cx = 45 + i * 70;
        return (
          <g key={m}>
            <ellipse cx={cx} cy="92" rx="26" ry="9" />
            <ellipse cx={cx} cy="92" rx="17" ry="5.5" strokeOpacity="0.45" />
            <text x={cx} y="46" textAnchor="middle" fontFamily="var(--sans)" fontSize="20" fontWeight="600" fill="var(--ink)" stroke="none">{m}</text>
          </g>
        );
      })}
      <path d="M8 120h284" strokeOpacity="0.35" />
    </svg>
  );
}

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 6l5 5 5-5" /></svg>
);

export default function FrontPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const tidy = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const mm = tidy.match(/^([A-Z]+)(\d{4})$/);
  const full = mm ? `${mm[1]}-${mm[2]}` : tidy;
  const go = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (tidy.length < 5) return;
    router.push(`/p/${full}`);
  };
  return (
    <div className="fp">
      <header className="fp-top"><BrandMark /></header>

      <section className="fp-hero" style={{ marginBottom: 28 }}>
        <div className="fp-glass" style={{ height: 200 }}><FourMarks /></div>
      </section>

      <section className="fp-lead">
        <h1>{S.home.h1}</h1>
        <p>{S.home.line}</p>
      </section>

      <section className="fp-panel fp-dark">
        <h2>{S.home.joinTitle}</h2>
        <p>{S.home.joinLine}</p>
        <form className="fp-join" onSubmit={go}>
          <label htmlFor="fp-code" className="fp-sr">{S.home.joinLine}</label>
          <input id="fp-code" value={code} onChange={(e) => setCode(e.target.value)}
            placeholder={S.home.codePh} autoCapitalize="characters" autoComplete="off" inputMode="text" />
          <button type="submit" disabled={tidy.length < 5}>{S.home.go}</button>
        </form>
      </section>

      <section className="fp-panel">
        <h2>{S.home.organiser}</h2>
        <p>{S.home.organiserLine}</p>
        <Link href="/admin" className="fp-btn">{S.home.signIn}</Link>
      </section>

      <section className="fp-faq" id="help">
        <details>
          <summary>{S.home.how}<Chevron /></summary>
          {S.home.howLines.map((l, i) => <p key={i}>{l}</p>)}
        </details>
      </section>

      <footer className="fp-foot">
        <span>{S.home.foot}</span>
      </footer>
    </div>
  );
}
