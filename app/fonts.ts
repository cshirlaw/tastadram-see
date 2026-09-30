import { Instrument_Sans } from "next/font/google";

// One typeface throughout, as a modern app has — Campbell, 19 Sep 2026,
// reversing the Miller decision of the same morning: "it doesn't necessarily
// fit with the theme." Served from this site by next/font; no font service.
export const sans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
