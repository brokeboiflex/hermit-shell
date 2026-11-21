/*
 * shadcn/ui Kbd (radix-nova), MIT: https://ui.shadcn.com/docs/components/radix/kbd
 *
 * Adapted to Happy: a glyph in a key cap is an `Icon` at `size={12}`
 * (shadcn's `size-3`).
 */
import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

function Kbd({ className, ...props }: ComponentProps<"kbd">) {
    return (
        <kbd
            data-slot="kbd"
            className={cn(
                "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10",
                className,
            )}
            {...props}
        />
    );
}

function KbdGroup({ className, ...props }: ComponentProps<"div">) {
    return (
        <kbd
            data-slot="kbd-group"
            className={cn("inline-flex items-center gap-1", className)}
            {...props}
        />
    );
}

export { Kbd, KbdGroup };
