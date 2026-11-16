/**
 * The picture painted behind every chat, chosen for the window as Animated
 * avatars is. `none` keeps the plain surface; `custom` is a picture of the
 * person's own, which the host keeps and delivers as an image URL. Every other
 * id is a coding-monogram pattern bundled in `happy-desktop-ui`, whose
 * `chatWallpaperUrls` and `ChatWallpaperPicker` labels are typed against this
 * list, so adding an id here does not compile until both have it.
 */
export const CHAT_WALLPAPERS = ["none", "braces", "tags", "prompt", "lambda", "custom"] as const;

export type ChatWallpaper = (typeof CHAT_WALLPAPERS)[number];

/** A bundled pattern: every wallpaper but none and the person's own picture. */
export type ChatWallpaperPattern = Exclude<ChatWallpaper, "none" | "custom">;

/** Reads a stored id back; an id this build does not ship reads as nothing. */
export function chatWallpaperParse(value: unknown): ChatWallpaper | undefined {
    return CHAT_WALLPAPERS.find((wallpaper) => wallpaper === value);
}
