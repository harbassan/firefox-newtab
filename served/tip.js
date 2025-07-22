import { update, clear } from "./status.js";

let source = localStorage.getItem("tip-source") || "csq";

export async function generate() {
    if (localStorage.getItem("tip-enabled") === "false") return;
    const tip = await fetch(`/tip/${source}`).then(res => res.text());
    update(tip);
}

function switch_source(args) {
    if (args.length !== 2) throw new Error("incorrect no. of arguments, expected one: source");
    const new_source = args[1];

    localStorage.setItem("tip-source", new_source);
    source = new_source;
}

export function handle(args) {
    if (args.length === 0) throw new Error("incorrect no. of arguments, expected atleast one");
    const operation = args[0];

    if (operation === "toggle") {
        const is_enabled = JSON.parse(localStorage.getItem("tip-enabled") || "true");
        localStorage.setItem("tip-enabled", !is_enabled);
        if (is_enabled) clear(); else generate();
        return;
    }

    if (operation === "source") {
        switch_source(args);
    }
}
