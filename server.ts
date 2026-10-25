// Local server for index.html: node server.ts → http://localhost:8000
// Browsers don't understand TypeScript, so types are stripped from .ts files on the fly (built into Node).

import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { stripTypeScriptTypes } from "node:module";
import { extname, join, normalize, sep } from "node:path";

const root = import.meta.dirname;
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".ts": "text/javascript; charset=utf-8",
};

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname));
  const file = join(root, path === sep ? "index.html" : path);
  if (!file.startsWith(root + sep) || !types[extname(file)]) {
    res.writeHead(404).end("not found");
    return;
  }
  try {
    let body = await readFile(file, "utf8");
    if (extname(file) === ".ts") body = stripTypeScriptTypes(body);
    res.writeHead(200, { "content-type": types[extname(file)] }).end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(8000, "127.0.0.1", () => console.log("http://localhost:8000"));
