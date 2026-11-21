import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "./components/ui/button";
import { Icon } from "./Icon";
import { cn } from "./lib/utils";

export interface CopyButtonProps {
    readonly className?: string;
    readonly "data-happy-desktop-ui"?: string;
    readonly "data-testid"?: string;
    /** What the button offers to copy, for example "Copy command". */
    readonly label: string;
    /**
     * Written beside the glyph, for a copy action that is the whole control
     * rather than a quiet affordance on a row that already says what it holds.
     */
    readonly caption?: string;
    /** Said instead of the caption for the moment after a copy lands. */
    readonly copiedCaption?: string;
    readonly style?: CSSProperties;
    /**
     * Exact text handed to the clipboard, read lazily when deriving it is
     * expensive, or awaited when it has to be produced first, such as the path
     * of a file written on the click.
     */
    readonly text: string | (() => string | Promise<string>);
    /** Told once the clipboard has taken the text; never told what the text was. */
    readonly onCopy?: () => void;
    /** Draws the glyph instead of the house copy and check icons, for a surface with its own set. */
    readonly glyph?: (copied: boolean) => ReactNode;
}

/** How long the copied check stays before the button offers the copy again. */
const COPIED_MS = 1_600;

/**
 * CopyButton — the quiet clipboard action for a line whose full text is longer
 * than the row showing it: a shadcn/ui ghost Button, a 20px glyph square, or a
 * small (28px) glyph-and-caption button when it names itself. It confirms
 * itself with a check for a moment, so a reader knows the copy landed without
 * a toast interrupting the surface.
 *
 * The surrounding row decides when the bare glyph is visible; the button only
 * owns its own copied state. Its resting transparency is the one rule left in
 * styles/copy-button.css, below Tailwind's utilities, because each row that
 * reveals it does so with its own stylesheet rule there.
 */
export function CopyButton(props: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const copy = async () => {
        try {
            const text = typeof props.text === "function" ? await props.text() : props.text;
            await navigator.clipboard.writeText(text);
            setCopied(true);
            props.onCopy?.();
            if (copiedTimer.current !== undefined) clearTimeout(copiedTimer.current);
            copiedTimer.current = setTimeout(() => {
                copiedTimer.current = undefined;
                setCopied(false);
            }, COPIED_MS);
        } catch {
            // The browser owns clipboard permission; keep the action retryable.
        }
    };
    return (
        <Button
            aria-label={copied ? "Copied" : props.label}
            className={cn(
                "happy-copy-button text-muted-foreground focus-visible:opacity-100 data-copied:text-success data-copied:opacity-100 data-copied:hover:text-success",
                props.caption === undefined ? "size-5" : undefined,
                props.className,
            )}
            data-captioned={props.caption === undefined ? undefined : ""}
            data-copied={copied ? "" : undefined}
            data-happy-desktop-ui={props["data-happy-desktop-ui"] ?? "copy-button"}
            data-testid={props["data-testid"]}
            onClick={(event) => {
                // The line often sits inside a row that opens a detail surface.
                event.stopPropagation();
                void copy();
            }}
            style={props.style}
            size={props.caption === undefined ? "icon-xs" : "sm"}
            title={copied ? "Copied" : props.label}
            type="button"
            variant="ghost"
        >
            {props.glyph ? (
                props.glyph(copied)
            ) : (
                <Icon
                    data-icon={props.caption === undefined ? undefined : "inline-start"}
                    name={copied ? "check" : "copy"}
                    size={14}
                />
            )}
            {props.caption === undefined ? null : (
                <span aria-atomic="true" aria-live="polite" className="happy-copy-button__caption">
                    {copied ? (props.copiedCaption ?? props.caption) : props.caption}
                </span>
            )}
        </Button>
    );
}
