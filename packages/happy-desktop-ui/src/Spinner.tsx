import { type CSSProperties } from "react";
import { Icon } from "./Icon";
import { cn } from "./lib/utils";

/**
 * The names of the terminal ASCII loaders Spinner used to draw. Every one now
 * draws shadcn's Spinner, so a variant no longer changes the mark; the names
 * stay only so existing callers and `SPINNER_FRAMES` keep compiling until they
 * are removed.
 */
export type SpinnerVariant =
    | "braille-2"
    | "braille-9"
    | "braille-10"
    | "braille-11"
    | "braille-13"
    | "braille-sand"
    | "line"
    | "arc"
    | "circle"
    | "blocks"
    | "bar"
    | "bounce"
    | "dots"
    | "toggle"
    | "pulse"
    | "grow-vertical"
    | "grow-horizontal"
    | "triangle"
    | "quadrant"
    | "box-bounce"
    | "hamburger"
    | "noise"
    | "arrow";

export type SpinnerTone = "default" | "muted" | "accent" | "inverse";

/** Every variant name, in the order the blueprint used to present them. */
export const SPINNER_VARIANTS: readonly SpinnerVariant[] = [
    "braille-2",
    "braille-9",
    "braille-10",
    "braille-11",
    "braille-13",
    "braille-sand",
    "line",
    "arc",
    "circle",
    "blocks",
    "bar",
    "bounce",
    "dots",
    "toggle",
    "pulse",
    "grow-vertical",
    "grow-horizontal",
    "triangle",
    "quadrant",
    "box-bounce",
    "hamburger",
    "noise",
    "arrow",
];

/**
 * How many parked positions one turn of the glyph is divided into for each
 * variant name: `frame` k of n holds the glyph k/n of the way round, so a
 * fixture can freeze it on a known angle.
 */
export const SPINNER_FRAMES: Record<SpinnerVariant, number> = {
    "braille-2": 8,
    "braille-9": 8,
    "braille-10": 7,
    "braille-11": 8,
    "braille-13": 8,
    "braille-sand": 35,
    line: 4,
    arc: 4,
    circle: 4,
    blocks: 4,
    bar: 8,
    bounce: 10,
    dots: 4,
    toggle: 2,
    pulse: 4,
    "grow-vertical": 6,
    "grow-horizontal": 7,
    triangle: 4,
    quadrant: 4,
    "box-bounce": 4,
    hamburger: 3,
    noise: 3,
    arrow: 8,
};

export type SpinnerProps = {
    className?: string;
    /** Holds the glyph still on one position of its turn — for fixtures and screenshots. */
    frame?: number;
    /** Accessible name; the spinner is a live `status` region. */
    label?: string;
    /** Edge of the square glyph box in CSS pixels; 16 by default, shadcn's `size-4`. */
    size?: number;
    tone?: SpinnerTone;
    /**
     * @deprecated Every variant draws the same turning glyph since the move to
     * shadcn's Spinner. It only picks how many parked positions `frame` divides
     * a turn into. Stop passing it.
     */
    variant?: SpinnerVariant;
};

/*
 * `default` inherits the surrounding ink, as shadcn's Spinner does, so a
 * spinner standing in for a button's icon is drawn in the button's own colour.
 */
const toneClassName: Record<SpinnerTone, string | undefined> = {
    default: undefined,
    muted: "text-muted-foreground",
    accent: "text-primary",
    inverse: "text-primary-foreground",
};

/**
 * Spinner — shadcn/ui's Spinner (https://ui.shadcn.com/docs/components/radix/spinner)
 * with the curated `loading` font glyph turning in place of Lucide's loader.
 *
 * It is built here rather than by wrapping `components/ui/spinner`, because
 * that wrapper puts every prop on the glyph and none on its `status` root, and
 * this root carries the `happy-spinner` hooks that tests and surfaces address.
 * The glyph turns with a CSS animation on `transform` alone, so it keeps
 * turning on the compositor while the main thread is busy; under reduced
 * motion it turns at a slower rate rather than freezing.
 */
export function Spinner(props: SpinnerProps) {
    const variant = props.variant ?? "braille-2";
    const frames = SPINNER_FRAMES[variant];
    const paused = props.frame !== undefined;
    const index = paused ? (((props.frame ?? 0) % frames) + frames) % frames : 0;
    const side = props.size ?? 16;
    const glyphStyle: CSSProperties = {
        fontSize: `${side}px`,
        height: `${side}px`,
        width: `${side}px`,
        ...(paused ? { rotate: `${(index / frames) * 360}deg` } : null),
    };
    return (
        <span
            aria-label={props.label ?? "Loading"}
            className={cn(
                "happy-spinner inline-flex shrink-0 items-center justify-center align-middle",
                toneClassName[props.tone ?? "default"],
                props.className,
            )}
            data-frame={paused ? index : undefined}
            data-happy-desktop-ui="spinner"
            data-paused={paused ? "" : undefined}
            data-slot="spinner"
            data-tone={props.tone ?? "default"}
            data-variant={variant}
            role="status"
        >
            <Icon
                className={
                    paused ? undefined : "animate-spin motion-reduce:[animation-duration:2s]"
                }
                name="loading"
                style={glyphStyle}
            />
        </span>
    );
}
