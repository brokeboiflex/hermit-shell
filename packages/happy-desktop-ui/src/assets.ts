import type { ChatWallpaperPattern } from "happy-desktop-state";

export const happyLogoBlackUrl = new URL("./assets/brand/logo-black.png", import.meta.url).href;
export const happyLogoWhiteUrl = new URL("./assets/brand/logo-white.png", import.meta.url).href;
export const welcomeSkyUrl = new URL("./assets/backdrops/welcome-sky.jpg", import.meta.url).href;
export const welcomeSkyDarkUrl = new URL("./assets/backdrops/welcome-sky-dark.jpg", import.meta.url)
    .href;
export const happyWordmarkLightUrl = new URL(
    "./assets/brand/happy-engineering-stacked-light.svg",
    import.meta.url,
).href;
export const todoBackdropUrl = new URL("./assets/backdrops/todo-ginkgo.jpg", import.meta.url).href;
export const todoBackdropDarkUrl = new URL(
    "./assets/backdrops/todo-ginkgo-dark.jpg",
    import.meta.url,
).href;

/** The coding-monogram tiles a `ChatWallpaperPattern` names (scripts/generate-chat-wallpapers.mjs). */
export const chatWallpaperUrls = {
    braces: new URL("./assets/wallpapers/braces.png", import.meta.url).href,
    tags: new URL("./assets/wallpapers/tags.png", import.meta.url).href,
    prompt: new URL("./assets/wallpapers/prompt.png", import.meta.url).href,
    lambda: new URL("./assets/wallpapers/lambda.png", import.meta.url).href,
} as const satisfies Record<ChatWallpaperPattern, string>;
