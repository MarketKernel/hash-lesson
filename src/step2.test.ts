import assert from "node:assert/strict";
import { test } from "node:test";
import { P, hash, invert } from "./step2.ts";

// P ≈ a million — checking every m and every hash takes too long, so we take 1000 random ones.
const random = () => Math.floor(Math.random() * P);

// The formulas from the comment in hash must give the same result.
test("step2: the one-liner and the expanded form match hash", () => {
  for (let i = 0; i < 1000; i++) {
    const m = random();
    const oneLine = (((m * m + m) % P) * ((m * m + m) % P) + m) % P;
    // the expanded form has large powers — compute in BigInt (n suffix)
    const b = BigInt(m);
    const expanded = Number((b ** 4n + 2n * b ** 3n + b ** 2n + b) % BigInt(P));
    assert.equal(oneLine, hash(m), `m = ${m}: one-liner`);
    assert.equal(expanded, hash(m), `m = ${m}: expanded form`);
  }
});

// Which hashes occur at all: run hash over every m once.
const image = new Uint8Array(P);
for (let m = 0; m < P; m++) image[hash(m)] = 1;

// For a random h: if some m gives h, invert must return an m with that hash; otherwise null.
test("step2: invert finds a preimage, or returns null if there is none", () => {
  for (let i = 0; i < 1000; i++) {
    const h = random();
    const m = invert(h);
    if (image[h]) assert.equal(hash(m!), h, `h = ${h}: invert returned ${m}`);
    else assert.equal(m, null, `h = ${h}: there is no preimage, but invert returned ${m}`);
  }
});
