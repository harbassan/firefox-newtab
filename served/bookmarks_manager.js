import bookmarks from "./store.js";

const links_container = document.querySelector(".container");
const tabs_container = document.querySelector(".tab-container");

let tab_elements = {};
let active_folder = null;
const all_bookmarks = bookmarks.flatMap(folder => folder.children);

function generate_link(bookmark) {
  const { url, icon, shortcut_l, title } = bookmark;
  return (`
  <div class="thumb">
    <a href="${url}">
      <div class="img-wrapper">
        <img data-width="${icon?.width}" data-url="${icon?.url}" src="${icon?.base64}"></img>
      </div>
      <h4><u>${shortcut_l}</u>${title.slice(shortcut_l.length)}</h4>
    </a>
  </div>
  `)
}

function render_links(id) {
  const folder = bookmarks.find(folder => folder.id == id);
  const links = folder.children.map(bookmark => generate_link(bookmark));
  links_container.innerHTML = links.join("");
}

function save_active_folder(id) {
  localStorage.setItem('active_folder_id', id);
}

function retrieve_active_folder() {
  return localStorage.getItem('active_folder_id');
}

function set_active_folder(id) {
  if (active_folder) active_folder.el.classList.remove("active");
  active_folder = { id: id, el: tab_elements[id], node: bookmarks.find(folder => folder.id == id) };
  active_folder.el.classList.add("active");
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
  const found_folder = bookmarks.find(folder => folder.shortcut === input);
  if (!found_folder) return null;
  set_active_folder(found_folder.id);
  return true;
}

export function open_bookmark_by_shortcut(input) {
  const found_bookmark = active_folder.node.children.find(bookmark => bookmark.shortcut_l === input);
  if (!found_bookmark) return null;
  window.location.href = found_bookmark.url;
  return true;
}

export function open_bookmark_by_shortcut_g(input) {
  const found_bookmark = all_bookmarks.find(bookmark => bookmark.shortcut_g === input);
  if (!found_bookmark) return null;
  window.location.href = found_bookmark.url;
  return true;
}

export function open_all() {
  for (const bookmark of active_folder.node.children) {
    window.open(bookmark.url, "_blank");
  }
}

for (const folder of bookmarks) {
  generate_tab(folder.id, folder.title, folder.shortcut);
}
set_active_folder(retrieve_active_folder() || bookmarks[0].id);

