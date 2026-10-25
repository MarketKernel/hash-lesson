import assert from "node:assert/strict";
import { test } from "node:test";
import { polynomials } from "./algebra.ts";

const P = 786433;
const { mul, mulSlow, fermat, gcd, gcdSlow, findRoot } = polynomials(P);
const random = () => Math.floor(Math.random() * P);
const randomPoly = (n: number) => Array.from({ length: n }, random).concat([1]);
const value = (f: number[], m: number) => f.reduceRight((acc, c) => (acc * m + c) % P, 0);

test("algebra: fast multiplication (Kronecker) matches schoolbook multiplication", () => {
  for (const [n1, n2] of [[100, 100], [500, 300], [2000, 2000], [64, 4000]]) {
    const a = randomPoly(n1);
    const b = randomPoly(n2);
    assert.deepEqual(mul(a, b), mulSlow(a, b), `degrees ${n1} and ${n2}`);
  }
});

test("algebra: Fermat reduction doesn't change the polynomial's values", () => {
  const f = randomPoly(2 * P + 10); // degree above 2P — below P after reduction
  const g = fermat(f);
  assert.ok(g.length <= P, `degree after reduction ${g.length - 1}`);
  for (let i = 0; i < 10; i++) {
    const m = random();
    assert.equal(value(g, m), value(f, m), `m = ${m}`);
  }
});

test("algebra: fast GCD matches schoolbook GCD", () => {
  for (const [n1, n2, common] of [[300, 299, 0], [1000, 700, 0], [1500, 1500, 0], [1200, 900, 250], [3000, 2999, 40]]) {
    // a common factor of known degree — so the GCD is not just 1
    const c = randomPoly(common);
    const a = mul(randomPoly(n1), c);
    const b = mul(randomPoly(n2), c);
    assert.deepEqual(gcd(a, b), gcdSlow(a, b), `degrees ${n1}, ${n2}, common factor ${common}`);
  }
});

test("algebra: findRoot finds a root of a polynomial with known roots", () => {
  for (const degree of [1, 5, 50, 300, 2000]) {
    // f = (m − r₁)(m − r₂)…(m − r_degree) — roots known in advance
    const roots = Array.from({ length: degree }, random);
    const f = roots.reduce((acc, r) => mul(acc, [(P - r) % P, 1]), [1]);
    const found = findRoot(f);
    assert.notEqual(found, null, `degree ${degree}`);
    assert.equal(value(f, found!), 0, `degree ${degree}: f(${found}) ≠ 0`);
  }
});

test("algebra: findRoot returns null if there are no roots", () => {
  // m² − a, where a is not a square: no roots. Its square has no roots either.
  let a = 2;
  while (modPow(a, (P - 1) / 2) === 1) a++; // Euler's criterion: squares have a^((P−1)/2) = 1
  assert.equal(findRoot([P - a, 0, 1]), null);
  assert.equal(findRoot(mul([P - a, 0, 1], [P - a, 0, 1])), null);
});

function modPow(b: number, e: number): number {
  let r = 1;
  for (; e > 0; e = Math.floor(e / 2)) {
    if (e % 2) r = (r * b) % P;
    b = (b * b) % P;
  }
  return r;
}
