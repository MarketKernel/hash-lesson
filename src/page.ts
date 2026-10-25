// The page: pick a step and m → hash(m) → invert(h) with progress → hash(invert(h)).

const P = 786433n; // P of steps 1–25
const P128 = 2n ** 128n - 159n; // P of step 128 — a 16-byte prime

// big — the step computes in BigInt (m and the hash are bigint); the others use plain numbers.
const STEPS = [
  { id: "step1", name: "Step 1", P, big: false, about: "A degree-2 equation — the school formula. Instant." },
  { id: "step2", name: "Step 2", P, big: false, about: "A degree-4 equation — the GCD-based algorithm. Instant." },
  { id: "step17", name: "Step 17", P, big: false, about: "An equation of degree 131,072 — the GCD-based algorithm, ~16 s." },
  { id: "step25", name: "Step 25", P, big: false, about: "Degree 2²⁵ = 33 million — reduced by Fermat's theorem to a degree below P ≈ 786 thousand, then solved. This takes a while." },
  { id: "step128", name: "Step 128 (P is 16 bytes)", P: P128, big: true, about: "P is a 16-byte prime, 128 steps. An equation of degree 2¹²⁸: the inverse is infeasible (~10²⁸ years). Not a secure hash: collisions in ~2⁶⁴ (see step128.ts)." },
];
const step = () => STEPS.find((s) => s.id === stepSelect.value)!;

/** A random m from 0 to P − 1. */
function randomM(P: bigint): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return BigInt("0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")) % P;
}

/** m from the input field — or null if it is not an integer from 0 to P − 1. */
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
let timer = 0; // updates "elapsed / remaining" every half second

/** 75 → "1 min 15 s". */
function duration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h) return `${h} h ${m} min`;
  if (m) return `${m} min ${s} s`;
  return `${s} s`;
}

// Background thread. In the built dist/index.html its code sits right in the page (<script id="worker-src">) —
// so everything works on double-click. With node server.ts it is a separate file, src/worker.ts.
function startWorker(): Worker {
  const src = document.getElementById("worker-src")?.textContent;
  if (src) return new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
  return new Worker("src/worker.ts", { type: "module" });
}

function run(): void {
  const big = message();
  if (big === null) {
    $("h").textContent = `m must be an integer from 0 to ${step().P - 1n}`;
    return;
  }
  const m = step().big ? big : Number(big); // steps 1–25 use plain numbers

  worker?.terminate(); // if something is still running, drop it
  clearInterval(timer);
  worker = startWorker();
  $("h").textContent = "…";
  $("found").textContent = "computing…";
  $("h2").textContent = "";
  $("check").textContent = "";
  bar.value = 0;
  $("pct").textContent = "0%";

  // Elapsed / remaining: "remaining" is estimated from the fraction done — elapsed · (1 − fraction) / fraction.
  const t0 = performance.now();
  let done = 0;
  timer = setInterval(() => {
    const sec = (performance.now() - t0) / 1000;
    const left = done > 0.01 ? ` · remaining ≈ ${duration((sec * (1 - done)) / done)}` : "";
    $("pct").textContent = `${Math.floor(done * 100)}% · elapsed ${duration(sec)}${left}`;
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
      $("pct").textContent = `100% · ${(msg.ms / 1000).toFixed(2)} s`;
      if (msg.found === null) {
        $("found").textContent = "no such m";
        return;
      }
      $("found").textContent = `${msg.found}${msg.found === m ? " (the original)" : " (a different m with the same hash)"}`;
      $("h2").textContent = String(msg.h2);
      $("check").textContent = String(msg.h2) === $("h").textContent ? "✓ matches" : "✗ does not match";
    }
  };
  worker.postMessage({ step: stepSelect.value, m });
}

function showAbout(): void {
  $("about").textContent = step().about;
  if (message() === null) mInput.value = String(randomM(step().P)); // m doesn't fit the new P — pick another one
}

stepSelect.innerHTML = STEPS.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
stepSelect.addEventListener("change", showAbout);
mInput.value = String(randomM(P));
$("random").addEventListener("click", () => (mInput.value = String(randomM(step().P))));
$("run").addEventListener("click", run);
showAbout();
