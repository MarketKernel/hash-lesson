#!/usr/bin/env bash
# Builds the page into a single file dist/index.html — opens on double-click, no server or hosting needed.
#
# Browsers don't load modules and background threads from local files, so all the code is inlined into the HTML:
#   - the shared src/algebra.ts goes in once, each step src/stepN.ts in its own scope;
#   - the background thread's code goes into <script type="text/plain" id="worker-src"> — page.ts starts it via a Blob;
#   - the page code goes into a regular <script>.
# Node strips the types from .ts itself — no dependencies.
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
mkdir dist

node --no-warnings --input-type=module <<'EOF'
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const js = (file) => stripTypeScriptTypes(readFileSync(file, "utf8"));

const noImports = (code) => code.replace(/^import .*;$/gm, "").replace(/^export /gm, "");

// The shared module algebra.ts — once, at the top: the steps see polynomials through the closure.
const algebra = noImports(js("src/algebra.ts"));

// Steps: each in its own function (each has its own P, hash, invert); only hash and invert go out.
const steps = readdirSync("src")
  .filter((f) => /^step\d+\.ts$/.test(f))
  .sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4)))
  .map((f) => `const ${f.slice(0, -3)} = (() => {\n${noImports(js(`src/${f}`))}\nreturn { hash, invert };\n})();`)
  .join("\n\n");

// Worker: no imports needed — the steps are already above under the same names.
const worker = algebra + "\n\n" + steps + "\n\n" + noImports(js("src/worker.ts"));
const page = js("src/page.ts");

for (const [name, code] of [["worker", worker], ["page", page]]) {
  if (code.includes("</script")) throw new Error(`${name}: the code contains </script — it would break the HTML`);
}

const tag = '<script type="module" src="src/page.ts"></script>';
const html = readFileSync("index.html", "utf8");
if (!html.includes(tag)) throw new Error(`index.html has no ${tag}`);
writeFileSync(
  "dist/index.html",
  html.replace(tag, () => `<script type="text/plain" id="worker-src">\n${worker}\n</script>\n  <script>\n${page}\n</script>`),
);
EOF

echo "Done: dist/index.html — open it with a double-click"
