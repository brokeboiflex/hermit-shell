/*
 * shadcn/ui Select (radix-nova), MIT: https://ui.shadcn.com/docs/components/radix/select
 *
 * Adapted to Happy:
 * - Glyphs are the curated `chevron-down` and `check` icons; icons inside items
 *   and the trigger are styled through `[data-slot=icon]`, never sized here.
 * - The list mounts through `WindowOverlay` rather than a body portal, so it
 *   stays inside ThemeScope's tree and the shell's overlay lane, as every
 *   Happy overlay does.
 * - The scrollbar is the browser's own, painted by styles/scrollbar.css. Radix
 *   injects `[data-radix-select-viewport] { scrollbar-width: none }` and hides
 *   its `::-webkit-scrollbar`; the viewport undoes both with important
 *   utilities (an important declaration in any layer beats Radix's unlayered
 *   rule): `auto` where the pseudo-elements paint the bar, and the shared
 *   sheet's `thin` in engines without them. Radix's hover-to-scroll arrow
 *   buttons are left out: the native bar and the wheel scroll the list.
 * - Where there is no shell, `WindowOverlay` leaves the list in place, and a
 *   vertical `Field` stretches its direct children (`*:w-full`), Radix's fixed
 *   positioning wrapper included. A `display: contents` box keeps the wrapper
 *   out of reach of that rule and draws nothing itself.
 * - Motion is a fade-in entrance and nothing more: no slide or zoom travel,
 *   and no exit. Keyframes restart rather than reverse, so a surface closed
 *   mid-entrance would snap to its full pose before playing an exit (DESIGN.md,
 *   "Nothing jumps"); with no exit it simply goes.
 */
import type { ComponentProps } from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Icon } from "../../Icon";
import { cn } from "../../lib/utils";
import { WindowOverlay } from "../../WindowOverlay";

function Select({ ...props }: ComponentProps<typeof SelectPrimitive.Root>) {
    return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ className, ...props }: ComponentProps<typeof SelectPrimitive.Group>) {
    return (
        <SelectPrimitive.Group
            data-slot="select-group"
            className={cn("scroll-my-1 p-1", className)}
            {...props}
        />
    );
}

function SelectValue({ ...props }: ComponentProps<typeof SelectPrimitive.Value>) {
    return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
    className,
    size = "default",
    children,
    ...props
}: ComponentProps<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "default";
}) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            data-size={size}
            className={cn(
                "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_[data-slot=icon]]:pointer-events-none [&_[data-slot=icon]]:shrink-0",
                className,
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <Icon
                    className="pointer-events-none text-muted-foreground"
                    name="chevron-down"
                    size={16}
                />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

function SelectContent({
    className,
    children,
    position = "item-aligned",
    align = "center",
    ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
    return (
        <WindowOverlay>
            <div className="contents">
                <SelectPrimitive.Content
                    data-slot="select-content"
                    data-align-trigger={position === "item-aligned"}
                    className={cn(
                        "relative z-(--happy-z-overlay) max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-open:animate-in data-open:fade-in-0",
                        position === "popper" &&
                            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
                        className,
                    )}
                    position={position}
                    align={align}
                    {...props}
                >
                    <SelectPrimitive.Viewport
                        data-position={position}
                        className="[scrollbar-width:auto]! data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width) [@supports_not_selector(::-webkit-scrollbar)]:[scrollbar-width:thin]! [&::-webkit-scrollbar]:block!"
                    >
                        {children}
                    </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
            </div>
        </WindowOverlay>
    );
}

function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
    return (
        <SelectPrimitive.Label
            data-slot="select-label"
            className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
            {...props}
        />
    );
}

function SelectItem({
    className,
    children,
    ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item
            data-slot="select-item"
            className={cn(
                "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_[data-slot=icon]]:pointer-events-none [&_[data-slot=icon]]:shrink-0 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
                className,
            )}
            {...props}
        >
            <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                <SelectPrimitive.ItemIndicator>
                    <Icon className="pointer-events-none" name="check" size={16} />
                </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

function SelectSeparator({
    className,
    ...props
}: ComponentProps<typeof SelectPrimitive.Separator>) {
    return (
        <SelectPrimitive.Separator
            data-slot="select-separator"
            className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
            {...props}
        />
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};
