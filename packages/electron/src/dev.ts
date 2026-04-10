import path from "node:path";
import { createServer, type Server } from "http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Simple static server for UI during dev
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(__dirname, "../../ui");

function serve(): Server {
  return createServer((req, res) => {
    const url = req.url === "/" ? "/index.html" : req.url || "/index.html";
    const filePath = path.join(uiRoot, url.split("?")[0]);
    try {
      const content = readFileSync(filePath);
      res.writeHead(200).end(content);
    } catch {
      res.writeHead(404).end("Not found");
    }
  }).listen(3000);
}

serve();
await import("./main");
