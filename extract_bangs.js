import bangs from "./data/bangs.json" with { type: "json" };
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const map = {};
for (const bang of bangs) {
  map[bang.bang] = bang.title;
}

await fs.writeFile(path.join(__dirname, "/served/bangs.js"), `export default ${JSON.stringify(map)}`);
console.log("bangs map created");
