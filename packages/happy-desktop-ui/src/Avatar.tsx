import { partitionComponentProps } from "./componentProps";
import { useState, type CSSProperties, type HTMLAttributes } from "react";
import { AvatarPlaceholder } from "./AvatarPlaceholder";
import {
    Avatar as ShadcnAvatar,
    AvatarBadge,
    AvatarFallback,
    AvatarImage,
} from "./components/ui/avatar";
import { Icon, type IconName } from "./Icon";
import { cn } from "./lib/utils";
export type AvatarSize = "xs" | "sm" | "md" | "lg";
export type AvatarType = "human" | "agent";
export type ToneName = "violet" | "ember" | "mint" | "ocean" | "rose" | "amber" | "slate" | "brand";
/**
 * The hue of a glyph mark's soft tile: the glyph in the hue, on the same hue
 * very light. One hue per kind of thing, as the phone's home list draws its
 * rows' marks.
 */
export type AvatarTint = "blue" | "green" | "orange" | "indigo" | "purple" | "red" | "teal";
export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, "style"> & {
    /**
     * Marks an entity that is named by a symbol rather than by a person or a
     * picture — the home project, say. It replaces the initials, and an
     * `imageUrl` still wins over it.
     */
    icon?: IconName;
    /** Uses the Happy brand image selected by the surrounding theme. */
    imageTheme?: "brand";
    imageUrl?: string;
    initials: string;
    online?: boolean;
    /**
     * The ID of whatever this avatar stands for, when it has no picture of its
     * own: it then wears the placeholder that ID picks, the same one the phone
     * shows for it, instead of initials: its still, or its live shader under
     * Animated avatars (`AvatarsAnimatedContext`). An `imageUrl` or an `icon`
     * still wins over it.
     */
    placeholderSeed?: string;
    size?: AvatarSize;
    style?: CSSProperties;
    /**
     * Draws an `icon` mark as a coloured glyph on a softly tinted tile instead
     * of the neutral chip. A picture or a placeholder ignores it.
     */
    tint?: AvatarTint;
    tone?: ToneName;
    type?: AvatarType;
};
/** Glyph size per avatar box, leaving the tile's ink inset on every size. */
const iconSize = { xs: 12, sm: 16, md: 18, lg: 20 } as const satisfies Record<AvatarSize, number>;
/** Each size's box in CSS pixels. */
const boxSize = { xs: 20, sm: 28, md: 36, lg: 44 } as const satisfies Record<AvatarSize, number>;
/*
 * The box per size. `data-size` keeps Happy's names, and two of them — `sm`
 * and `lg` — are also shadcn's, whose `data-[size=…]` rules would otherwise
 * resize the box, the initials, and the presence dot; the variant classes
 * below take their place (tailwind-merge drops shadcn's).
 */
const boxClassName: Record<AvatarSize, string> = {
    xs: "size-5",
    sm: "size-7",
    md: "size-9",
    lg: "size-11",
};
const sizeVariantOverrides = "data-[size=sm]:size-7 data-[size=lg]:size-11";
/** An agent's rounded square: about 0.3 of its side, on shadcn's radius scale. */
const agentRadiusClassName: Record<AvatarSize, string> = {
    xs: "rounded-sm",
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
};
const initialsClassName: Record<AvatarSize, string> = {
    xs: "text-[0.5rem]",
    sm: "text-[0.625rem] group-data-[size=sm]/avatar:text-[0.625rem]",
    md: "text-xs",
    lg: "text-sm",
};
/*
 * A colour tone is a filled tile carrying white ink; brand is the primary
 * action's own pair; slate is shadcn's neutral fallback chip.
 */
const toneClassName: Record<ToneName, string> = {
    violet: "bg-avatar-violet text-avatar-ink",
    ember: "bg-avatar-ember text-avatar-ink",
    mint: "bg-avatar-mint text-avatar-ink",
    ocean: "bg-avatar-ocean text-avatar-ink",
    rose: "bg-avatar-rose text-avatar-ink",
    amber: "bg-avatar-amber text-avatar-ink",
    slate: "bg-avatar-slate text-muted-foreground",
    brand: "bg-avatar-brand text-avatar-brand-ink",
};
/** The glyph in its hue on the same hue very light, translucent over any row. */
const tintClassName: Record<AvatarTint, string> = {
    blue: "bg-tile-blue-fill text-tile-blue",
    green: "bg-tile-green-fill text-tile-green",
    orange: "bg-tile-orange-fill text-tile-orange",
    indigo: "bg-tile-indigo-fill text-tile-indigo",
    purple: "bg-tile-purple-fill text-tile-purple",
    red: "bg-tile-red-fill text-tile-red",
    teal: "bg-tile-teal-fill text-tile-teal",
};
/**
 * C-004 Avatar — shadcn/ui's Avatar: a circle for a person, a rounded square
 * for an agent. A picture fills the mark; while it loads the mark is empty,
 * and only a picture that fails falls back to the initials. Without one, the
 * mark wears the placeholder its seed picks, a glyph, or the initials on its
 * tone.
 */
export function Avatar(props: AvatarProps) {
    const [local, rest] = partitionComponentProps(props, [
        "children",
        "className",
        "icon",
        "imageTheme",
        "imageUrl",
        "initials",
        "online",
        "placeholderSeed",
        "size",
        "style",
        "tint",
        "tone",
        "type",
    ]);
    // Whether the picture failed to load, as Radix reports it. A picture still
    // loading shows nothing rather than initials that would swap for it.
    const [imageFailed, setImageFailed] = useState(false);
    const size = local.size ?? "md";
    const type = local.type ?? "human";
    const tone = local.tone ?? "slate";
    const brand = local.imageTheme === "brand";
    const placeholder =
        !local.imageUrl && !local.icon && local.placeholderSeed !== undefined
            ? local.placeholderSeed
            : undefined;
    const tint = !local.imageUrl && local.icon ? local.tint : undefined;
    const shape = brand
        ? "rounded-none after:hidden"
        : type === "agent"
          ? agentRadiusClassName[size]
          : "rounded-full";
    const fallbackClassName = cn(
        "rounded-[inherit] font-medium",
        initialsClassName[size],
        tint === undefined ? toneClassName[tone] : tintClassName[tint],
    );
    return (
        <ShadcnAvatar
            {...rest}
            aria-hidden={props["aria-label"] ? undefined : "true"}
            className={cn(
                "happy-avatar after:rounded-[inherit]",
                boxClassName[size],
                sizeVariantOverrides,
                shape,
                local.className,
            )}
            data-image={local.imageUrl ? "" : undefined}
            data-image-theme={local.imageTheme}
            data-placeholder={placeholder === undefined ? undefined : ""}
            data-happy-desktop-ui="avatar"
            data-size={size}
            data-tint={tint}
            data-tone={tone}
            data-type={type}
            role={props["aria-label"] ? "img" : undefined}
            style={local.style}
        >
            {local.imageUrl ? (
                <>
                    <AvatarImage
                        alt=""
                        className={cn(
                            "happy-avatar__image rounded-[inherit]",
                            brand ? "happy-brand-logo p-px object-contain" : undefined,
                        )}
                        data-happy-desktop-ui="avatar-image"
                        draggable={false}
                        onLoadingStatusChange={(status) => setImageFailed(status === "error")}
                        src={local.imageUrl}
                    />
                    {imageFailed ? (
                        <AvatarFallback
                            className={cn("happy-avatar__initials", fallbackClassName)}
                            data-happy-desktop-ui="avatar-initials"
                        >
                            {local.initials}
                        </AvatarFallback>
                    ) : null}
                </>
            ) : local.icon ? (
                <AvatarFallback
                    className={cn("happy-avatar__glyph", fallbackClassName)}
                    data-happy-desktop-ui="avatar-glyph"
                >
                    <Icon name={local.icon} size={iconSize[size]} />
                </AvatarFallback>
            ) : placeholder !== undefined ? (
                <AvatarPlaceholder
                    className="happy-avatar__placeholder block size-full rounded-[inherit] object-cover"
                    seed={placeholder}
                    side={boxSize[size]}
                />
            ) : (
                <AvatarFallback
                    className={cn("happy-avatar__initials", fallbackClassName)}
                    data-happy-desktop-ui="avatar-initials"
                >
                    {local.initials}
                </AvatarFallback>
            )}
            {local.online && (
                <AvatarBadge
                    aria-hidden="true"
                    className="happy-avatar__presence size-2 bg-status-connected group-data-[size=lg]/avatar:size-2.5"
                    data-happy-desktop-ui="avatar-presence"
                />
            )}
        </ShadcnAvatar>
    );
}
