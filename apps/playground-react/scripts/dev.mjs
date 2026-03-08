import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const distIndex = path.join(appRoot, "dist", "index.html");

const buildModule = await import("./build.mjs");
void buildModule;

const server = createServer(async (_req, res) => {
  try {
    const html = await readFile(distIndex, "utf8");
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  } catch {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Unable to load React playground build output.");
  }
});

const port = Number(process.env.PORT ?? 4174);
server.listen(port, () => {
  console.log(`React playground running at http://localhost:${port}`);
});
