import assert from "node:assert/strict";
import { test } from "node:test";
import { P, hash, invert } from "./step17.ts";

// invert здесь работает ~16 с, поэтому проверяем одно случайное m.
// Случай «прообраза нет» — в step2.test.ts и algebra.test.ts: алгоритм тот же.
test("step17: invert находит прообраз для хеша случайного m", () => {
  const m = Math.floor(Math.random() * P);
  const found = invert(hash(m));
  assert.notEqual(found, null, `m = ${m}: прообраз есть, а invert вернул null`);
  assert.equal(hash(found!), hash(m), `m = ${m}: invert вернул ${found}`);
});
