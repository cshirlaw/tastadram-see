import type { Metadata } from "next";
import GuideSteps from "./GuideSteps";
import { PRODUCER_STEPS } from "../lib/guide";

export const metadata: Metadata = { title: "tastaDRAM See · Producer's guide" };

export default function ProducerGuide() {
  return (
    <GuideSteps head="Producer's guide" steps={PRODUCER_STEPS} other={[
      { href: "/guide/tasting", label: "For the people tasting" },
      { href: "/guide/print", label: "Print or save as PDF" },
      { href: "/admin", label: "Sign in" },
    ]} />
  );
}
