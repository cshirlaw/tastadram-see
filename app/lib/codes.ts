import crypto from "crypto";

// Codes people read off a screen or a card in a bar. No 0/O/1/l/i — they get
// mistyped, and sign-in is passcode-only, so a mistyped code is a dead end.
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function inviteCode(len = 6) {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  }
  return out;
}

const NEUTRAL_WORDS = ["taste", "sample", "table", "blind", "four", "pick"];
const SKIP_WORDS = new Set(["the", "a", "an", "at", "of", "and", "le", "la", "u", "na", "v"]);

// The word half of a generated passcode. Taken from the venue name where it
// gives something readable — accents stripped, non-Latin names fall back to a
// neutral word, because the passcode has to be typed on any keyboard.
export function passcodeWord(venue: string) {
  const tokens = venue
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 3 && w.length <= 8 && !SKIP_WORDS.has(w));
  // Shortest usable word: "The Royal Oak" gives "oak", not "royal".
  const word = tokens.sort((a, b) => a.length - b.length)[0];
  return word || NEUTRAL_WORDS[crypto.randomInt(0, NEUTRAL_WORDS.length)];
}

// word + digits, e.g. oak-7412. `wide` gives six digits, used after repeated
// collisions so a popular word still terminates.
export function makePasscode(venue: string, wide = false) {
  const n = wide ? crypto.randomInt(100000, 1000000) : crypto.randomInt(1000, 10000);
  return `${passcodeWord(venue)}-${n}`;
}
