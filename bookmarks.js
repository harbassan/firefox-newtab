import fs from "fs/promises";
import path from "path";
import { fileURLToPath, URL } from "url";

import "dotenv/config";
import sqlite3 from "sqlite3";
import mime from "mime";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const places_db = `${process.env.FIREFOX_PF_PATH}/places.sqlite`;
const favicons_db = `${process.env.FIREFOX_PF_PATH}/favicons.sqlite`;

const places = new sqlite3.Database(places_db, sqlite3.OPEN_READONLY, (err) => {
  if (!err) console.log("bookmarks db successfully loaded");
  else console.log(err);
});

const favicons = new sqlite3.Database(favicons_db, sqlite3.OPEN_READONLY, (err) => {
  if (!err) console.log("favicons db successfully loaded");
  else console.log(err);
});

function minify_item(item) {
  return { id: item.id, type: item.type, fk: item.fk, title: item.title.toLocaleLowerCase() }
}

function isFolder(item) {
  return item.type === 2;
}

function get_descendant_folders(folder, all_folders) {
  const dsc_folders = folder.children.filter(isFolder).map(child => all_folders[child.id]);
  for (const dsc_folder of dsc_folders) {
    dsc_folders.push(...get_descendant_folders(dsc_folder));
  }
  return dsc_folders;
}

function get_url(bookmark) {
  return new Promise((resolve, reject) => {
    places.get(`SELECT * from moz_places WHERE id = '${bookmark.fk}'`, (err, row) => {
      if (err) return reject(err)
      resolve(row.url);
    })
  })
}

async function populate_urls(folders) {
  await Promise.all(folders.flatMap(folder =>
    folder.children.map(async bookmark => {
      bookmark.url = await get_url(bookmark);
    })
  ));
  console.log("bookmarks urls successfully populated");
}

function generate_b64_url(favicon) {
  const type = mime.getType(favicon.icon_url);
  const b64 = Buffer.from(favicon.data).toString("base64");
  return `data:${type};base64,${b64}`;
}

function get_favicon_by_id(id) {
  return new Promise((resolve, reject) => {
    favicons.get(`SELECT * from moz_icons WHERE id = '${id}'`, (err, icon) => {
      if (err) return reject(err);
      resolve(icon);
    })
  })
}

function get_favicon_for_page(page_id) {
  return new Promise((resolve, reject) => {
    favicons.all(`SELECT * from moz_icons_to_pages WHERE page_id = '${page_id}'`, async (err, matches) => {
      if (err) return reject(err);
      if (!matches.length) return resolve(null);
      const icons = await Promise.all(matches.map(match => get_favicon_by_id(match.icon_id)));
      const highest_q = icons.reduce((max, c) => c.width > max.width ? c : max);
      resolve(highest_q);
    })
  })
}

function get_highest_quality(icons) {
  return icons.reduce((max, c) => ((c.width > max.width && mime.getType(max.icon_url) !== "image/svg+xml") || mime.getType(c.icon_url) === "image/svg+xml") ? c : max);
}

//fallback for when we cant find it
function get_favicon_by_host(url) {
  const host = new URL(url).hostname;
  return new Promise((resolve, reject) => {
    favicons.all(`SELECT * from moz_icons WHERE icon_url LIKE '%${host}%'`, (err, icons) => {
      if (err) return reject(err);
      if (!icons.length) return resolve(null);
      const highest_q = get_highest_quality(icons);
      resolve({ url: highest_q.icon_url, width: highest_q.width, base64: generate_b64_url(highest_q) });
    })
  })
}

function get_favicon(bookmark) {
  return new Promise((resolve, reject) => {
    // const host = new URL(bookmark.url).hostname;
    favicons.all(`SELECT * from moz_pages_w_icons WHERE page_url = '${bookmark.url}'`, async (err, pages) => {
      if (err) return reject(err);
      if (!pages.length) return resolve(null);
      const icons = await Promise.all(pages.map(page => get_favicon_for_page(page.id))).then(arr => arr.filter(Boolean));
      if (!icons.length) return resolve(null);
      const highest_q = get_highest_quality(icons);
      resolve({ url: highest_q.icon_url, width: highest_q.width, base64: generate_b64_url(highest_q) });
    })
  })
}

async function populate_favicons(folders) {
  await Promise.all(folders.flatMap(folder =>
    folder.children.map(async bookmark => {
      let icon = await get_favicon(bookmark);
      if (!icon) icon = await get_favicon_by_host(bookmark.url);
      bookmark.icon = icon;
    })
  ))
  console.log("bookmarks favicons successfully populated");
}


function generate_shortcuts(items, key) {
  for (const item of items) {
    let itr = 1;
    while (true) {
      const test = item.title.substring(0, itr).toLocaleLowerCase();
      if (items.filter((i) => i.title.toLocaleLowerCase().startsWith(test)).length == 1) {
        item[key] = test;
        break;
      } else {
        itr += 1;
      }
    }
  }
}

function generate_all_shortcuts(folders) {
  generate_shortcuts(folders, "shortcut");
  const all_bookmarks = folders.flatMap(folder => {
    generate_shortcuts(folder.children, "shortcut_l");
    return folder.children;
  });
  generate_shortcuts(all_bookmarks, "shortcut_g");
}

function get_all_folders() {
  return new Promise((resolve, reject) => {
    places.all("SELECT * from moz_bookmarks", (err, items) => {
      if (err) return reject(err);

      const folders = {};

      for (const item of items) {
        if (item.type === 2) {
          if (folders[item.id]) {
            folders[item.id] = { ...minify_item(item), children: folders[item.id].children };
          } else {
            folders[item.id] = { ...minify_item(item), children: [] };
          }
        }

        if (folders[item.parent]) {
          folders[item.parent].children.push(minify_item(item));
        } else {
          folders[item.parent] = { children: [minify_item(item)] };
        }
      };

      resolve(folders);

      console.log("bookmarks successfully loaded into memory");
    })
  });
}

export default async function load_bookmarks() {
  const all_folders = await get_all_folders();
  const folders = get_descendant_folders(all_folders[2], all_folders);
  await populate_urls(folders);
  await populate_favicons(folders);
  generate_all_shortcuts(folders);

  await fs.writeFile(path.join(__dirname, "/served/store.js"), `export default ${JSON.stringify(folders)}`);
  console.log("bookmarks successfully written to store");
}
