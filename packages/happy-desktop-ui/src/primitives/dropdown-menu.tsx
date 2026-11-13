/*
 * shadcn/ui Dropdown Menu, MIT: https://ui.shadcn.com/docs/components/radix/dropdown-menu
 * Uses the upstream Radix primitives and component API. Presentation resolves
 * through Happy's theme, and portals use its existing retained-window overlay.
 */
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { WindowOverlay } from "../WindowOverlay";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export function DropdownMenuContent({
    className,
    children,
    sideOffset = 6,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (
        <WindowOverlay>
            <DropdownMenuPrimitive.Content
                className={["happy-file-menu", className].filter(Boolean).join(" ")}
                collisionPadding={8}
                data-slot="dropdown-menu-content"
                sideOffset={sideOffset}
                {...props}
            >
                <div className="happy-file-menu__content">{children}</div>
            </DropdownMenuPrimitive.Content>
        </WindowOverlay>
    );
}

export function DropdownMenuItem({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
    return (
        <DropdownMenuPrimitive.Item
            className={["happy-file-menu__item", className].filter(Boolean).join(" ")}
            data-slot="dropdown-menu-item"
            {...props}
        />
    );
}

export function DropdownMenuLabel(props: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
    return <DropdownMenuPrimitive.Label className="happy-file-menu__label" {...props} />;
}

export function DropdownMenuSeparator(
    props: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>,
) {
    return <DropdownMenuPrimitive.Separator className="happy-file-menu__separator" {...props} />;
}
