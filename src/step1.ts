// Step 1: one step x = x² + m.

export const P = 786433; // the same P as in the other steps (the formula works for any prime except 2)

export function hash(m: number): number {
  return (m * m + m) % P; // step 1
}

// Inverse: given h, find some m with hash(m) = h (or null if there is none).
// This is the quadratic equation m² + m − h = 0, solved with the school formula:
//   m = (−1 + √D) / 2,   D = 1 + 4h.
// Modulo P:
//   −1 = P − 1;
//   dividing by 2 = multiplying by (P+1)/2, because 2 · (P+1)/2 = P + 1 = 1;
//   √D — with its own algorithm, see sqrt below.
export function invert(h: number): number | null {
  const D = (1 + 4 * h) % P;
  const s = sqrt(D);
  if (s === null) return null; // D is not a square — no solutions
  return ((P - 1 + s) * ((P + 1) / 2)) % P; // (−1 + √D) / 2
}

// Square root modulo P — Cipolla's algorithm. Works for any prime P.
//
// Exactly half of the nonzero numbers are squares. Euler's criterion tells them apart:
//   a^((P−1)/2) = 1 if a is a square, and = −1 (that is, P − 1) if not.
//
// The rest is like complex numbers. Find t for which w = t² − a is NOT a square,
// and introduce an "imaginary" number i with i² = w (like i² = −1 for complex numbers). Numbers are now pairs x + y·i.
// Then √a = (t + i)^((P+1)/2), and the result turns out to be an ordinary number (y = 0).
function sqrt(a: number): number | null {
  if (a === 0) return 0;
  if (powMod(a, (P - 1) / 2) !== 1) return null; // a is not a square — no root

  let t = 0;
  while (powMod((t * t - a + P * P) % P, (P - 1) / 2) !== P - 1) t++; // look for t: t² − a is not a square
  const w = (t * t - a + P * P) % P; // i² = w

  // (x₁ + y₁·i)(x₂ + y₂·i) = (x₁x₂ + y₁y₂·w) + (x₁y₂ + y₁x₂)·i
  const mul = ([x1, y1]: number[], [x2, y2]: number[]): number[] => [
    (x1 * x2 + ((y1 * y2) % P) * w) % P,
    (x1 * y2 + y1 * x2) % P,
  ];

  // (t + i)^((P+1)/2) — exponentiation by squaring, as in powMod
  let r = [1, 0];
  let b = [t, 1];
  for (let e = (P + 1) / 2; e > 0; e = Math.floor(e / 2)) {
    if (e % 2) r = mul(r, b);
    b = mul(b, b);
  }
  return r[0];
}

/** b^e modulo P — by repeated squaring. */
function powMod(b: number, e: number): number {
  let r = 1;
  for (; e > 0; e = Math.floor(e / 2)) {
    if (e % 2) r = (r * b) % P;
    b = (b * b) % P;
  }
  return r;
}
