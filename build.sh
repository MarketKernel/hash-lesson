#!/usr/bin/env bash
# Сборка страницы в один файл dist/index.html — открывается двойным кликом, без сервера и хостинга.
#
# Браузер не грузит модули и фоновые потоки из локальных файлов, поэтому весь код вклеивается в HTML:
#   - общий src/algebra.ts кладётся один раз, каждый шаг src/stepN.ts — в свою область видимости;
#   - код фонового потока кладётся в <script type="text/plain" id="worker-src"> — page.ts запускает его через Blob;
#   - код страницы — обычным <script>.
# Типы из .ts убирает сам Node — зависимостей нет.
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
mkdir dist

node --no-warnings --input-type=module <<'EOF'
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const js = (file) => stripTypeScriptTypes(readFileSync(file, "utf8"));

const noImports = (code) => code.replace(/^import .*;$/gm, "").replace(/^export /gm, "");

// Общий модуль algebra.ts — один раз, в начало: шаги видят polynomials через замыкание.
const algebra = noImports(js("src/algebra.ts"));

// Шаги: каждый — в свою функцию (у всех свои P, hash, invert), наружу только hash и invert.
const steps = readdirSync("src")
  .filter((f) => /^step\d+\.ts$/.test(f))
  .sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4)))
  .map((f) => `const ${f.slice(0, -3)} = (() => {\n${noImports(js(`src/${f}`))}\nreturn { hash, invert };\n})();`)
  .join("\n\n");

// Поток: импорты не нужны — шаги уже лежат выше под теми же именами.
const worker = algebra + "\n\n" + steps + "\n\n" + noImports(js("src/worker.ts"));
const page = js("src/page.ts");

for (const [name, code] of [["worker", worker], ["page", page]]) {
  if (code.includes("</script")) throw new Error(`${name}: в коде есть </script — сломает HTML`);
}

const tag = '<script type="module" src="src/page.ts"></script>';
const html = readFileSync("index.html", "utf8");
if (!html.includes(tag)) throw new Error(`в index.html нет ${tag}`);
writeFileSync(
  "dist/index.html",
  html.replace(tag, () => `<script type="text/plain" id="worker-src">\n${worker}\n</script>\n  <script>\n${page}\n</script>`),
);
EOF

echo "Готово: dist/index.html — открыть двойным кликом"
