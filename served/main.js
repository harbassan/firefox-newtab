import * as bookmarks_manager from "./bookmarks_manager.js";
import bangs from "./bangs.js";

const config = {
  DEFAULT_SEARCH_ENGINE: "https://encrypted.google.com/search?q={{{s}}}",
  BANG_SEARCH_ENGINE: "https://duckduckgo.com/?q={{{s}}}"
}

const search_input = document.querySelector(".search input");
const shortcuts_input = document.querySelector(".shortcuts-input");
const bang_el = document.querySelector(".bang");

let shortcut_context = bookmarks_manager.open_bookmark_by_shortcut;
let is_unloading = false;
let active_bang = "";
let is_banging = false;

function search(input) {
  let query = input.trim();
  const encoded = encodeURIComponent(query);
  const regexp = /\.[a-zA-Z]{2,63}/;

  if (query.match(regexp)) {
    query = query.startsWith("http") ? query : `https://${query}`;
  } else if (!active_bang) {
    query = config.DEFAULT_SEARCH_ENGINE.replace("{{{s}}}", encoded);
  } else {
    query = config.BANG_SEARCH_ENGINE.replace("{{{s}}}", `${active_bang} ${encoded}`);
  }

  window.open(query, "_self");
}

function set_bang(bang) {
  const title = bangs[bang];
  if (!title) return;

  bang_el.textContent = title.toLocaleLowerCase();
  active_bang = bang;
  search_input.value = "";
  bang_el.classList.remove("hidden");
}

function clear_bang() {
  is_banging = false;
  active_bang = "";
  bang_el.textContent = "";
  bang_el.classList.add("hidden");
}

search_input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    search(search_input.value);
  } else if (event.key === "Escape") {
    shortcuts_input.focus();
    search_input.value = "";
    clear_bang();
  } else if (event.key === "!" && search_input.value.length === 0) {
    is_banging = true;
  } else if (event.key === " " && is_banging) {
    event.preventDefault();
    is_banging = false;
    set_bang(search_input.value);
  }
})

function reset_shortcuts_input() {
  shortcuts_input.value = "";
  shortcut_context = bookmarks_manager.open_bookmark_by_shortcut;
}

shortcuts_input.addEventListener("input", (event) => {
  if (is_unloading) return;
  const success = shortcut_context(event.target.value);
  if (success) reset_shortcuts_input();
})

document.addEventListener("keydown", (event) => {
  if (search_input === document.activeElement) return;
  switch (event.key) {
    case "/":
      event.preventDefault();
      shortcuts_input.value = "";
      search_input.focus();
      break;
    case "'":
    case "!":
      event.preventDefault();
      shortcuts_input.value = "";
      search_input.value = "!";
      is_banging = true;
      search_input.focus();
      break;
    case ".":
      event.preventDefault();
      bookmarks_manager.open_all();
      break;
    case ";":
      event.preventDefault();
      shortcuts_input.value = "";
      shortcut_context = bookmarks_manager.set_folder_by_shortcut;
      break;
    case " ":
      event.preventDefault();
      shortcuts_input.value = "";
      shortcut_context = bookmarks_manager.open_bookmark_by_shortcut_g;
      break;
    case "Escape":
      reset_shortcuts_input();
      break;
    default:
      if (shortcuts_input !== document.activeElement) {
        shortcuts_input.value = "";
        shortcuts_input.focus();
      }
  }
})

window.addEventListener("beforeunload", () => {
  is_unloading = true; // block any further navigation on unload
  reset_shortcuts_input(); // just in case the previous reset didn't fire
});

window.addEventListener("unload", () => {
  is_unloading = false;
})
