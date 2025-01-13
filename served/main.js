import * as bookmarks_manager from "./bookmarks_manager.js";

const search_input = document.querySelector(".search input");
const shortcuts_input = document.querySelector(".shortcuts-input");

let shortcut_context = bookmarks_manager.open_bookmark_by_shortcut;
let is_unloading = false;

function search(input) {
  const encoded = encodeURIComponent(input.trim());
  let query = `https://search.brave.com/search?q=${encoded}`
  const regexp = /\.[a-zA-Z]{2,63}/;
  if (encoded.match(regexp)) {
    query = encoded.startsWith("http") ? encoded : `https://${encoded}`;
  };
  window.open(query, "_self");
}

search_input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    search(search_input.value);
  } else if (event.key === "Escape") {
    shortcuts_input.focus();
    search_input.value = "";
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
