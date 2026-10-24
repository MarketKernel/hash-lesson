import assert from "node:assert/strict";
import { test } from "node:test";
import { P, hash, invert } from "./step128.ts";

const powMod = (b: bigint, e: bigint): bigint => {
  let r = 1n;
  for (b %= P; e > 0n; e >>= 1n) {
    if (e & 1n) r = (r * b) % P;
    b = (b * b) % P;
  }
  return r;
};

test("step128: P — простое число в 16 байт", () => {
  assert.equal(P.toString(16).length, 32, "16 байт = 32 hex-цифры");
  // тест Ферма: для простого P верно a^(P−1) = 1 при любом a
  for (const a of [2n, 3n, 5n, 7n, 11n, 13n]) assert.equal(powMod(a, P - 1n), 1n, `основание ${a}`);
});

test("step128: hash — те же 128 шагов, что и в цикле", () => {
  for (const m of [0n, 1n, 2n, 123456789n, P - 1n, P / 3n]) {
    let x = (m * m + m) % P;
    for (let i = 2; i <= 128; i++) x = (x * x + m) % P;
    assert.equal(hash(m), x, `m = ${m}`);
  }
});

test("step128: invert сразу сообщает, что не досчитать", () => {
  assert.throws(() => invert(hash(42n)), /не досчитать/);
});
