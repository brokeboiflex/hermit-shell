import { chatWallpaperParse, type ChatWallpaper } from "happy-desktop-state";

const CHAT_WALLPAPER_KEY = "happy.chat-wallpaper.v1";
const CHAT_WALLPAPER_IMAGE_KEY = "happy.chat-wallpaper-image.v1";

/**
 * The picture behind every chat, kept in this machine's window storage as
 * Animated avatars is: how this machine dresses its chats is nothing an
 * account or a Happy Agent holds. None until one is picked; an id a later
 * build stopped shipping reads as none. The person's own picture is kept
 * beside it as the data URL the app already shrank for that purpose.
 */
export const desktopChatWallpaper = {
    read(): ChatWallpaper {
        try {
            return chatWallpaperParse(localStorage.getItem(CHAT_WALLPAPER_KEY)) ?? "none";
        } catch {
            return "none";
        }
    },
    write(wallpaper: ChatWallpaper): void {
        try {
            localStorage.setItem(CHAT_WALLPAPER_KEY, wallpaper);
        } catch {
            // A storage-denied renderer keeps the choice for this window's lifetime.
        }
    },
    imageRead(): string | undefined {
        try {
            return localStorage.getItem(CHAT_WALLPAPER_IMAGE_KEY) ?? undefined;
        } catch {
            return undefined;
        }
    },
    imageWrite(image: string): void {
        try {
            localStorage.setItem(CHAT_WALLPAPER_IMAGE_KEY, image);
        } catch {
            // Storage full or denied: the picture stays for this window's lifetime.
        }
    },
};
