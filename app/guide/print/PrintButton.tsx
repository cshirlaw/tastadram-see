"use client";

export default function PrintButton() {
  return (
    <button type="button" className="tw-btn gp-noprint" style={{ width: "auto", marginTop: 24 }} onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
