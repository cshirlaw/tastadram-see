import type { Metadata } from "next";
import BrandMark from "../../components/BrandMark";
import { PRODUCER_STEPS } from "../../lib/guide";
import PrintButton from "./PrintButton";

export const metadata: Metadata = { title: "tastaDRAM See · Producer's guide" };

// Every step of the producer's guide, one to a page, for printing or saving
// as a PDF. The words and pictures are the same as /guide.
export default function GuidePrint() {
  return (
    <div className="gp">
      <style>{"@page { size: A4; margin: 16mm; }"}</style>
      <div className="gp-page gp-cover">
        <BrandMark />
        <h1>Producer&rsquo;s guide</h1>
        <p className="gp-lede">Your product against three others. Four samples, blind. Which do people prefer, and would they buy it at the price?</p>
        <ol className="gp-toc">
          {PRODUCER_STEPS.map((s, i) => <li key={i}>{s.title}</li>)}
        </ol>
        <p className="gp-small">tastadram-see.vercel.app &middot; The same guide, a step at a time: tastadram-see.vercel.app/guide</p>
        <PrintButton />
      </div>
      {PRODUCER_STEPS.map((s, i) => (
        <div key={i} className="gp-page">
          <div className="gp-text">
            <span className="gp-num">Step {i + 1} of {PRODUCER_STEPS.length}</span>
            <h2>{s.title}</h2>
            {s.lines.map((l, k) => <p key={k}>{l}</p>)}
          </div>
          <div className="gp-shot"><img src={s.img} alt={s.alt} /></div>
        </div>
      ))}
    </div>
  );
}
