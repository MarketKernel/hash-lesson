// Страница: выбираем шаг и m → hash(m) → invert(h) с прогрессом → hash(invert(h)).

const P = 786433n; // P шагов 1–25
const P128 = 2n ** 128n - 159n; // P шага 128 — простое число в 16 байт

// big — шаг считает в BigInt (m и хеш — bigint), остальные — в обычных числах.
const STEPS = [
  { id: "step1", name: "Шаг 1", P, big: false, about: "Уравнение 2-й степени — школьная формула. Мгновенно." },
  { id: "step2", name: "Шаг 2", P, big: false, about: "Уравнение 4-й степени — алгоритм с НОД. Мгновенно." },
  { id: "step17", name: "Шаг 17", P, big: false, about: "Уравнение степени 131 072 — алгоритм с НОД, ~16 с." },
  { id: "step25", name: "Шаг 25", P, big: false, about: "Степень 2²⁵ = 33 миллиона — урезаем по теореме Ферма до степени меньше P ≈ 786 тысяч и решаем. Это долго." },
  { id: "step128", name: "Шаг 128 (P — 16 байт)", P: P128, big: true, about: "P — простое число в 16 байт, 128 шагов. Уравнение степени 2¹²⁸: обратную не досчитать (~10²⁸ лет). Не криптостойкий хеш: коллизии — за ~2⁶⁴ (см. step128.ts)." },
];
const step = () => STEPS.find((s) => s.id === stepSelect.value)!;

/** Случайное m от 0 до P − 1. */
function randomM(P: bigint): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return BigInt("0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")) % P;
}

/** m из поля ввода — или null, если там не целое от 0 до P − 1. */
function message(): bigint | null {
  try {
    const m = BigInt(mInput.value.trim());
    return m >= 0n && m < step().P ? m : null;
  } catch {
    return null;
  }
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const stepSelect = $<HTMLSelectElement>("step");
const mInput = $<HTMLInputElement>("m");
const bar = $<HTMLProgressElement>("bar");

let worker: Worker | null = null;
let timer = 0; // обновляет «прошло / осталось» раз в полсекунды

/** 75 → «1 мин 15 с». */
function duration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h) return `${h} ч ${m} мин`;
  if (m) return `${m} мин ${s} с`;
  return `${s} с`;
}

// Фоновый поток. В собранном dist/index.html его код лежит прямо в странице (<script id="worker-src">) —
// так всё работает по двойному клику. При node server.ts — отдельный файл src/worker.ts.
function startWorker(): Worker {
  const src = document.getElementById("worker-src")?.textContent;
  if (src) return new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
  return new Worker("src/worker.ts", { type: "module" });
}

function run(): void {
  const big = message();
  if (big === null) {
    $("h").textContent = `m должно быть целым от 0 до ${step().P - 1n}`;
    return;
  }
  const m = step().big ? big : Number(big); // шаги 1–25 считают в обычных числах

  worker?.terminate(); // если что-то ещё считается — бросаем
  clearInterval(timer);
  worker = startWorker();
  $("h").textContent = "…";
  $("found").textContent = "считаю…";
  $("h2").textContent = "";
  $("check").textContent = "";
  bar.value = 0;
  $("pct").textContent = "0%";

  // Прошло / осталось: «осталось» оцениваем по доле сделанного — прошло · (1 − доля) / доля.
  const t0 = performance.now();
  let done = 0;
  timer = setInterval(() => {
    const sec = (performance.now() - t0) / 1000;
    const left = done > 0.01 ? ` · осталось ≈ ${duration((sec * (1 - done)) / done)}` : "";
    $("pct").textContent = `${Math.floor(done * 100)}% · прошло ${duration(sec)}${left}`;
  }, 500);

  worker.onmessage = (e) => {
    const msg = e.data;
    if (msg.type === "hash") $("h").textContent = String(msg.h);
    if (msg.type === "progress") {
      done = msg.done;
      bar.value = done;
    }
    if (msg.type === "error") {
      clearInterval(timer);
      $("found").textContent = `⛔ ${msg.message}`;
      $("pct").textContent = "";
    }
    if (msg.type === "done") {
      clearInterval(timer);
      bar.value = 1;
      $("pct").textContent = `100% · ${(msg.ms / 1000).toFixed(2)} с`;
      if (msg.found === null) {
        $("found").textContent = "нет такого m";
        return;
      }
      $("found").textContent = `${msg.found}${msg.found === m ? " (исходное)" : " (другое m с тем же хешем)"}`;
      $("h2").textContent = String(msg.h2);
      $("check").textContent = String(msg.h2) === $("h").textContent ? "✓ совпадает" : "✗ не совпадает";
    }
  };
  worker.postMessage({ step: stepSelect.value, m });
}

function showAbout(): void {
  $("about").textContent = step().about;
  if (message() === null) mInput.value = String(randomM(step().P)); // m не подходит новому P — берём другое
}

stepSelect.innerHTML = STEPS.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
stepSelect.addEventListener("change", showAbout);
mInput.value = String(randomM(P));
$("random").addEventListener("click", () => (mInput.value = String(randomM(step().P))));
$("run").addEventListener("click", run);
showAbout();
