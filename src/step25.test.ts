import assert from "node:assert/strict";
import { test } from "node:test";
import { P, hash, invert } from "./step25.ts";

// invert здесь работает минуты — поэтому тест по умолчанию пропускается.
// Запустить: SLOW=1 node --test src/step25.test.ts
const slow = !process.env.SLOW && "идёт минуты — запуск: SLOW=1 node --test src/step25.test.ts";

test("step25: invert находит прообраз для хеша случайного m", { skip: slow }, () => {
  const m = Math.floor(Math.random() * P);
  const found = invert(hash(m));
  assert.notEqual(found, null, `m = ${m}: прообраз есть, а invert вернул null`);
  assert.equal(hash(found!), hash(m), `m = ${m}: invert вернул ${found}`);
});
