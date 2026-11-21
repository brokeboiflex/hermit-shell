import { AssistantMark, type AssistantMarkName } from "./AssistantMark";
import { Icon, type IconName } from "./Icon";
import { cn } from "./lib/utils";
import { Ionicon, type IoniconName } from "./vectorIcons/VectorIcon";

/** The tile hues: iOS's system colours, from the `--happy-tile-*` roles. */
export type IconTileTone =
    | "blue"
    | "green"
    | "orange"
    | "indigo"
    | "purple"
    | "red"
    | "teal"
    | "gray";

/** `small` stands in a 20px glyph lane (a sidebar row); `medium` leads a settings row. */
export type IconTileSize = "small" | "medium";

type IconTileGlyph =
    | { readonly icon: IconName; readonly ionicon?: never; readonly mark?: never }
    | { readonly ionicon: IoniconName; readonly icon?: never; readonly mark?: never }
    /** A vendor's own mark, a little smaller than a glyph, as the native clients draw it. */
    | { readonly mark: AssistantMarkName; readonly icon?: never; readonly ionicon?: never };

export type IconTileProps = IconTileGlyph & {
    readonly tone: IconTileTone;
    readonly size?: IconTileSize;
    readonly className?: string;
};

const GLYPH_SIZE = { small: 14, medium: 18 } as const;
/** 20px in a sidebar's glyph lane, 28px at the head of a settings row; rounded about 0.3 of the side. */
const BOX_CLASS_NAME = { small: "size-5 rounded-sm", medium: "size-7 rounded-md" } as const;
/* The tile carries white ink in every appearance, the avatar tones' own. */
const TONE_CLASS_NAME: Record<IconTileTone, string> = {
    blue: "bg-tile-blue",
    green: "bg-tile-green",
    orange: "bg-tile-orange",
    indigo: "bg-tile-indigo",
    purple: "bg-tile-purple",
    red: "bg-tile-red",
    teal: "bg-tile-teal",
    gray: "bg-tile-gray",
};
const MARK_SIZE = { small: 12, medium: 16 } as const;

/**
 * A white glyph on a filled, rounded square of one hue: the mark the native
 * clients' settings put at the head of a row, and macOS System Settings at the
 * head of each pane in its sidebar. The hue says which kind of thing the row is,
 * never its state, so it does not change while the row is used.
 */
export function IconTile(props: IconTileProps) {
    const size = props.size ?? "medium";
    return (
        <span
            aria-hidden="true"
            className={cn(
                "happy-icon-tile flex shrink-0 items-center justify-center text-avatar-ink",
                BOX_CLASS_NAME[size],
                TONE_CLASS_NAME[props.tone],
                props.className,
            )}
            data-happy-desktop-ui="icon-tile"
            data-size={size}
            data-tone={props.tone}
        >
            {props.icon !== undefined ? (
                <Icon name={props.icon} size={GLYPH_SIZE[size]} />
            ) : props.mark !== undefined ? (
                <AssistantMark name={props.mark} size={MARK_SIZE[size]} />
            ) : (
                <Ionicon name={props.ionicon} size={GLYPH_SIZE[size]} />
            )}
        </span>
    );
}
