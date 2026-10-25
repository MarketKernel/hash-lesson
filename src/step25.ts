// Step 25: twenty-five steps x = x² + m. The algebra runs into P: ~2 minutes.

import { polynomials } from "./algebra.ts";

export const P = 786433; // a prime, just below 2²⁰

export function hash(m: number): number {
  let x = (m * m + m) % P; // step 1
  x = (x * x + m) % P; // step 2
  x = (x * x + m) % P; // step 3
  x = (x * x + m) % P; // step 4
  x = (x * x + m) % P; // step 5
  x = (x * x + m) % P; // step 6
  x = (x * x + m) % P; // step 7
  x = (x * x + m) % P; // step 8
  x = (x * x + m) % P; // step 9
  x = (x * x + m) % P; // step 10
  x = (x * x + m) % P; // step 11
  x = (x * x + m) % P; // step 12
  x = (x * x + m) % P; // step 13
  x = (x * x + m) % P; // step 14
  x = (x * x + m) % P; // step 15
  x = (x * x + m) % P; // step 16
  x = (x * x + m) % P; // step 17
  x = (x * x + m) % P; // step 18
  x = (x * x + m) % P; // step 19
  x = (x * x + m) % P; // step 20
  x = (x * x + m) % P; // step 21
  x = (x * x + m) % P; // step 22
  x = (x * x + m) % P; // step 23
  x = (x * x + m) % P; // step 24
  x = (x * x + m) % P; // step 25
  //
  // The same as one formula — substitute each step into the next and expand:
  //
  //   x = (m ** 33554432
  //      + 16777216 * m ** 33554431
  //      + 140737479966720 * m ** 33554430
  //      + …                     ← over 33 million more terms here
  //      + 5 * m ** 4
  //      + 2 * m ** 3
  //      + m ** 2
  //      + m) % P;
  //
  // This is a polynomial of degree 2²⁵ = 33 554 432 — above P.
  // The coefficients in the middle are huge: their sum alone is a number with 5 936 176 digits.
  // Not expanding is no better: the substituted expression doubles in length with every step —
  // after 25 steps it is about 537 million characters long.
  return x;
}

// Inverse: given h, find some m with hash(m) = h (or null if there is none).
//
// 1. Unwinding backwards is impossible. The step back x = √(h − m) needs m, and that is what we're looking for.
//
// 2. There is no formula. The inverse means solving the equation
//      m ** 33554432 + 16777216 * m ** 33554431 + … + m − h = 0   (mod P)
//    A ready formula like the school one for degree 2 (step 1) no longer exists from degree 5 on.
//
// 3. What's left is the algorithm from steps 2 and 17 (findRoot in algebra.ts). The polynomial is built with the same
//    steps as hash: f = f² + m. But degree 2²⁵ = 33 million won't fit in memory — so after
//    each step it is reduced by Fermat's theorem (m^P = m): m^k with k ≥ P is replaced by m^(k−P+1).
//    This doesn't change the polynomial's values — so the roots are the same too. The degree stays below P.
//
// 4. Reducing below P is impossible: the polynomial has ~P terms, and any method that works with it
//    spends at least one operation on each. The cost is ~P · log² P.
//    Measured: ~2 minutes (building the polynomial — 8 s, m^P — 6 s, GCD — 106 s).
//
// With P ≈ 2²⁵⁶ it's the same, only ~P is now 2²⁵⁶: that many operations can never be done.
//
// progress (optional) receives the fraction of work done, from 0 to 1 — for showing percentages.
const { add, mul, fermat, findRoot } = polynomials(P);

export function invert(h: number, progress?: (done: number) => void): number | null {
  const M = [0, 1]; // the polynomial "m"
  let f = [0, 1, 1]; // step 1: m² + m
  f = fermat(add(mul(f, f), M)); // step 2
  f = fermat(add(mul(f, f), M)); // step 3
  f = fermat(add(mul(f, f), M)); // step 4
  f = fermat(add(mul(f, f), M)); // step 5
  f = fermat(add(mul(f, f), M)); // step 6
  f = fermat(add(mul(f, f), M)); // step 7
  f = fermat(add(mul(f, f), M)); // step 8
  f = fermat(add(mul(f, f), M)); // step 9
  f = fermat(add(mul(f, f), M)); // step 10
  f = fermat(add(mul(f, f), M)); // step 11
  f = fermat(add(mul(f, f), M)); // step 12
  f = fermat(add(mul(f, f), M)); // step 13
  f = fermat(add(mul(f, f), M)); // step 14
  f = fermat(add(mul(f, f), M)); // step 15
  f = fermat(add(mul(f, f), M)); // step 16
  f = fermat(add(mul(f, f), M)); // step 17
  f = fermat(add(mul(f, f), M)); // step 18
  f = fermat(add(mul(f, f), M)); // step 19
  f = fermat(add(mul(f, f), M)); // step 20
  f = fermat(add(mul(f, f), M)); // step 21
  f = fermat(add(mul(f, f), M)); // step 22
  f = fermat(add(mul(f, f), M)); // step 23
  f = fermat(add(mul(f, f), M)); // step 24
  f = fermat(add(mul(f, f), M)); // step 25
  return findRoot(add(f, [-h]), progress); // root of f(m) − h
}
