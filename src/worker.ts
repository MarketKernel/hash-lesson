// Background thread: computes the hash and the inverse while the page stays responsive and shows progress.

import * as step1 from "./step1.ts";
import * as step2 from "./step2.ts";
import * as step17 from "./step17.ts";
import * as step25 from "./step25.ts";
import * as step128 from "./step128.ts";

// Steps 1–25 use plain numbers, step 128 uses BigInt.
type Step = {
  hash: (m: any) => any;
  invert: (h: any, progress?: (done: number) => void) => any;
};

const STEPS: Record<string, Step> = { step1, step2, step17, step25, step128 };

onmessage = (e: MessageEvent<{ step: string; m: number | bigint }>) => {
  const { hash, invert } = STEPS[e.data.step];

  const h = hash(e.data.m);
  postMessage({ type: "hash", h });

  const t0 = performance.now();
  let found;
  try {
    found = invert(h, (done) => postMessage({ type: "progress", done }));
  } catch (err) {
    postMessage({ type: "error", message: (err as Error).message }); // e.g. step 128: "infeasible"
    return;
  }
  const ms = performance.now() - t0;

  postMessage({ type: "done", found, ms, h2: found === null ? null : hash(found) });
};
