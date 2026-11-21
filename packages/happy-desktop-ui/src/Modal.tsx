import { cva } from "class-variance-authority";
import type { CSSProperties, ReactNode } from "react";
import { partitionComponentProps } from "./componentProps";
import { Button } from "./components/ui/button";
import { DialogFooter } from "./components/ui/dialog";
import { Icon, type IconName } from "./Icon";
import { cn } from "./lib/utils";
import { ScrollArea } from "./Scrollbar";
export type ModalSize = "small" | "medium" | "large";
export type ModalTone = "default" | "danger";
export type ModalProps = {
    className?: string;
    closeLabel?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    onClose?: () => void;
    size?: ModalSize;
    tone?: ModalTone;
    icon?: IconName;
};

/*
 * shadcn's dialog content: the popover surface on a hairline ring at the xl
 * radius, in one of three fixed widths. It shrinks inside a capped host (see
 * ModalOverlay) so its body scrolls while the header and footer stay pinned.
 */
const modalDialogVariants = cva(
    "happy-modal__dialog flex min-h-0 flex-col overflow-hidden rounded-xl bg-popover text-sm text-popover-foreground ring-1 ring-foreground/10",
    {
        variants: {
            size: {
                small: "w-90",
                medium: "w-120",
                large: "w-160",
            },
        },
        defaultVariants: { size: "medium" },
    },
);

const modalIconVariants = cva(
    "happy-modal__icon flex size-7 flex-none items-center justify-center rounded-md",
    {
        variants: {
            tone: {
                /* Neutral: a dialog's glyph names its subject rather than
                   offering a link; colour is kept for the destructive tone. */
                default: "bg-muted text-foreground",
                danger: "bg-destructive/10 text-destructive dark:bg-destructive/20",
            },
        },
        defaultVariants: { tone: "default" },
    },
);

/**
 * C-028 Modal — dialog card with header / body / footer, in shadcn's dialog
 * look.
 *
 * The root `.happy-modal` is a transparent centering layer (no scrim, no fixed
 * positioning) so the dialog renders as a screenshot-safe specimen; a host
 * puts it on a `ModalOverlay`. The measured card is the inner
 * `data-happy-desktop-ui="modal-dialog"`: three fixed widths (360 / 480 / 640)
 * and one 16px inset on every side. The header is a 60px row — an optional
 * leading icon chip, the title, and a ghost close button, each 28px high — over
 * a scrollable body slot and an optional right-aligned footer action row on
 * shadcn's muted footer band.
 */
export function Modal(props: ModalProps) {
    const [local, rest] = partitionComponentProps(props, [
        "className",
        "closeLabel",
        "style",
        "title",
        "children",
        "footer",
        "onClose",
        "size",
        "tone",
        "icon",
    ]);
    const size = local.size ?? "medium";
    const tone = local.tone ?? "default";
    return (
        <div
            {...rest}
            className={cn(
                "happy-modal m-0 flex min-h-0 flex-col items-center justify-center font-sans text-popover-foreground",
                local.className,
            )}
            data-happy-desktop-ui="modal"
            style={local.style}
        >
            <div
                aria-label={local.title}
                aria-modal="true"
                className={modalDialogVariants({ size })}
                data-happy-desktop-ui="modal-dialog"
                data-size={size}
                data-tone={tone}
                role="dialog"
            >
                <header
                    className="happy-modal__header flex flex-none items-center gap-3 p-4"
                    data-happy-desktop-ui="modal-header"
                >
                    {local.icon ? (
                        <span
                            className={modalIconVariants({ tone })}
                            data-happy-desktop-ui="modal-icon"
                        >
                            <Icon name={local.icon} size={16} />
                        </span>
                    ) : null}
                    <h2
                        className="happy-modal__title m-0 min-w-0 flex-1 truncate font-heading text-base leading-7 font-medium"
                        data-happy-desktop-ui="modal-title"
                    >
                        {local.title}
                    </h2>
                    {local.onClose ? (
                        <Button
                            aria-label={local.closeLabel ?? "Close"}
                            className="happy-modal__close"
                            onClick={() => local.onClose?.()}
                            size="icon-sm"
                            variant="ghost"
                        >
                            <Icon name="close" size={16} />
                        </Button>
                    ) : null}
                </header>
                <ScrollArea
                    axes="both"
                    className="happy-modal__body min-h-0 flex-auto text-muted-foreground"
                    data-happy-desktop-ui="modal-body"
                    viewportClassName="happy-modal__body-viewport overflow-auto"
                >
                    {/* The scrollport stays edge to edge; this wrapper carries
                        the body's inset, in block flow so arbitrary content lays
                        out as it would anywhere else. */}
                    <div
                        className="happy-modal__body-content block px-4 pb-4"
                        data-happy-desktop-ui="modal-body-content"
                    >
                        {local.children}
                    </div>
                </ScrollArea>
                {local.footer ? (
                    <DialogFooter
                        className="happy-modal__footer m-0 flex-none items-center rounded-none"
                        data-happy-desktop-ui="modal-footer"
                    >
                        {local.footer}
                    </DialogFooter>
                ) : null}
            </div>
        </div>
    );
}
