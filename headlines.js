import fs from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

import "dotenv/config";

const url = `https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=${process.env.NEWS_API_KEY}`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function get_headlines() {
  const response = await fetch(url).then(res => res.json());
  if (response.status !== "ok") {
    return console.log("error fetching headlines");
  };
  return response.articles.slice(0, 5);
}

async function update_headlines() {
  const headlines = await get_headlines();
  if (!headlines) return null;
  fs.writeFile(path.join(__dirname, "/served/headlines_store.js"), `export default ${JSON.stringify(headlines)}`);
  console.log("headlines successfully written to store");
}

export default function load_headlines() {
  update_headlines();
  setInterval(update_headlines, 600000);
}
