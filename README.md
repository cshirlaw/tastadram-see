# tastaDRAM Tea — blind tea tasting app

> Forked 16 Sep 2026 from the whisky app at `56ceb47`, brought to the state of the coffee app at `77abfcd`, then converted for tea. The notes below are the whisky app's and describe its history; the tea app's own record is the vault note `Whisky - tastaDRAM Tea (fork log)`.

# tastaDRAM — whisky tasting app (history)

> **This repo is the tastaDRAM app** (renamed from `flavour-first-demo`, Jul 2026), LIVE at
> **www.tastadram.scot — the canonical address since 2 Aug 2026**. tastadram.com,
> tastadram.co.uk and the bare forms all 308-redirect to it, keeping the path, so old
> links still work. `.scot` was chosen so the brand reads as Scottish at a glance.
> Runs on Next.js 16.3 (Turbopack) with React 19.2 since 8 Aug 2026.
> Vercel project `rsd-tasting`, connected to GitHub `cshirlaw/tastadram` (private) since
> 8 Aug 2026 — **deploy is `git push` to `main`** and Vercel builds from the repo.
> The old `npx vercel --prod` route is retired: it bypassed GitHub entirely, and the app
> ran live on three domains for two weeks with no repository and no backup but one Mac.
> The knowledge home is the CS Partners vault: `Whisky - Tasting App Sample Entry (scoping)`
> and `Whisky - Tasting App x Casks (linkage concept)` in `Files/Notes/`, plus
> `Whisky - Open Items` for live state. Migrations: `curl -L -X POST https://www.tastadram.scot/api/setup`.
>
> **Queued app-side batch (decided 2 Aug 2026, do with the November run-up + Sept RU work,
> not during Vladimir's live testing):**
>
> 1. Casks link on the take-home summary — match the tasted distillery against the public
>    `rsdwhisky.com/api/casks` feed; when matched, one line: casks of this distillery can be
>    sourced, RSD acts as agent → link. Needs a distillery alias map and an RU version.
> 2. One licensing sentence on the front/about page: "tastaDRAM is built and run by RSD Whisky
>    in Edinburgh. If you would like it under your own name — for a bar, a distillery, a shop,
>    a city — write to c.shirlaw@rsdwhisky.com."
> 3. Remember the last market on the installed app (start_url currently always opens Scotland).
>
> The Cask Room pages (`/discover`, `/flavours`, `/society`, `/cask`) are deliberately kept,
> hidden behind redirects, for the SMWS conversation. The original demo README follows.

# The Cask Room — flavour-first discovery demo

A working prototype built by CS Partners to demonstrate a flavour-first approach
to single-cask whisky discovery. It is a **presentation-layer demo**: a modern
Next.js front end over a static sample catalogue. In a real build this layer sits
on top of the retailer's existing commerce engine (headless), so checkout and
billing are untouched.

**This is a demonstration only.** Every bottle, name, price and tasting note is
invented for the demo. The cask-numbering format and the eight flavour-profile
names are common conventions of the category. It is not affiliated with, endorsed
by, or using the branding of The Scotch Malt Whisky Society or any producer.

## What it shows

1. **Find your dram** (`/discover`) — a four-question flavour quiz that recommends
   drams from the catalogue. The "we exploit your taxonomy" point, made concrete.
2. **Browse by flavour** (`/flavours`) — an interactive flavour wheel and one clean
   set of eight profiles (not two competing checkbox systems), tasting notes
   surfaced rather than buried.
3. **A cask page done right** (`/cask/7.263`) — the tasting note as the hero,
   flavour tags, live scarcity, and "more like this".

Everything is server-rendered, so unlike a script-only shop it is fully indexable.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Build for production

```bash
npm run build
npm run start
```

## Deploy

Deploys to Vercel with no configuration (import the repo, framework auto-detected).

## Stack

Next.js (App Router) · React · TypeScript · plain CSS (design tokens in
`app/globals.css`). No database — the catalogue is `app/lib/catalogue.ts`. The
quiz logic is `app/lib/quiz.ts`.
