import { parseHTML } from "linkedom";
import sharp from "sharp";
import { parseICO } from "icojs";
import { add_icon } from "./db/images.js";

function area(img) {
  return img.height * img.width;
}

async function read_data({ content_type, url, buffer }) {
  // sharp doesn't support .ico format
  if (content_type === "image/x-icon" || url.endsWith(".ico")) {
    const images = await parseICO(buffer, "image/png");
    // get highest quality icon
    const best_image = images.reduce((best, image) => (area(image) > area(best) ? image : best), images[0]);
    return { width: best_image.width, height: best_image.height, blob: Buffer.from(best_image.buffer), url }
  }

  // TODO: add fallback package able to handle malformed image data
  const sharp_image = sharp(buffer);
  const { width, height } = await sharp_image.metadata();
  const blob = await sharp_image.png().toBuffer();
  return { width, height, blob, url };
}

async function fetch_image(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`failed to fetch image at ${url}`);

  const content_type = response.headers.get('content-type');
  const buffer = await response.arrayBuffer();
  return { content_type, buffer, url };
}

async function parse_icons(links, base_url) {
  const icons = [];

  for (const link of links) {
    try {
      const href = link.href;
      if (!href) continue;

      const icon_url = new URL(href, base_url).href;
      const image_res = await fetch_image(icon_url);
      const data = await read_data(image_res);

      icons.push(data);
    } catch (err) {
      console.log(err);
    }
  }

  return icons;
}

// TODO: overcome cloudfare and other middlemen that block actual page content
export default async function find_icon(id, url) {
  const base_url = new URL(url).origin;
  let links = [];
  const res = await fetch(base_url);
  if (!res.ok) {
    console.log(`failed to fetch ${base_url}: ${res.statusText}`);
  } else {
    const { document } = await res.text().then(parseHTML);
    links = document.head.querySelectorAll("link[rel*='icon']");
  }

  links.push({ href: '/favicon.ico' }); // fallback (even if page is forbidden)
  const parsed = await parse_icons(links, base_url);

  if (parsed.length === 0) {
    console.log(`no icons found at ${base_url}`);
    return;
  }

  // only store the highest quality image
  const best_icon = parsed.reduce((best, icon) => (area(icon) > area(best) ? icon : best), parsed[0]);
  add_icon(id, best_icon);
}
