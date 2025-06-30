import { async_run } from "./init.js";

export function get_icon(id) {
    return async_run("SELECT mime_type, data FROM images WHERE bookmark_id = ?", [id]);
}

export function add_icon(id, { width, height, blob }) {
    return async_run("INSERT INTO images (bookmark_id, width, height, data) VALUES (?, ?, ?)", [id, width, height, blob]);
}
