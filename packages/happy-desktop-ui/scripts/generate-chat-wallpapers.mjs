#!/usr/bin/env node
// Writes the coding-monogram chat wallpapers into src/assets/wallpapers/: one
// seamless tile per pattern, code marks set in the house mono (JetBrains Mono,
// with its ligatures) and scattered at an even density, each at its own size
// and tilt. The scatter is seeded, so a run reproduces the same tiles.
//
// A tile is 960px square, drawn at 2x for a 480 CSS px repeat. Its ink is one
// neutral grey at low alpha on transparency: over a light surface it reads a
// shade darker, over a dark one a shade lighter, so one tile serves every
// appearance, custom themes included.
//
//   node packages/happy-desktop-ui/scripts/generate-chat-wallpapers.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { chromium } from "playwright";

const TILE = 960;
const INK = "rgb(128, 128, 128)";
const INK_ALPHA = 0.22;

/**
 * Each pattern's marks; `seed` fixes its scatter. Tags are set without the
 * font's ligatures, which would draw `/>` as one closing-tag arrow.
 */
const PATTERNS = {
    braces: {
        seed: 11,
        marks: ["{}", "[]", "()", "{ }", ";", "[ ]", "( )", "{;}"],
    },
    tags: {
        seed: 23,
        ligatures: false,
        marks: ["</>", "<>", "/>", "</", "<!>", "< />", "<a/>", "<?>"],
    },
    prompt: { seed: 37, marks: ["$", ">_", "~", "#", "&&", "$_", "~/", "!!"] },
    lambda: { seed: 41, marks: ["λ", "=>", "->", "::", "!=", "==", "λx", "|>"] },
};

const require = createRequire(import.meta.url);
const fontFile = (subset) =>
    readFileSync(
        require.resolve(
            `@fontsource-variable/jetbrains-mono/files/jetbrains-mono-${subset}-wght-normal.woff2`,
        ),
    ).toString("base64");

const out = join(import.meta.dirname, "../src/assets/wallpapers");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<!doctype html><canvas></canvas>");
await page.evaluate(
    async ({ latin, greek }) => {
        for (const [data, range] of [
            [latin, "U+0000-00FF"],
            [greek, "U+0370-03FF"],
        ]) {
            const face = new FontFace("happy Mono", `url(data:font/woff2;base64,${data})`, {
                weight: "100 800",
                unicodeRange: range,
            });
            document.fonts.add(await face.load());
        }
    },
    { latin: fontFile("latin"), greek: fontFile("greek") },
);

for (const [name, pattern] of Object.entries(PATTERNS)) {
    const png = await page.evaluate(
        ({ tile, ink, inkAlpha, seed, marks, ligatures = true }) => {
            // mulberry32: small, seedable, and the same in every engine.
            let state = seed >>> 0;
            const random = () => {
                state = (state + 0x6d2b79f5) >>> 0;
                let t = state;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
            // Distance on the torus, so marks keep their spacing across the seams.
            const apart = (a, b) => {
                const dx = Math.min(Math.abs(a.x - b.x), tile - Math.abs(a.x - b.x));
                const dy = Math.min(Math.abs(a.y - b.y), tile - Math.abs(a.y - b.y));
                return Math.hypot(dx, dy);
            };
            const placed = [];
            const place = (count, radius, make) => {
                for (let tries = 0; placed.length < count && tries < 20000; tries += 1) {
                    const candidate = { x: random() * tile, y: random() * tile, radius };
                    if (placed.every((other) => apart(candidate, other) > other.radius + radius))
                        placed.push({ ...candidate, ...make() });
                }
            };
            place(24, 84, () => ({
                mark: marks[Math.floor(random() * marks.length)],
                size: 40 + random() * 24,
                tilt: (random() - 0.5) * 0.9,
            }));
            const glyphs = placed.length;
            place(glyphs + 14, 24, () => ({ dot: 3 + random() * 2.5 }));

            const canvas = document.querySelector("canvas");
            canvas.width = tile;
            canvas.height = tile;
            const context = canvas.getContext("2d");
            context.fillStyle = ink;
            context.globalAlpha = inkAlpha;
            context.textAlign = "center";
            context.textBaseline = "middle";
            for (const item of placed) {
                for (const dx of [-tile, 0, tile]) {
                    for (const dy of [-tile, 0, tile]) {
                        context.save();
                        context.translate(item.x + dx, item.y + dy);
                        if (item.dot) {
                            context.beginPath();
                            context.arc(0, 0, item.dot, 0, Math.PI * 2);
                            context.fill();
                        } else {
                            context.rotate(item.tilt);
                            context.font = `600 ${item.size.toFixed(1)}px "happy Mono"`;
                            if (ligatures) context.fillText(item.mark, 0, 0);
                            else {
                                // One character at a time, so no ligature can form.
                                const characters = [...item.mark];
                                const advance = context.measureText("0").width;
                                characters.forEach((character, index) =>
                                    context.fillText(
                                        character,
                                        (index - (characters.length - 1) / 2) * advance,
                                        0,
                                    ),
                                );
                            }
                        }
                        context.restore();
                    }
                }
            }
            return canvas.toDataURL("image/png");
        },
        { tile: TILE, ink: INK, inkAlpha: INK_ALPHA, ...pattern },
    );
    writeFileSync(join(out, `${name}.png`), Buffer.from(png.split(",")[1], "base64"));
    console.log(`${name}.png`);
}
await browser.close();
