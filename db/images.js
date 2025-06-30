import { get_db, async_run } from "./init.js";

const db = get_db();

export function get_icon(id) {
    return new Promise((resolve, reject) => db.get("SELECT width, height, data FROM images WHERE id = ?", [id], function(err, row) {
        if (!err) resolve(row);
        else reject(err);
    }));

}

export function add_icon(id, { width, height, blob }) {
    const sql = `
        INSERT INTO images (bookmark_id, width, height, data)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(bookmark_id)
        DO UPDATE SET width = excluded.width, height = excluded.height, data = excluded.data
    `;
    return async_run(sql, [id, width, height, blob]);
}
