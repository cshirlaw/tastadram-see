import type { Metadata } from "next";
import GuideSteps from "../GuideSteps";
import { GUEST_STEPS } from "../../lib/guide";

export const metadata: Metadata = { title: "tastaDRAM See · How to take part" };

export default function GuestGuide() {
  return (
    <GuideSteps head="How to take part" steps={GUEST_STEPS} other={[
      { href: "/", label: "Join a tasting" },
      { href: "/guide", label: "The producer's guide" },
    ]} />
  );
}
