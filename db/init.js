import sqlite3 from "sqlite3";
import { fileURLToPath } from 'url';
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), "../data");

sqlite3.verbose();

const db = new sqlite3.Database(path.join(__dirname, "bookmarks.db"), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX, (err) => {
    if (!err) console.log("bookmarks db successfully loaded");
    else console.log(err);
});

process.on("exit", () => db.close());

db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) console.log('failed to enable foreign keys:', err);
});

db.run(
    `CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY,
        type INTEGER CHECK (type IN (1,2)),
        title TEXT NOT NULL,
        parent INTEGER NOT NULL DEFAULT 0,
        url TEXT,
        shortcut_l TEXT,
        shortcut_g TEXT,

        UNIQUE(title, parent)
        CHECK (NOT (type = 1 AND parent = 0)),
        FOREIGN KEY (parent) REFERENCES bookmarks(id) ON DELETE CASCADE
    );`,
    (err) => {
        if (err) console.log(err);
        else db.run(`INSERT OR IGNORE INTO bookmarks (id, type, title, parent) VALUES (0, 2, 'root', 0);`);
    }
);

db.run(
    `CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY,
        bookmark_id INTEGER NOT NULL UNIQUE,
        width INTEGER,
        height INTEGER,
        data BLOB NOT NULL,

        FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
    );`,
    (err) => {
        if (err) console.log(err);
    }
);

export function get_db() {
    return db;
}

export function async_run(sql, params) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (!err) resolve({ last_id: this.lastID, changes: this.changes });
            else reject(err);
        });
    });
}

