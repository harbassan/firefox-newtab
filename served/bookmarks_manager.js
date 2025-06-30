import { update } from "./status.js";

const links_container = document.querySelector(".container");
const tabs_container = document.querySelector(".tab-container");

let tab_elements = {};
let active_folder = null;
let bookmarks = null;

export async function load() {
  bookmarks = await fetch("/bookmarks").then(res => res.json()).catch(err => console.log(err));
  const folders = bookmarks.filter(bm => bm.type === 2 && bm.id !== 0);
  while (tabs_container.firstChild) tabs_container.removeChild(tabs_container.firstChild);
  for (const folder of folders) {
    generate_tab(folder.id, folder.title, folder.shortcut_g);
  }
  let active = retrieve_active_folder();
  if (active === undefined || folders.find(f => f.id == active) === undefined) active = folders[0]?.id;
  else active = Number(active);
  set_active_folder(active);
}

function generate_link(bookmark) {
  const { url, shortcut_l, title, image_id, width } = bookmark;
  console.log(bookmark);
  return (`
    <div class="thumb">
      <a href="${url}">
        <div class="img-wrapper">
          ${image_id ? `<img data-width="${width}" src="/icon/${image_id}"></img>` : `<div class="placeholder">${title[0].toLocaleUpperCase()}</div>`}
        </div>
        <h4><u>${shortcut_l}</u>${title.slice(shortcut_l.length)}</h4>
      </a>
    </div>
  `)
}

function render_links(id) {
  const links = bookmarks.filter(bm => bm.parent === id).map(generate_link);
  links_container.innerHTML = links.join("");
}

function save_active_folder(id) {
  localStorage.setItem('active_folder_id', id);
}

function retrieve_active_folder() {
  return localStorage.getItem('active_folder_id');
}

function set_active_folder(id) {
  if (active_folder) tab_elements[active_folder].classList.remove("active");
  active_folder = id;
  tab_elements[id].classList.add("active");
  render_links(id);
  save_active_folder(id);
}

function generate_tab(id, name, shortcut) {
  const tab = document.createElement("div");
  tab.innerHTML = `<u>${shortcut}</u>${name.slice(shortcut.length)}`;
  tab.addEventListener("click", () => set_active_folder(id));
  tabs_container.appendChild(tab);
  tab_elements[id] = tab;
}

export function set_folder_by_shortcut(input) {
  const found_folder = bookmarks.find(bm => bm.type === 2 && bm.shortcut_g === input);
  if (!found_folder) return null;
  set_active_folder(found_folder.id);
  return true;
}

export function open_bookmark_by_shortcut(input) {
  const found_bookmark = bookmarks.find(bm => bm.parent === active_folder && bm.shortcut_l === input);
  if (!found_bookmark) return null;
  window.location.href = found_bookmark.url;
  return true;
}

export function open_bookmark_by_shortcut_g(input) {
  const found_bookmark = bookmarks.find(bm => bm.type === 1 && bm.shortcut_g === input);
  if (!found_bookmark) return null;
  window.location.href = found_bookmark.url;
  return true;
}

export function open_all() {
  for (const bookmark of bookmarks.find(bm => bm.parent === active_folder)) {
    window.open(bookmark.url, "_blank");
  }
}

export async function create_folder(args) {
  if (args.length !== 1) throw new Error("incorrect no. of arguments, expected one: title");
  const [title] = args;

  await fetch("/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: 2, title })
  }).then(res => res.text()).then(update);

  load();
}

export async function remove(args) {
  if (args.length !== 1) throw new Error("incorrect no. of arguments, expected one: path");
  const [path] = args;
  let [parent, title] = path.split("/");

  let pid = 0;
  if (!title) title = parent;
  else pid = bookmarks.find(bm => bm.type === 2 && bm.title === parent)?.id;
  const id = bookmarks.find(bm => bm.title === title && bm.parent === pid)?.id;

  if (id === undefined) throw new Error("specified bookmark / folder doesn't exist");

  await fetch(`/bookmarks/${id}`, {
    method: "DELETE",
  }).then(res => res.text()).then(update);

  load();
}

export async function create_bookmark(args) {
  if (args.length !== 2) throw new Error("incorrect no. of arguments, expected two: path, url");
  const [path, url] = args;
  let [parent, title] = path.split("/");

  let pid = active_folder;
  if (!title) title = parent;
  else pid = bookmarks.find(bm => bm.type === 2 && bm.title === parent)?.id;

  if (pid === undefined) throw new Error("specified folder doesn't exist");

  await fetch("/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: 1, title, url, parent: pid })
  }).then(res => res.text()).then(update);

  load();
}

export async function move(args) {
  if (args.length !== 2) throw new Error("incorrect no. of arguments, expected two: path_o, path_n");
  const [path_o, path_n] = args;
  let [parent_o, title_o] = path_o.split("/");
  let [parent_n, title_n] = path_n.split("/");

  let pid_o = 0;
  if (!title_o) title_o = parent_o;
  else pid_o = bookmarks.find(bm => bm.type === 2 && bm.title === parent_o)?.id;

  const id = bookmarks.find(bm => bm.parent === pid_o && bm.title === title_o)?.id;
  if (id === undefined) throw new Error("specified bookmark doesn't exist");

  let pid_n = 0;
  if (pid_o === 0) {
    if (title_n) throw new Error("specified path is not valid for this type");
    title_n = parent_n;
  } else {
    if (!title_n) throw new Error("specified path is not valid for this type");
    pid_n = bookmarks.find(bm => bm.type === 2 && bm.title === parent_n)?.id;
  }

  await fetch(`/bookmarks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title_n, parent: pid_n })
  }).then(res => res.text()).then(update);

  load();
}

export async function change_url(args) {
  if (args.length !== 2) throw new Error("incorrect no. of arguments, expected two: url, path");
  const [url, path] = args;
  const [parent, title] = path.split("/");

  const pid = bookmarks.find(bm => bm.type === 2 && bm.title === parent)?.id;
  const id = bookmarks.find(bm => bm.parent === pid && bm.title === title)?.id;

  if (id === undefined) throw new Error("specified bookmark doesn't exist");

  await fetch(`/bookmarks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  }).then(res => res.text()).then(update);

  load();
}

export async function update_icon(args) {
  if (args.length !== 1) throw new Error("incorrect no. of arguments, expected one: path");
  const [path] = args;
  let [parent, title] = path.split("/");

  let pid = active_folder;
  if (!title) title = parent;
  else pid = bookmarks.find(bm => bm.type === 2 && bm.title === parent)?.id;
  const id = bookmarks.find(bm => bm.parent === pid && bm.title === title)?.id;

  if (id === undefined) throw new Error("specified bookmark doesn't exist");

  await fetch(`/icon/${id}`, {
    method: "POST",
  }).then(res => res.text().then(update));
}
