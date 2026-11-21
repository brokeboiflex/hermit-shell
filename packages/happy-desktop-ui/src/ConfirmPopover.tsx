import { useCallback, useId, type CSSProperties, type KeyboardEvent } from "react";
import { Button } from "./components/ui/button";
import { PopoverDescription, PopoverHeader, PopoverTitle } from "./components/ui/popover";
import { cn } from "./lib/utils";

export type ConfirmPopoverTone = "default" | "danger" | "warning";

export type ConfirmPopoverProps = {
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    /** The question, in a few words. */
    title: string;
    /** What confirming does, when the title alone does not say it. */
    message?: string;
    /** Names the act itself, such as "Stop subagents", never a bare "OK". */
    confirmLabel: string;
    cancelLabel?: string;
    /**
     * `danger` paints the confirming action in the destructive role; `warning`
     * paints it amber, for an act worth a pause that is easily taken back.
     */
    tone?: ConfirmPopoverTone;
    /**
     * Which action takes focus when the card mounts. `cancel` (the default)
     * keeps a stray Enter harmless; `confirm` makes Enter the answer, for a
     * question the person asked for with a keystroke and expects to say yes to.
     */
    initialFocus?: "cancel" | "confirm";
    onCancel: () => void;
    onConfirm: () => void;
};

/*
 * The warning confirm is shadcn's destructive treatment in the warning colour:
 * a tint of the role under text in the role, never the destructive red.
 */
const WARNING_CONFIRM =
    "bg-warning/10 text-warning hover:bg-warning/20 focus-visible:border-warning/40 focus-visible:ring-warning/20 dark:bg-warning/20 dark:hover:bg-warning/30";

/**
 * C-310 ConfirmPopover — a small question card asked in place, beside the
 * control that raised it, instead of over the whole window. It is shadcn's
 * popover surface and header (title over a muted description) with two small
 * buttons, and it is the card alone: where it is anchored and what an outside
 * click does belong to the host — the composer hangs it above its Stop button,
 * the app floats it on a clear `ModalOverlay` — so it carries no Radix popover
 * root of its own.
 *
 * Mounting it moves focus to Cancel, so a stray Enter keeps things as they
 * are, unless the host asks for the confirm action instead. Escape cancels,
 * and Tab cycles between its two actions.
 */
export function ConfirmPopover(props: ConfirmPopoverProps) {
    const titleId = useId();
    const messageId = useId();
    const tone = props.tone ?? "default";
    const initialFocus = props.initialFocus ?? "cancel";
    // The card's commit is the moment its actions exist, so focus moves then
    // rather than after React's own scheduling.
    const cardRef = useCallback(
        (node: HTMLDivElement | null): void => {
            node?.querySelector<HTMLElement>(`button[data-action="${initialFocus}"]`)?.focus();
        },
        [initialFocus],
    );
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            props.onCancel();
            return;
        }
        if (event.key !== "Tab") return;
        const actions = [...event.currentTarget.querySelectorAll<HTMLElement>("button")];
        const first = actions[0];
        const last = actions.at(-1);
        if (first === undefined || last === undefined) return;
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };
    return (
        <div
            aria-describedby={props.message === undefined ? undefined : messageId}
            aria-labelledby={titleId}
            aria-modal="false"
            className={cn(
                "happy-confirm-popover flex w-70 cursor-default flex-col gap-2.5 rounded-lg bg-popover p-2.5 font-sans text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10",
                props.className,
            )}
            data-happy-desktop-ui="confirm-popover"
            data-testid={props["data-testid"]}
            data-tone={tone}
            onKeyDown={onKeyDown}
            ref={cardRef}
            role="alertdialog"
            style={props.style}
        >
            <PopoverHeader className="happy-confirm-popover__header">
                {/* Fixed words: never truncated, so a longer question wraps. */}
                <PopoverTitle
                    className="happy-confirm-popover__title wrap-anywhere"
                    data-happy-desktop-ui="confirm-popover-title"
                    id={titleId}
                >
                    {props.title}
                </PopoverTitle>
                {props.message === undefined ? null : (
                    <PopoverDescription
                        className="happy-confirm-popover__message m-0 wrap-anywhere"
                        data-happy-desktop-ui="confirm-popover-message"
                        id={messageId}
                    >
                        {props.message}
                    </PopoverDescription>
                )}
            </PopoverHeader>
            <div
                className="happy-confirm-popover__actions flex justify-end gap-2"
                data-happy-desktop-ui="confirm-popover-actions"
            >
                <Button
                    data-action="cancel"
                    onClick={() => props.onCancel()}
                    size="sm"
                    variant="ghost"
                >
                    {props.cancelLabel ?? "Cancel"}
                </Button>
                <Button
                    className={tone === "warning" ? WARNING_CONFIRM : undefined}
                    data-action="confirm"
                    onClick={() => props.onConfirm()}
                    size="sm"
                    variant={
                        tone === "danger"
                            ? "destructive"
                            : tone === "warning"
                              ? "secondary"
                              : "default"
                    }
                >
                    {props.confirmLabel}
                </Button>
            </div>
        </div>
    );
}
