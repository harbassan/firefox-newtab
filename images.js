import { parseHTML } from "linkedom";
import sharp from "sharp";
import { parseICO } from "icojs";
import path from "path";

function area(img) {
  return img.height * img.width;
}

async function get_meta(buffer, ext) {
  if (ext === ".ico") {
    const images = await parseICO(buffer);
    return images.reduce((max, img) => (area(img) > area(max) ? img : max), images[0])
  } else {
    return sharp(buffer).metadata();
  }
}

async function eval_image(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const metadata = await get_meta(buffer, path.extname(url.pathname));
    return { url: url, width: metadata.width, height: metadata.height };
  } catch (err) {
    return null;
  }
}

async function fetch_and_sort(hrefs, base_url) {
  const urls = hrefs.map(href => new URL(href, base_url));
  let imgs_data = await Promise.all(urls.map(eval_image));
  imgs_data = imgs_data.filter(Boolean).sort((a, b) => area(b) - area(a));
  return imgs_data;
}

export default async function get_images(base_url) {
  const res = await fetch(base_url);
  const { document } = await res.text().then(parseHTML);

  const icon_hrefs = document.head.querySelectorAll("link[rel*='icon']").map(el => el.href);
  icon_hrefs.push('/favicon.ico');

  const banner_hrefs = document.head.querySelectorAll("meta[property='og:image'], meta[name='twitter:image:src'], meta[name='twitter:image']").map(el => el.content);

  const icon_images = await fetch_and_sort(icon_hrefs, base_url);
  const banner_images = await fetch_and_sort(banner_hrefs, base_url);

  return { icons: icon_images, banners: banner_images };
}
