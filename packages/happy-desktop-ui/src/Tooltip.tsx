import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Kbd } from "./components/ui/kbd";
import { Tooltip as TooltipRoot, TooltipContent, TooltipTrigger } from "./components/ui/tooltip";
import type { KeyboardShortcut } from "./keyboardShortcut";
import { cn } from "./lib/utils";
import { modalOverlayEscapeHandOn } from "./ModalOverlay";

export type TooltipPlacement = "top" | "bottom";
export type TooltipAlign = "center" | "start" | "end";

export interface TooltipProps {
    /**
     * Where the bubble sits along the trigger: centered on it, starting at its
     * leading edge, or ending at its trailing edge, for a trigger near one of
     * the window's own edges.
     */
    readonly align?: TooltipAlign;
    /** The trigger. It keeps its own box; the bubble leaves the flow entirely. */
    readonly children: ReactNode;
    readonly className?: string;
    readonly "data-testid"?: string;
    /** Bubble text. With none, the trigger renders bare and nothing wraps it. */
    readonly label?: string;
    /**
     * `true` forces the bubble open regardless of pointer or focus, with no
     * delay, so the revealed state is directly renderable by a blueprint
     * fixture or test. `false` keeps it shut, for a trigger whose own popup is
     * open where the bubble would rise. Absent, hover and focus decide.
     */
    readonly open?: boolean;
    readonly placement?: TooltipPlacement;
    /** The chord that does what the trigger does, shown after the text as a key cap. */
    readonly shortcut?: KeyboardShortcut;
    readonly style?: CSSProperties;
}

/*
 * How long the pointer must rest on a trigger before its bubble appears. The
 * browser's own `title` waits around a second — long enough that detail put
 * behind it reads as absent rather than deferred. This is short enough that
 * the detail feels like part of the thing already being looked at, and still
 * long enough that a pointer crossing a row on its way elsewhere opens nothing.
 * Keyboard focus opens it at once, and closing never waits.
 */
const OPEN_DELAY_MS = 180;

/**
 * C-179 Tooltip — the house replacement for the native `title` attribute:
 * secondary detail held behind a trigger and revealed on hover or focus,
 * drawn as shadcn's tooltip (the inverted foreground bubble with its arrow).
 *
 * Built on the shadcn/Radix tooltip. The trigger is a bare inline-flex wrapper
 * around the child — it takes the child's size and passes its shrink through,
 * so the row it sits in measures exactly as it does with no tooltip — and the
 * bubble hangs off the shell's overlay lane, so it never changes the layout it
 * explains and is never clipped by a scrolling list. The bubble takes no
 * pointer, so it never covers a control the person is reaching for.
 *
 * Only keyboard focus opens the bubble at once: focus that followed a click,
 * or that a script moved — a dialog focusing its first control as it opens —
 * is not the person asking about that control. Escape closes an open bubble
 * and still reaches the dialog beneath it, as it did when the bubble was not a
 * layer of its own.
 *
 * The bubble is only what the eye reads. The description a screen reader
 * announces is a visually hidden copy of the label inside the trigger, always
 * present, so it is announced without a pointer and only once while the
 * bubble is up. Content must still be non-essential: a trigger that is not
 * focusable offers no keyboard route to the bubble, exactly as `title` did not.
 */
export function Tooltip(props: TooltipProps) {
    // Hover and focus, as Radix reports them; `open` overrides them either way.
    const [shown, setShown] = useState(false);
    const descriptionId = useId();
    // Held shut, the bubble forgets any hover or focus it saw before, so it
    // does not rise unasked the moment it is let go.
    if (props.open === false && shown) setShown(false);
    if (props.label === undefined) return <>{props.children}</>;
    return (
        <TooltipRoot
            delayDuration={OPEN_DELAY_MS}
            disableHoverableContent
            onOpenChange={props.open === undefined ? setShown : undefined}
            open={props.open ?? shown}
        >
            <TooltipTrigger
                aria-describedby={descriptionId}
                asChild
                onFocus={(event) => {
                    // Radix opens on any focus it did not see a press for;
                    // a prevented focus skips that.
                    if (!event.currentTarget.matches(":focus-visible, :has(:focus-visible)"))
                        event.preventDefault();
                }}
            >
                <span
                    className={cn(
                        "happy-tooltip inline-flex min-w-0 items-center",
                        props.className,
                    )}
                    data-happy-desktop-ui="tooltip"
                    data-open={props.open ? "" : undefined}
                    data-testid={props["data-testid"]}
                    style={props.style}
                >
                    {props.children}
                    <span
                        className="happy-tooltip__description sr-only select-none"
                        id={descriptionId}
                    >
                        {props.label}
                    </span>
                </span>
            </TooltipTrigger>
            <TooltipContent
                align={props.align ?? "center"}
                className="happy-tooltip__bubble pointer-events-none font-sans tabular-nums select-none"
                data-happy-desktop-ui="tooltip-bubble"
                data-placement={props.placement ?? "top"}
                onEscapeKeyDown={modalOverlayEscapeHandOn}
                side={props.placement ?? "top"}
            >
                <span aria-hidden="true">{props.label}</span>
                {props.shortcut ? (
                    <Kbd aria-hidden="true" className="happy-tooltip__shortcut">
                        {props.shortcut.caps}
                    </Kbd>
                ) : null}
            </TooltipContent>
        </TooltipRoot>
    );
}
