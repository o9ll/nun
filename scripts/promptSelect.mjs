/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import readline from "readline";

function renderMenu(label, items, selected) {
    return [
        label,
        ...items.map((item, i) => `${i === selected ? "❯ " : "  "}${item}`),
        "",
        "(Use Arrow)"
    ].join("\n");
}

export async function promptSelect(label, items) {
    if (!items.length) throw new Error("No select");
    if (items.length === 1) return 0;

    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error("Interactive selection requires a TTY");
    }

    let selected = 0;
    let lineCount = 0;

    const draw = () => {
        if (lineCount > 0) process.stdout.write(`\x1b[${lineCount}A\x1b[0J`);

        const menu = renderMenu(label, items, selected);
        process.stdout.write(menu);
        lineCount = menu.split("\n").length;
    };

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    draw();

    return new Promise((resolve, reject) => {
        const cleanup = () => {
            process.stdin.off("keypress", onKeypress);
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdout.write("\n");
        };

        const onKeypress = (_str, key) => {
            if (!key) return;

            if (key.name === "up") {
                selected = (selected - 1 + items.length) % items.length;
                draw();
            } else if (key.name === "down") {
                selected = (selected + 1) % items.length;
                draw();
            } else if (key.name === "return") {
                cleanup();
                resolve(selected);
            } else if (key.ctrl && key.name === "c") {
                cleanup();
                process.exit(0);
            }
        };

        process.stdin.on("keypress", onKeypress);

        process.stdin.once("error", err => {
            cleanup();
            reject(err);
        });
    });
}
