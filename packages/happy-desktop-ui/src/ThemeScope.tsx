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
 * custom theme is its base palette's class with the replaced roles, and the
 * shadcn tokens they stand for, declared on the same element, so every
 * descendant inherits them as it would the base.
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

/*
 * The shadcn tokens a custom theme's roles feed. The roles keep Happy's names,
 * and CSS that has not converted still reads them by name; converted
 * components paint from shadcn's tokens instead, which the migration aliases
 * in theme.css point the other way. So each role the theme sets is declared
 * under its own name and, through this table, under every shadcn token it
 * stands for, and the whole window takes the person's colours.
 *
 * A token follows only roles that mean the same thing across the window. A
 * role that names one place (a header, the composer's send button, the
 * person's own message) stays with the CSS that reads it by name, so tinting
 * that place never recolours every surface. Several roles now collapse onto
 * one token — a hover and a press are both `accent` — and where the theme sets
 * more than one, the first listed wins.
 */
const SHADCN_TOKEN_ROLES: Readonly<Record<string, readonly ThemeColorRole[]>> = {
    background: ["surface"],
    foreground: ["text"],
    card: ["surface"],
    "card-foreground": ["text"],
    popover: ["surface"],
    "popover-foreground": ["text"],
    primary: ["button-primary-background"],
    "primary-foreground": ["button-primary-tint"],
    secondary: ["surface-high"],
    "secondary-foreground": ["text"],
    muted: ["surface-high", "surface-selected"],
    "muted-foreground": ["text-secondary"],
    accent: ["surface-pressed", "surface-ripple", "surface-highest"],
    "accent-foreground": ["text"],
    destructive: ["text-destructive"],
    border: ["divider"],
    input: ["switch-track-inactive", "radio-inactive"],
    sidebar: ["groupped-background"],
};

/*
 * Roles whose property in theme.css no longer carries the role's name: the
 * grey `warning` ink is `--quiet-ink`, so it never meets shadcn's amber
 * `warning` colour.
 */
const ROLE_PROPERTIES: Readonly<Partial<Record<ThemeColorRole, string>>> = {
    warning: "quiet-ink",
};

function scopeStyle(
    colors: CustomTheme["colors"] | undefined,
    wallpaper: { url: string } | undefined,
): CSSProperties | undefined {
    if (!colors && !wallpaper) return undefined;
    const style: Record<string, string> = {};
    for (const [role, value] of Object.entries(colors ?? {}) as [ThemeColorRole, string][])
        style[`--${ROLE_PROPERTIES[role] ?? role}`] = value;
    if (colors)
        for (const [token, roles] of Object.entries(SHADCN_TOKEN_ROLES)) {
            const value = roles.map((role) => colors[role]).find((color) => color !== undefined);
            if (value !== undefined) style[`--${token}`] = value;
        }
    if (wallpaper) style["--happy-chat-wallpaper-image"] = `url("${wallpaper.url}")`;
    return style;
}
