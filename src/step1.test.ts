import assert from "node:assert/strict";
import { test } from "node:test";
import { P, hash, invert } from "./step1.ts";

// P ≈ миллион — проверять все m и все хеши долго, поэтому берём 1000 случайных.
const random = () => Math.floor(Math.random() * P);

// Какие хеши вообще встречаются: один раз прогоняем hash по всем m.
const image = new Uint8Array(P);
for (let m = 0; m < P; m++) image[hash(m)] = 1;

// Для случайного h: если какое-то m даёт h — invert должен вернуть m с этим хешем, иначе — null.
test("step1: invert находит прообраз, а если его нет — возвращает null", () => {
  for (let i = 0; i < 1000; i++) {
    const h = random();
    const m = invert(h);
    if (image[h]) assert.equal(hash(m!), h, `h = ${h}: invert вернул ${m}`);
    else assert.equal(m, null, `h = ${h}: прообраза нет, а invert вернул ${m}`);
  }
});
