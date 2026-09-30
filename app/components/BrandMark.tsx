"use client";

import Link from "next/link";

// The tastaDRAM wordmark with "See" beneath it, and the RSD monogram in gold.
export default function BrandMark() {
  return (
    <Link href="/" className="tw-brand" aria-label="tastaDRAM See, home"
      style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <span aria-hidden="true" style={{
        width: 26, height: 26, flex: "none", display: "inline-block", background: "var(--gold)",
        WebkitMaskImage: "url(/images/rsd_monogram_black.png)", maskImage: "url(/images/rsd_monogram_black.png)",
        WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
        WebkitMaskPosition: "center", maskPosition: "center",
      }} />
      <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.02 }}>
        <span style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg)" }}>
          tasta<span style={{ color: "var(--gold)" }}>DRAM</span>
          <span style={{ fontSize: 10, verticalAlign: "super", fontWeight: 400, color: "var(--fg-faint)", letterSpacing: 0 }}>™</span>
        </span>
        <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-faint)", marginTop: 3 }}>
          See
        </span>
      </span>
    </Link>
  );
}
