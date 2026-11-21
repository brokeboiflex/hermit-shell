/*
 * shadcn/ui Tooltip (radix-nova), MIT: https://ui.shadcn.com/docs/components/radix/tooltip
 *
 * Adapted to Happy:
 * - Each `Tooltip` brings its own `TooltipProvider` (as shadcn's new-york
 *   style does), so a tooltip works in a Blueprint specimen or a test without
 *   an app-level provider. Its open delay is the provider's 0ms; pass
 *   `delayDuration` to `Tooltip` to change one tooltip's delay.
 * - The content mounts through `WindowOverlay` (see dialog.tsx) and stacks at
 *   `--happy-z-overlay`.
 * - Motion is a fade-in entrance after the open delay and nothing more: no slide or zoom travel,
 *   and no exit. Keyframes restart rather than reverse, so a surface closed
 *   mid-entrance would snap to its full pose before playing an exit (DESIGN.md,
 *   "Nothing jumps"); with no exit it simply goes.
 */
import type { ComponentProps } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";
import { WindowOverlay } from "../../WindowOverlay";

function TooltipProvider({
    delayDuration = 0,
    ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
    return (
        <TooltipPrimitive.Provider
            data-slot="tooltip-provider"
            delayDuration={delayDuration}
            {...props}
        />
    );
}

function Tooltip({ ...props }: ComponentProps<typeof TooltipPrimitive.Root>) {
    return (
        <TooltipProvider>
            <TooltipPrimitive.Root data-slot="tooltip" {...props} />
        </TooltipProvider>
    );
}

function TooltipTrigger({ ...props }: ComponentProps<typeof TooltipPrimitive.Trigger>) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
    className,
    sideOffset = 0,
    children,
    ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
    return (
        <WindowOverlay>
            <TooltipPrimitive.Content
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                className={cn(
                    "z-(--happy-z-overlay) inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0",
                    className,
                )}
                {...props}
            >
                {children}
                <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
            </TooltipPrimitive.Content>
        </WindowOverlay>
    );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
