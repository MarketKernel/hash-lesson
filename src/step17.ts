// Step 17: seventeen steps x = x² + m. The algebra still works, but already takes ~16 s.

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
  //
  // The same as one formula — substitute each step into the next and expand:
  //
  //   x = (m ** 131072
  //      + 65536 * m ** 131071
  //      + 2147450880 * m ** 131070
  //      + …                     ← about 131 thousand more terms here
  //      + 5 * m ** 4
  //      + 2 * m ** 3
  //      + m ** 2
  //      + m) % P;
  //
  // This is a polynomial of degree 2¹⁷ = 131 072 — still below P.
  // The coefficients in the middle are huge: their sum is a number with 23 189 digits.
  return x;
}

// Inverse: given h, find some m with hash(m) = h (or null if there is none).
//
// The same algorithm as in step 2 (findRoot in algebra.ts): find a root of the polynomial f(m) − h.
// One difference: 131 072 coefficients can't be typed into the code by hand, so the program builds the polynomial —
// with the same steps as hash, only over the polynomial f instead of the number x:  f = f² + m.
//
// Measured: ~16 s. Each step doubles the degree, and the time roughly doubles. More in README.md.
// progress (optional) receives the fraction of work done, from 0 to 1 — for showing percentages.
const { add, mul, findRoot } = polynomials(P);

export function invert(h: number, progress?: (done: number) => void): number | null {
  const M = [0, 1]; // the polynomial "m"
  let f = [0, 1, 1]; // step 1: m² + m
  f = add(mul(f, f), M); // step 2
  f = add(mul(f, f), M); // step 3
  f = add(mul(f, f), M); // step 4
  f = add(mul(f, f), M); // step 5
  f = add(mul(f, f), M); // step 6
  f = add(mul(f, f), M); // step 7
  f = add(mul(f, f), M); // step 8
  f = add(mul(f, f), M); // step 9
  f = add(mul(f, f), M); // step 10
  f = add(mul(f, f), M); // step 11
  f = add(mul(f, f), M); // step 12
  f = add(mul(f, f), M); // step 13
  f = add(mul(f, f), M); // step 14
  f = add(mul(f, f), M); // step 15
  f = add(mul(f, f), M); // step 16
  f = add(mul(f, f), M); // step 17
  return findRoot(add(f, [-h]), progress); // root of f(m) − h
}
