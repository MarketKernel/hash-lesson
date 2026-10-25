import assert from "node:assert/strict";
import { test } from "node:test";
import { P, hash, invert } from "./step17.ts";

// invert takes ~16 s here, so we check a single random m.
// The "no preimage" case is covered in step2.test.ts and algebra.test.ts: same algorithm.
test("step17: invert finds a preimage for the hash of a random m", () => {
  const m = Math.floor(Math.random() * P);
  const found = invert(hash(m));
  assert.notEqual(found, null, `m = ${m}: a preimage exists, but invert returned null`);
  assert.equal(hash(found!), hash(m), `m = ${m}: invert returned ${found}`);
});
