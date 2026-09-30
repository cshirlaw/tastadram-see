"use client";

// The table card for one tasting: A5, to stand beside the samples. The QR
// code and the code for this tasting, and the four steps with a picture each.
// Printed from the tasting page, under More.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import BrandMark from "../../../components/BrandMark";
import { GUEST_STEPS } from "../../../lib/guide";

export default function TableCard() {
  const params = useParams();
  const code = ((Array.isArray(params.code) ? params.code[0] : params.code) || "").toUpperCase();
  const [name, setName] = useState("");
  const [qr, setQr] = useState("");
  const [host, setHost] = useState("");
  useEffect(() => {
    fetch(`/api/pairs?code=${encodeURIComponent(code)}`, { cache: "no-store" }).then((r) => r.json())
      .then((d) => { if (d?.found) setName(d.session.name); }).catch(() => {});
    // The site's public address when one is configured, else this page's own.
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const link = `${origin}/p/${code}`;
    setHost(origin.replace(/^https?:\/\//, ""));
    QRCode.toDataURL(link, { width: 600, margin: 1, color: { dark: "#111111", light: "#ffffff" } }).then(setQr).catch(() => {});
  }, [code]);
  return (
    <div className="card-a5">
      <style>{"@page { size: A5; margin: 0; }"}</style>
      <div className="card-head">
        <BrandMark />
        {name && <span className="card-name">{name}</span>}
      </div>
      <h1>Taste four samples, blind. Pick the one you prefer.</h1>
      <div className="card-join">
        {qr && <img src={qr} alt={`QR code for tasting ${code}`} />}
        <div>
          <p className="card-k">Scan the code with your phone camera</p>
          <p className="card-or">or go to <b>{host || "tastadram-see.vercel.app"}</b> and enter</p>
          <p className="card-code">{code}</p>
        </div>
      </div>
      <ol className="card-steps">
        {GUEST_STEPS.map((s, i) => (
          <li key={i}>
            <div className="card-step-text"><span className="card-n">{i + 1}</span><b>{s.title}{/[?.]$/.test(s.title) ? "" : "."}</b> {s.lines.join(" ")}</div>
            <img src={s.card} alt={s.alt} />
          </li>
        ))}
      </ol>
      <p className="card-foot">Nothing is kept about you except the name you choose. — tastaDRAM, Edinburgh</p>
      <button type="button" className="tw-btn card-noprint" style={{ width: "auto", marginTop: 16 }} onClick={() => window.print()}>Print</button>
    </div>
  );
}
