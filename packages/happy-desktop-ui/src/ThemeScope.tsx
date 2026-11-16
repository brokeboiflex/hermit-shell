import { createContext, type CSSProperties, type ReactNode } from "react";
import type { ChatWallpaper, CustomTheme, ThemeColorRole, ThemeMode } from "happy-desktop-state";
import { chatWallpaperUrls } from "./assets";
import { AvatarsAnimatedContext } from "./AvatarPlaceholder";

export type { ThemeMode };
export type ScrollbarVisibility = "always" | "automatic";

/** Resolved scheme for paired artwork; system remains a native media query. */
export const ThemeAppearanceContext = createContext<"dark" | "light" | "system" | undefined>(
    undefined,
);

export type ThemeScopeProps = {
    children: ReactNode;
    mode: ThemeMode;
    /** The hand-made theme `custom` renders; an untouched midnight when absent. */
    customTheme?: CustomTheme;
    scrollbarVisibility?: ScrollbarVisibility;
    /** Animated avatars: placeholders move as their shaders instead of showing their stills. */
    avatarsAnimated?: boolean;
    /** The picture behind every chat in the subtree; the plain surface when absent or `none`. */
    chatWallpaper?: ChatWallpaper;
    /** The person's own picture, as an image URL, which `custom` shows. */
    chatWallpaperImage?: string;
};

/**
 * Applies one user-selected appearance to a stable product subtree while
 * retaining the system palette when no explicit override is selected. The
 * custom theme is its base palette's class with the replaced roles declared on
 * the same element, so every descendant inherits them as it would the base.
 * A chat wallpaper is declared the same way, as the image every conversation
 * in the subtree paints (`styles/chat-wallpaper.css`); `custom` without a
 * picture paints none.
 */
export function ThemeScope(props: ThemeScopeProps) {
    const palette = props.mode === "custom" ? (props.customTheme?.base ?? "midnight") : props.mode;
    const colors = props.mode === "custom" ? props.customTheme?.colors : undefined;
    const wallpaper = chatWallpaperPainted(props.chatWallpaper, props.chatWallpaperImage);
    return (
        <ThemeAppearanceContext value={palette === "midnight" ? "dark" : palette}>
            <AvatarsAnimatedContext value={props.avatarsAnimated ?? false}>
                <div
                    className={
                        palette === "system"
                            ? "happy-theme-scope"
                            : `happy-theme-scope happy-theme-${palette}`
                    }
                    data-happy-desktop-ui="theme-scope"
                    data-chat-wallpaper={wallpaper?.wallpaper}
                    data-scrollbar-visibility={props.scrollbarVisibility ?? "automatic"}
                    style={scopeStyle(colors, wallpaper)}
                >
                    {props.children}
                </div>
            </AvatarsAnimatedContext>
        </ThemeAppearanceContext>
    );
}

/** The wallpaper actually painted and its image, or nothing for the plain surface. */
function chatWallpaperPainted(
    wallpaper: ChatWallpaper | undefined,
    image: string | undefined,
): { wallpaper: Exclude<ChatWallpaper, "none">; url: string } | undefined {
    if (wallpaper === undefined || wallpaper === "none") return undefined;
    if (wallpaper === "custom") return image === undefined ? undefined : { wallpaper, url: image };
    return { wallpaper, url: chatWallpaperUrls[wallpaper] };
}

function scopeStyle(
    colors: CustomTheme["colors"] | undefined,
    wallpaper: { url: string } | undefined,
): CSSProperties | undefined {
    if (!colors && !wallpaper) return undefined;
    const style: Record<string, string> = {};
    for (const [role, value] of Object.entries(colors ?? {}) as [ThemeColorRole, string][])
        style[`--${role}`] = value;
    if (wallpaper) style["--happy-chat-wallpaper-image"] = `url("${wallpaper.url}")`;
    return style;
}
