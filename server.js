import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import mime from "mime";

import load_bookmarks from "./bookmarks.js";
import load_headlines from "./headlines.js";

const hostname = "127.0.0.1";
const port = "3000";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), "/served");

load_bookmarks();
load_headlines();

const server = http.createServer(async (req, res) => {
  let target = req.url;

  if (target == "/") {
    target = "/index.html";
  }

  const filePath = path.join(__dirname, target);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end("resource failed to load");
    } else {
      res.writeHead(200, { "content-type": mime.getType(filePath) || "application/octet-stream" });
      res.end(content);
    }
  })
})

server.listen(port, hostname, () => {
  console.log(`server running at ${hostname}:${port}/`);
})
