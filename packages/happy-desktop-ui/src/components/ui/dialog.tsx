/*
 * shadcn/ui Dialog (radix-nova), MIT: https://ui.shadcn.com/docs/components/radix/dialog
 *
 * Adapted to Happy:
 * - `DialogPortal` is `WindowOverlay`: the dialog hangs off the shell's overlay
 *   lane inside ThemeScope's tree (or stays in place where there is no shell),
 *   never off `document.body`, and stacks at `--happy-z-overlay`.
 * - The scrim is the theme's soft overlay token, not a raw black.
 * - The close mark is the curated `close` glyph.
 * - Desktop only: the content is a flex column at its desktop width and the
 *   footer is a right-aligned row; shadcn's phone layouts are gone.
 * - Motion is a fade-in entrance and nothing more: no slide or zoom travel,
 *   and no exit. Keyframes restart rather than reverse, so a surface closed
 *   mid-entrance would snap to its full pose before playing an exit (DESIGN.md,
 *   "Nothing jumps"); with no exit it simply goes.
 */
import type { ComponentProps, ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Icon } from "../../Icon";
import { cn } from "../../lib/utils";
import { WindowOverlay } from "../../WindowOverlay";
import { Button } from "./button";

function Dialog({ ...props }: ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: ComponentProps<typeof DialogPrimitive.Trigger>) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ children }: { children?: ReactNode }) {
    return <WindowOverlay>{children}</WindowOverlay>;
}

function DialogClose({ ...props }: ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                "fixed inset-0 isolate z-(--happy-z-overlay) bg-overlay duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0",
                className,
            )}
            {...props}
        />
    );
}

function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
}) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    "fixed top-1/2 left-1/2 z-(--happy-z-overlay) flex w-full max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0",
                    className,
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close data-slot="dialog-close" asChild>
                        <Button variant="ghost" className="absolute top-2 right-2" size="icon-sm">
                            <Icon name="close" size={16} />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn("flex flex-col gap-2", className)}
            {...props}
        />
    );
}

function DialogFooter({
    className,
    showCloseButton = false,
    children,
    ...props
}: ComponentProps<"div"> & {
    showCloseButton?: boolean;
}) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                "-mx-4 -mb-4 flex flex-row justify-end gap-2 rounded-b-xl border-t bg-muted/50 p-4",
                className,
            )}
            {...props}
        >
            {children}
            {showCloseButton && (
                <DialogPrimitive.Close asChild>
                    <Button variant="outline">Close</Button>
                </DialogPrimitive.Close>
            )}
        </div>
    );
}

function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn("font-heading text-base leading-none font-medium", className)}
            {...props}
        />
    );
}

function DialogDescription({
    className,
    ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn(
                "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
                className,
            )}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
