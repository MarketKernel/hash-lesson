// Step 2: two steps x = x² + m.

import { polynomials } from "./algebra.ts";

export const P = 786433; // a prime, just below 2²⁰

export function hash(m: number): number {
  let x = (m * m + m) % P; // step 1
  x = (x * x + m) % P; // step 2
  // The same in one line — substitute step 1 into step 2:
  //   x = (((m * m + m) % P) * ((m * m + m) % P) + m) % P;
  // Expanded (the intermediate % P can be dropped — the remainder at the end comes out the same):
  //   x = (m * m * m * m + 2 * m * m * m + m * m + m) % P;
  // Note: already for m ≥ 9742 this sum exceeds 2⁵³, and plain JS numbers compute it inexactly.
  // So this line is for reading; the test computes it in BigInt.
  return x;
}

// Inverse: given h, find some m with hash(m) = h (or null if there is none).
//
// Unwinding backwards is impossible: the step back x = √(h − m) needs m, and that is what we're looking for.
// But we can substitute step 1 into step 2 (see the expanded form above) — this gives an equation of degree 4
//   m⁴ + 2m³ + m² + m − h = 0   (mod P)
// There is no ready formula for it, but modulo a prime P a root of a polynomial of any degree
// is found by an algorithm — findRoot in algebra.ts.
const { findRoot } = polynomials(P);

export function invert(h: number): number | null {
  //               m⁰  m¹ m² m³ m⁴
  return findRoot([-h, 1, 1, 2, 1]);
}
