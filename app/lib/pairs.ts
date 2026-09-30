// The pairwise format — stored code "pairs", display name NOT settled.
// Vladimir Matchekhin's mechanic, 26 Aug 2026; built 27 Aug on Campbell's go.
//
// Four glasses on mats A-D, fully blind: unlike the Function, the guest is
// never shown a bottle name until the reveal. Three choices and nothing else:
// two semi-final pairs, then the two preferred glasses meet in a final. No
// scoring, no flavour words, nothing to guess — every tap is one whisky beaten
// by another, which is the pairwise comparison the 2 Aug awards decision asked
// for, collected directly instead of derived.
//
// ⚠ THE APP DEALS THE PAIRING, THE GUEST DOES NOT CHOOSE IT. A deliberate
// departure from Vladimir's design, for a data reason: with four glasses there
// are only three possible splits into two pairs, and a self-chosen split with a
// default on screen puts the default's two pairs into every observation while
// the other four starve. Rotating the split by attendee fills all six pairs
// evenly from the first evening. Explain to him with the reasoning — not
// slipped past him.

export const PAIRS_FORMAT = "pairs";

// Exactly four glasses. The format is three choices by construction; more
// glasses is a different (and longer) evening, and fewer is just one Challenge.
export const PAIR_MATS = ["A", "B", "C", "D"] as const;

// The three ways four glasses split into two pairs. Index = attendeeId % 3.
export const PAIR_SPLITS: [string, string][][] = [
  [["A", "B"], ["C", "D"]],
  [["A", "C"], ["B", "D"]],
  [["A", "D"], ["B", "C"]],
];

export const splitFor = (attendeeId: number): number =>
  Math.abs(attendeeId) % PAIR_SPLITS.length;

// One recorded choice. r = round (1, 2 semi-finals; 3 final), a/b the two mats
// as presented, w the winner (always a or b), ms the time from the pair being
// shown to the tap. ⚠ ms is recorded and never shown: time-to-answer across a
// room measures how far apart two whiskies actually are, and it cannot be
// added to old data later.
export interface PairChoice {
  r: number;
  a: string;
  b: string;
  w: string;
  ms: number | null;
}

const isMat = (v: unknown): v is string =>
  typeof v === "string" && (PAIR_MATS as readonly string[]).includes(v);

// What arrives from a phone is not to be trusted.
export function cleanChoice(raw: unknown): PairChoice | null {
  const c = raw as Partial<PairChoice> | null;
  if (!c) return null;
  const r = Number(c.r);
  if (!(r === 1 || r === 2 || r === 3)) return null;
  if (!isMat(c.a) || !isMat(c.b) || c.a === c.b) return null;
  if (c.w !== c.a && c.w !== c.b) return null;
  const ms = Number(c.ms);
  return { r, a: c.a, b: c.b, w: c.w, ms: Number.isFinite(ms) && ms >= 0 ? Math.trunc(ms) : null };
}

export const choiceFor = (choices: PairChoice[], round: number): PairChoice | undefined =>
  choices.find((c) => c.r === round);

// The pair the guest faces in a given round, from their split and what they
// have chosen so far. Null while the final's contestants are not yet known.
export function pairForRound(split: number, choices: PairChoice[], round: number): [string, string] | null {
  const s = PAIR_SPLITS[split] ?? PAIR_SPLITS[0];
  if (round === 1) return s[0] as [string, string];
  if (round === 2) return s[1] as [string, string];
  const w1 = choiceFor(choices, 1)?.w;
  const w2 = choiceFor(choices, 2)?.w;
  return w1 && w2 ? [w1, w2] : null;
}

export const nextRound = (choices: PairChoice[]): number => {
  for (const r of [1, 2, 3]) if (!choiceFor(choices, r)) return r;
  return 4; // finished
};

// Wins per mat across a room — the headline of the reveal. Every choice counts,
// semi-final or final; the final's win is already worth more because reaching
// it took a win.
export function winsByMat(all: PairChoice[][]): Record<string, number> {
  const wins: Record<string, number> = {};
  for (const m of PAIR_MATS) wins[m] = 0;
  for (const choices of all)
    for (const c of choices) if (isMat(c.w)) wins[c.w] += 1;
  return wins;
}

// Head-to-head between two mats, order-independent.
export function headToHead(all: PairChoice[][], x: string, y: string): { x: number; y: number } {
  let xi = 0, yi = 0;
  for (const choices of all)
    for (const c of choices) {
      const same = (c.a === x && c.b === y) || (c.a === y && c.b === x);
      if (!same) continue;
      if (c.w === x) xi += 1;
      else if (c.w === y) yi += 1;
    }
  return { x: xi, y: yi };
}

// All six pairs, for the detail table. Only pairs somebody actually faced.
export function pairTallies(all: PairChoice[][]): { a: string; b: string; aWins: number; bWins: number }[] {
  const out: { a: string; b: string; aWins: number; bWins: number }[] = [];
  for (let i = 0; i < PAIR_MATS.length; i++)
    for (let j = i + 1; j < PAIR_MATS.length; j++) {
      const a = PAIR_MATS[i], b = PAIR_MATS[j];
      const t = headToHead(all, a, b);
      if (t.x + t.y > 0) out.push({ a, b, aWins: t.x, bWins: t.y });
    }
  return out;
}
