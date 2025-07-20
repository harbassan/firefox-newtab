import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import mime from "mime";
import "dotenv/config";

import { get_entry } from "./registry.js";

const is_prod = process.env.NODE_ENV === "production";
const port = is_prod ? 8080 : 3005;
const hostname = is_prod ? "0.0.0.0" : "127.0.0.1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), "/served");

const server = http.createServer(async (req, res) => {
  let target = req.url;

  const handler = get_entry(req.method, target, req);
  if (handler !== undefined) return handler(req, res);

  // static file service
  if (target == "/") target = "/index.html";
  const filePath = path.join(__dirname, target);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end("resource failed to load\n");
    } else {
      res.writeHead(200, { "content-type": mime.getType(filePath) || "application/octet-stream" });
      res.end(content);
    }
  })
})

server.listen(port, hostname, () => {
  console.log(`server running at ${hostname}:${port}/`);
})
