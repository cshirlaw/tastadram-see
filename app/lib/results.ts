import { PairChoice } from "./pairs";
import { Sample } from "./see";

// The two numbers See produces, per sample: how many people preferred it
// (their final choice) and how many of those would buy it at the price.

export interface Answer { pair_choices: PairChoice[] | null; buy: boolean | null; finished?: boolean }

export interface Tally { preferred: number; wouldBuy: number; asked: number }

export function tallyByMat(answers: Answer[]): Record<string, Tally> {
  const out: Record<string, Tally> = {};
  for (const a of answers) {
    const cs = Array.isArray(a.pair_choices) ? a.pair_choices : [];
    const fin = cs.find((c) => c.r === 3);
    if (!fin) continue;
    const t = out[fin.w] ?? (out[fin.w] = { preferred: 0, wouldBuy: 0, asked: 0 });
    t.preferred += 1;
    if (a.buy != null) { t.asked += 1; if (a.buy) t.wouldBuy += 1; }
  }
  return out;
}

// Across tastings, keyed by product name (case-insensitive).
export interface ProductTotal {
  name: string; producer: string | null; mine: boolean;
  tastings: number; tasters: number; preferred: number; wouldBuy: number; asked: number;
}

export function totalsByProduct(sessions: { samples: Sample[]; answers: Answer[] }[]): ProductTotal[] {
  const map = new Map<string, ProductTotal>();
  for (const s of sessions) {
    const finished = s.answers.filter((a) => Array.isArray(a.pair_choices) && a.pair_choices.some((c) => c.r === 3)).length;
    const byMat = tallyByMat(s.answers);
    for (const sm of s.samples) {
      const key = sm.name.trim().toLowerCase();
      const row = map.get(key) ?? {
        name: sm.name, producer: sm.producer, mine: false,
        tastings: 0, tasters: 0, preferred: 0, wouldBuy: 0, asked: 0,
      };
      row.mine = row.mine || sm.mine;
      row.tastings += 1;
      row.tasters += finished;
      const t = byMat[sm.mat];
      if (t) { row.preferred += t.preferred; row.wouldBuy += t.wouldBuy; row.asked += t.asked; }
      map.set(key, row);
    }
  }
  return [...map.values()].sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || b.preferred - a.preferred || b.tastings - a.tastings);
}
