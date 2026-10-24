import assert from "node:assert/strict";
import { test } from "node:test";
import { P, hash, invert } from "./step2.ts";

// P ≈ миллион — проверять все m и все хеши долго, поэтому берём 1000 случайных.
const random = () => Math.floor(Math.random() * P);

// Формулы из комментария в hash должны давать тот же результат.
test("step2: одна строка и раскрытые скобки совпадают с hash", () => {
  for (let i = 0; i < 1000; i++) {
    const m = random();
    const oneLine = (((m * m + m) % P) * ((m * m + m) % P) + m) % P;
    // в раскрытых скобках большие степени — считаем в BigInt (суффикс n)
    const b = BigInt(m);
    const expanded = Number((b ** 4n + 2n * b ** 3n + b ** 2n + b) % BigInt(P));
    assert.equal(oneLine, hash(m), `m = ${m}: одна строка`);
    assert.equal(expanded, hash(m), `m = ${m}: раскрытые скобки`);
  }
});

// Какие хеши вообще встречаются: один раз прогоняем hash по всем m.
const image = new Uint8Array(P);
for (let m = 0; m < P; m++) image[hash(m)] = 1;

// Для случайного h: если какое-то m даёт h — invert должен вернуть m с этим хешем, иначе — null.
test("step2: invert находит прообраз, а если его нет — возвращает null", () => {
  for (let i = 0; i < 1000; i++) {
    const h = random();
    const m = invert(h);
    if (image[h]) assert.equal(hash(m!), h, `h = ${h}: invert вернул ${m}`);
    else assert.equal(m, null, `h = ${h}: прообраза нет, а invert вернул ${m}`);
  }
});
