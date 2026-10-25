import assert from "node:assert/strict";
import { test } from "node:test";
import { P, hash, invert } from "./step25.ts";

// invert takes minutes here — so the test is skipped by default.
// To run it: SLOW=1 node --test src/step25.test.ts
const slow = !process.env.SLOW && "takes minutes — run with: SLOW=1 node --test src/step25.test.ts";

test("step25: invert finds a preimage for the hash of a random m", { skip: slow }, () => {
  const m = Math.floor(Math.random() * P);
  const found = invert(hash(m));
  assert.notEqual(found, null, `m = ${m}: a preimage exists, but invert returned null`);
  assert.equal(hash(found!), hash(m), `m = ${m}: invert returned ${found}`);
});
