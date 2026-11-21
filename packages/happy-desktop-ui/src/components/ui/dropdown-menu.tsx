/*
 * shadcn/ui Dropdown Menu (radix-nova), MIT: https://ui.shadcn.com/docs/components/radix/dropdown-menu
 *
 * Adapted to Happy:
 * - Menus and submenus mount through `WindowOverlay` (see dialog.tsx), as
 *   every floating surface in the package does, and stack at
 *   `--happy-z-overlay`. `DropdownMenuSubContent` mounts itself, so wrapping
 *   it in `DropdownMenuPortal` is optional.
 * - The check and submenu marks are the curated `check` and `chevron-right`
 *   glyphs; item icons are styled through `[data-slot=icon]`, never sized here.
 * - A long menu scrolls with the browser's own scrollbar.
 * - Motion is a fade-in entrance and nothing more: no slide or zoom travel,
 *   and no exit. Keyframes restart rather than reverse, so a surface closed
 *   mid-entrance would snap to its full pose before playing an exit (DESIGN.md,
 *   "Nothing jumps"); with no exit it simply goes.
 */
import type { ComponentProps, ReactNode } from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Icon } from "../../Icon";
import { cn } from "../../lib/utils";
import { WindowOverlay } from "../../WindowOverlay";

function DropdownMenu({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
    return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({ children }: { children?: ReactNode }) {
    return <WindowOverlay>{children}</WindowOverlay>;
}

function DropdownMenuTrigger({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
    return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
    className,
    align = "start",
    sideOffset = 4,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (
        <WindowOverlay>
            <DropdownMenuPrimitive.Content
                data-slot="dropdown-menu-content"
                sideOffset={sideOffset}
                align={align}
                className={cn(
                    "z-(--happy-z-overlay) max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[state=closed]:overflow-hidden data-open:animate-in data-open:fade-in-0",
                    className,
                )}
                {...props}
            />
        </WindowOverlay>
    );
}

function DropdownMenuGroup({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Group>) {
    return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({
    className,
    inset,
    variant = "default",
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
}) {
    return (
        <DropdownMenuPrimitive.Item
            data-slot="dropdown-menu-item"
            data-inset={inset || undefined}
            data-variant={variant}
            className={cn(
                "group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_[data-slot=icon]]:pointer-events-none [&_[data-slot=icon]]:shrink-0 data-[variant=destructive]:*:data-[slot=icon]:text-destructive",
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    inset,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
    inset?: boolean;
}) {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            data-slot="dropdown-menu-checkbox-item"
            data-inset={inset || undefined}
            className={cn(
                "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_[data-slot=icon]]:pointer-events-none [&_[data-slot=icon]]:shrink-0",
                className,
            )}
            checked={checked}
            {...props}
        >
            <span
                className="pointer-events-none absolute right-2 flex items-center justify-center"
                data-slot="dropdown-menu-checkbox-item-indicator"
            >
                <DropdownMenuPrimitive.ItemIndicator>
                    <Icon name="check" size={16} />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
}

function DropdownMenuRadioGroup({
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
    return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
    className,
    children,
    inset,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & {
    inset?: boolean;
}) {
    return (
        <DropdownMenuPrimitive.RadioItem
            data-slot="dropdown-menu-radio-item"
            data-inset={inset || undefined}
            className={cn(
                "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_[data-slot=icon]]:pointer-events-none [&_[data-slot=icon]]:shrink-0",
                className,
            )}
            {...props}
        >
            <span
                className="pointer-events-none absolute right-2 flex items-center justify-center"
                data-slot="dropdown-menu-radio-item-indicator"
            >
                <DropdownMenuPrimitive.ItemIndicator>
                    <Icon name="check" size={16} />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    );
}

function DropdownMenuLabel({
    className,
    inset,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
}) {
    return (
        <DropdownMenuPrimitive.Label
            data-slot="dropdown-menu-label"
            data-inset={inset || undefined}
            className={cn(
                "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7",
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuSeparator({
    className,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return (
        <DropdownMenuPrimitive.Separator
            data-slot="dropdown-menu-separator"
            className={cn("-mx-1 my-1 h-px bg-border", className)}
            {...props}
        />
    );
}

function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">) {
    return (
        <span
            data-slot="dropdown-menu-shortcut"
            className={cn(
                "ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuSub({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
    return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
}) {
    return (
        <DropdownMenuPrimitive.SubTrigger
            data-slot="dropdown-menu-sub-trigger"
            data-inset={inset || undefined}
            className={cn(
                "flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-open:bg-accent data-open:text-accent-foreground [&_[data-slot=icon]]:pointer-events-none [&_[data-slot=icon]]:shrink-0",
                className,
            )}
            {...props}
        >
            {children}
            <Icon className="ml-auto" name="chevron-right" size={16} />
        </DropdownMenuPrimitive.SubTrigger>
    );
}

function DropdownMenuSubContent({
    className,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
    return (
        <WindowOverlay>
            <DropdownMenuPrimitive.SubContent
                data-slot="dropdown-menu-sub-content"
                className={cn(
                    "z-(--happy-z-overlay) min-w-[96px] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0",
                    className,
                )}
                {...props}
            />
        </WindowOverlay>
    );
}

export {
    DropdownMenu,
    DropdownMenuPortal,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
};
