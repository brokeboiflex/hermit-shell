/*
 * shadcn/ui Popover (radix-nova), MIT: https://ui.shadcn.com/docs/components/radix/popover
 *
 * Adapted to Happy:
 * - The content mounts through `WindowOverlay` (see dialog.tsx) and stacks at
 *   `--happy-z-overlay`.
 * - Motion is a fade-in entrance and nothing more: no slide or zoom travel,
 *   and no exit. Keyframes restart rather than reverse, so a surface closed
 *   mid-entrance would snap to its full pose before playing an exit (DESIGN.md,
 *   "Nothing jumps"); with no exit it simply goes.
 */
import type { ComponentProps } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";
import { WindowOverlay } from "../../WindowOverlay";

function Popover({ ...props }: ComponentProps<typeof PopoverPrimitive.Root>) {
    return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: ComponentProps<typeof PopoverPrimitive.Trigger>) {
    return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
    className,
    align = "center",
    sideOffset = 4,
    ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
    return (
        <WindowOverlay>
            <PopoverPrimitive.Content
                data-slot="popover-content"
                align={align}
                sideOffset={sideOffset}
                className={cn(
                    "z-(--happy-z-overlay) flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-open:animate-in data-open:fade-in-0",
                    className,
                )}
                {...props}
            />
        </WindowOverlay>
    );
}

function PopoverAnchor({ ...props }: ComponentProps<typeof PopoverPrimitive.Anchor>) {
    return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverHeader({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-slot="popover-header"
            className={cn("flex flex-col gap-0.5 text-sm", className)}
            {...props}
        />
    );
}

function PopoverTitle({ className, ...props }: ComponentProps<"div">) {
    return <div data-slot="popover-title" className={cn("font-medium", className)} {...props} />;
}

function PopoverDescription({ className, ...props }: ComponentProps<"p">) {
    return (
        <p
            data-slot="popover-description"
            className={cn("text-muted-foreground", className)}
            {...props}
        />
    );
}

export {
    Popover,
    PopoverAnchor,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
};
