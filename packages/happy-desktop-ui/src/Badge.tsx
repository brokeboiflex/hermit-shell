import { type VariantProps } from "class-variance-authority";
import { Badge as ShadcnBadge, type badgeVariants } from "./components/ui/badge";
import { Kbd } from "./components/ui/kbd";
import { Toggle } from "./components/ui/toggle";
import { Icon, type IconName } from "./Icon";
import { cn } from "./lib/utils";
export type BadgeVariant =
    | "neutral"
    | "accent"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "outline";
export type BadgeProps = {
    className?: string;
    icon?: IconName;
    label: string;
    variant?: BadgeVariant;
};

type ShadcnBadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/*
 * Happy's seven variants drawn as shadcn's. Success, warning, and info have no
 * shadcn counterpart: each is drawn the way radix-nova draws destructive, a
 * soft fill of its own hue, over the secondary variant whose two colour
 * utilities its own replace.
 */
const shadcnBadgeVariant = {
    neutral: "secondary",
    accent: "default",
    success: "secondary",
    warning: "secondary",
    danger: "destructive",
    info: "secondary",
    outline: "outline",
} as const satisfies Record<BadgeVariant, ShadcnBadgeVariant>;

const badgeVariantClassName: Record<BadgeVariant, string | undefined> = {
    neutral: undefined,
    accent: undefined,
    success: "bg-success/10 text-success dark:bg-success/20",
    warning: "bg-warning/10 text-warning dark:bg-warning/20",
    danger: undefined,
    info: "bg-info/10 text-info dark:bg-info/20",
    outline: undefined,
};

/** C-005 Badge — a status pill (needs review, agent, in progress…): shadcn/ui's Badge. */
export function Badge(props: BadgeProps) {
    const variant = props.variant ?? "neutral";
    return (
        <ShadcnBadge
            className={cn("happy-badge", badgeVariantClassName[variant], props.className)}
            data-happy-desktop-ui="badge"
            data-variant={variant}
            variant={shadcnBadgeVariant[variant]}
        >
            {props.icon ? (
                <span
                    className="happy-badge__icon flex shrink-0"
                    data-happy-desktop-ui="badge-icon"
                    data-icon="inline-start"
                >
                    <Icon name={props.icon} size={12} />
                </span>
            ) : null}
            <span className="happy-badge__label" data-happy-desktop-ui="badge-label">
                {props.label}
            </span>
        </ShadcnBadge>
    );
}
export type CountBadgeProps = {
    className?: string;
    count: number;
    tone?: "accent" | "neutral";
};
/**
 * Unread-count pill: shadcn's count badge (a round Badge with mono tabular
 * figures). `accent` is the default ink-on-paper badge; `neutral` the
 * secondary one.
 */
export function CountBadge(props: CountBadgeProps) {
    const tone = props.tone ?? "accent";
    /* Stepped integral width (20/28/36…) instead of the intrinsic text width:
     * digit advances are fractional, and a fractional-width pill lands
     * right-aligned boxes off the device-pixel grid, visibly shifting the
     * rasterized digits. Each step is one 12px mono digit rounded up. */
    const width = 20 + (String(props.count).length - 1) * 8;
    return (
        <ShadcnBadge
            className={cn(
                "happy-count-badge min-w-5 rounded-full px-1 font-mono tabular-nums",
                props.className,
            )}
            data-happy-desktop-ui="count-badge"
            data-tone={tone}
            style={{ width: `${width}px` }}
            variant={tone === "accent" ? "default" : "secondary"}
        >
            <span className="happy-count-badge__label" data-happy-desktop-ui="count-badge-label">
                {props.count}
            </span>
        </ShadcnBadge>
    );
}
export type ReactionChipProps = {
    active?: boolean;
    className?: string;
    count: number;
    emoji: string;
    onSelect?: () => void;
};
/**
 * Emoji reaction pill under a message: a shadcn/ui outline Toggle, pressed
 * while the reaction is the reader's own, which gives it the quiet selected
 * fill.
 */
export function ReactionChip(props: ReactionChipProps) {
    return (
        <Toggle
            aria-label={`${props.emoji} ${props.count}`}
            className={cn(
                "happy-reaction-chip h-6 min-w-6 gap-1.5 rounded-full px-2",
                props.className,
            )}
            data-active={props.active ? "" : undefined}
            data-happy-desktop-ui="reaction-chip"
            onPressedChange={() => props.onSelect?.()}
            pressed={props.active === true}
            size="sm"
            variant="outline"
        >
            <span
                className="happy-reaction-chip__emoji flex size-4 shrink-0 items-center justify-center font-(family-name:--happy-font-emoji) text-[13px] leading-none"
                data-happy-desktop-ui="reaction-chip-emoji"
            >
                <span
                    className="happy-reaction-chip__emoji-glyph block"
                    data-happy-desktop-ui="reaction-chip-emoji-glyph"
                >
                    {props.emoji}
                </span>
            </span>
            <span
                className="happy-reaction-chip__count font-mono text-xs text-muted-foreground tabular-nums group-data-[state=on]/toggle:text-foreground"
                data-happy-desktop-ui="reaction-chip-count"
            >
                {props.count}
            </span>
        </Toggle>
    );
}
export type KeyCapProps = {
    className?: string;
    /** Removes the cap from the accessibility tree when its owner announces the shortcut. */
    decorative?: boolean;
    keys: string;
};
/** The modifier keys macOS names with a symbol. */
const shortcutSymbols = new Set(["⌘", "⇧", "⌥", "⌃"]);
/**
 * Keyboard shortcut hint, e.g. ⌘K in the title-bar search field: shadcn/ui's
 * Kbd. It is every shortcut the app shows — sidebar rows, menus, buttons, the
 * palette, tooltips and the search field all draw this one. The modifier
 * symbols come from the system face, which the sans stack falls back to.
 */
export function KeyCap(props: KeyCapProps) {
    return (
        <Kbd
            aria-hidden={props.decorative ? "true" : undefined}
            aria-label={props.decorative ? undefined : props.keys}
            className={cn("happy-key-cap", props.className)}
            data-happy-desktop-ui="key-cap"
        >
            <span
                className="happy-key-cap__label inline-flex items-baseline"
                data-happy-desktop-ui="key-cap-label"
            >
                {Array.from(props.keys).map((key, index) => (
                    <span
                        className="happy-key-cap__key"
                        data-kind={shortcutSymbols.has(key) ? "symbol" : "text"}
                        key={`${key}-${index}`}
                        data-happy-desktop-ui="key-cap-key"
                    >
                        <span
                            className={
                                shortcutSymbols.has(key)
                                    ? "happy-key-cap__symbol"
                                    : "happy-key-cap__text"
                            }
                            data-happy-desktop-ui={
                                shortcutSymbols.has(key) ? "key-cap-symbol" : "key-cap-text"
                            }
                        >
                            {key}
                        </span>
                    </span>
                ))}
            </span>
        </Kbd>
    );
}
