import { add_bookmark, add_folder, get_all, get_joined, get_one, remove_bookmark, update_attribute } from "./db/bookmarks.js";
import { get_icon } from "./db/images.js";
import find_icon from "./parser.js";

const static_registry = {};
const dynamic_registry = [];

function register(method, path, handler) {
    const regex = gen_regex(path);
    if (regex === null) {
        static_registry[`${method} ${path}`] = handler;
    } else {
        dynamic_registry.push({ ...regex, method, handler })
    }
}

function gen_regex(path) {
    const param_names = [];
    const regex_string = path
        .replace(/\/:(\w+)/g, (_, param_name) => {
            param_names.push(param_name);
            return '/([^/]+)';
        })
        .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regex_string}$`);

    if (param_names.length === 0) return null;
    return { regex, param_names };
}

export function get_entry(method, path, req) {
    // try direct indexing
    const static_match = static_registry[`${method} ${path}`];
    if (static_match !== undefined) return static_match;

    // try matching to a dynamic route
    for (const route of dynamic_registry) {
        if (route.method !== method) continue;

        const match = path.match(route.regex);
        if (!match) continue;

        req.params = {};
        route.param_names.forEach((name, i) => {
            req.params[name] = match[i + 1];
        });

        return route.handler;
    }
}

register("GET", "/bookmarks", async (_, res) => {
    const bookmarks = await get_joined();
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(bookmarks));
});

register("GET", "/icon/:id", async (req, res) => {
    try {
        const icon = await get_icon(req.params.id);
        if (!icon) throw new Error("resource doesn't exist");
        res.writeHead(200, { "content-type": "image/png" });
        res.end(icon.data);
    } catch (err) {
        res.writeHead(500, { "content-type": "text/plain" });
        res.end(`bad request: ${err.message}`);

    }
});

register("POST", "/icon/:id", async (req, res) => {
    try {
        const bookmark = await get_one(req.params.id);
        if (bookmark.type !== 1) throw new Error("this is not a valid resource");
        find_icon(req.params.id, bookmark.url);
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("icon update request received");
    } catch (err) {
        res.writeHead(500, { "content-type": "text/plain" });
        res.end(`bad request: ${err.message}`);
    }
});

register("DELETE", "/bookmarks/:id", async (req, res) => {
    await remove_bookmark(req.params.id);
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("successfully deleted bookmark / folder");
});

register("PATCH", "/bookmarks/:id", async (req, res) => {
    let body = "";

    req.on("data", chunk => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        try {
            const data = JSON.parse(body);

            if ((Object.keys(data).length === 0)) throw new Error("missing attribute");
            await update_attribute(req.params.id, data);
            if (data.url) find_icon(req.params.id, data.url);
            res.writeHead(200, { "content-type": "text/plain" });
            res.end("successfully updated entry");
        } catch (err) {
            res.writeHead(500, { "content-type": "text/plain" });
            res.end(`bad request: ${err.message}`);
        }
    });
});

register("POST", "/bookmarks", (req, res) => {
    let body = "";

    req.on("data", chunk => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        try {
            const data = JSON.parse(body);

            if (data.type === 1) {
                if (!(data.title && data.url && data.parent)) throw new Error("missing either title, url, parent");
                const last_id = await add_bookmark({ title: data.title, url: data.url, parent: data.parent });
                find_icon(last_id, data.url);
            } else if (data.type === 2) {
                if (!data.title) throw new Error("missing title");
                await add_folder({ title: data.title });
            } else {
                throw new Error("missing type");
            }

            res.writeHead(200, { "content-type": "text/plain" });
            res.end("successfully added bookmark / folder");
        } catch (err) {
            res.writeHead(500, { "content-type": "text/plain" });
            res.end(`bad request: ${err.message}`);
        }
    });
});

