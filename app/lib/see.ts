// tastaDRAM See — one product against three others, blind.
//
// A sample is one of the four things on the table. `mine` marks the
// producer's own product; the other three are what is on the shelf beside it.
// Price and size are the mandatory fields: the buy question depends on them.

export interface Sample {
  id: string;
  name: string;
  producer: string | null;
  category: string | null;   // shoyu, miso, coffee — free text
  price: number;             // in the session's currency
  size: string;              // "250 ml", "200 g"
  mine: boolean;
  mat: string;               // A–D
}

export const MATS = ["A", "B", "C", "D"] as const;

export function money(symbol: string, price: number | null | undefined): string {
  if (price == null || !Number.isFinite(Number(price))) return "";
  const n = Number(price);
  const s = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `${symbol}${s}`;
}

// "£6.50 for 250 ml"
export function priceLine(symbol: string, s: { price: number; size: string }): string {
  return `${money(symbol, s.price)} for ${s.size}`;
}

// What arrives from the form. Returns the clean sample or the field at fault.
export function cleanSample(raw: unknown, mat: string): { ok: true; sample: Sample } | { ok: false; error: string } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const name = String(r.name ?? "").trim();
  if (!name) return { ok: false, error: `Sample ${mat}: enter the product name.` };
  const price = Number(r.price);
  if (r.price === "" || r.price == null || !Number.isFinite(price) || price < 0) {
    return { ok: false, error: `${name}: enter the price.` };
  }
  const size = String(r.size ?? "").trim();
  if (!size) return { ok: false, error: `${name}: enter the size, for example 250 ml.` };
  const producer = String(r.producer ?? "").trim() || null;
  const category = String(r.category ?? "").trim() || null;
  return {
    ok: true,
    sample: {
      id: `s${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
      name, producer, category, price, size, mine: r.mine === true, mat,
    },
  };
}
