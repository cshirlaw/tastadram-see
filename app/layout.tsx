import type { Metadata, Viewport } from "next";
import "./globals.css";
import VersionStamp from "./components/VersionStamp";
import { sans } from "./fonts";

export const metadata: Metadata = {
  title: "tastaDRAM See",
  description: "Your product against three others. Four samples, blind. Which do people prefer, and would they buy it at the price?",
  appleWebApp: { capable: true, title: "tastaDRAM See", statusBarStyle: "default" },
  other: { google: "notranslate" },
};

export const viewport: Viewport = { themeColor: "#1b2235" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <main className="tw-app">{children}</main>
        <VersionStamp />
      </body>
    </html>
  );
}
