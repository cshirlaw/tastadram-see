import { APP_VERSION } from "../lib/version";

// A small grey version number at the bottom right of every page — Campbell,
// 10 Sep 2026, so a tester's screenshot says which build it came from. It is
// text only, takes no taps and never covers a control.
export default function VersionStamp() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        right: 8,
        bottom: 6,
        fontSize: 11,
        lineHeight: 1,
        color: "var(--ink-faint, #8a8377)",
        opacity: 0.8,
        pointerEvents: "none",
        fontFamily: "var(--sans)",
        zIndex: 5,
      }}
    >
      v{APP_VERSION}
    </div>
  );
}
