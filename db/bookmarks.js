import { async_run, get_db } from "./init.js";

const db = get_db();

export function get_all() {
    return new Promise((resolve, reject) => db.all(`SELECT * FROM bookmarks`, [], function(err, rows) {
        if (!err) resolve(rows);
        else reject(err);
    }));
}

export function get_one(id) {
    return new Promise((resolve, reject) => db.get("SELECT * FROM bookmarks WHERE id = ?", [id], function(err, row) {
        if (!err) resolve(row);
        else reject(err);
    }));
}

export function get_joined() {
    return new Promise((resolve, reject) => db.all(`SELECT bookmarks.*, images.id AS image_id, images.width, images.height FROM bookmarks LEFT JOIN images ON bookmarks.id = images.bookmark_id`, [], function(err, rows) {
        if (!err) resolve(rows);
        else reject(err);
    }));
}

async function generate_shortcuts() {
    const bookmarks = await get_all();
    const updates = [];
    for (const bookmark of bookmarks) {
        let shortcut_g = bookmark.title[0];
        let shortcut_l = bookmark.title[0];
        for (const bookmark_i of bookmarks) {
            if (bookmark.type !== bookmark_i.type || bookmark.title === bookmark_i.title) continue;
            if (bookmark.type === 1 && bookmark_i.parent === bookmark.parent) {
                while (bookmark_i.title.startsWith(shortcut_l)) {
                    shortcut_l = bookmark.title.slice(0, shortcut_l.length + 1);
                }
                if (shortcut_l.length > shortcut_g.length) shortcut_g = shortcut_l;
            } else {
                while (bookmark_i.title.startsWith(shortcut_g)) {
                    shortcut_g = bookmark.title.slice(0, shortcut_g.length + 1);
                }
            }
        }
        if (bookmark.shortcut_l !== shortcut_l || bookmark.shortcut_g !== shortcut_g) {
            updates.push({ id: bookmark.id, shortcut_l, shortcut_g });
        }
    }

    return Promise.all(updates.map(update => {
        new Promise((resolve, reject) => {
            db.run(
                `UPDATE bookmarks SET shortcut_l = ?, shortcut_g = ? WHERE id = ?`,
                [update.shortcut_l, update.shortcut_g, update.id],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        })
    }));
}

export async function add_bookmark({ title, url, parent }) {
    const { last_id } = await async_run(`INSERT INTO bookmarks (type, title, parent, url) VALUES (1, ?, ?, ?)`, [title, parent, url]);
    await generate_shortcuts();
    return last_id;
}

export async function add_folder({ title }) {
    await async_run(`INSERT INTO bookmarks (type, title) VALUES (2, ?)`, [title]);
    await generate_shortcuts();
}

export async function remove_bookmark(id) {
    await async_run(`DELETE FROM bookmarks WHERE id = ?`, id);
    await generate_shortcuts();
}

export async function update_attribute(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);

    if (keys.length === 0) return;

    const set_clause = keys.map(key => `${key} = ?`).join(", ");
    const sql = `UPDATE bookmarks SET ${set_clause} WHERE id = ?`;

    const { last_id } = await async_run(sql, [...values, id]);
    await generate_shortcuts();
    return last_id;
}
