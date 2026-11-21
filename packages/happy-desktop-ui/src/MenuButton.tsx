import { useId, useRef, useState, type KeyboardEvent } from "react";
import { KeyCap } from "./Badge";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Icon, type IconName, type IconProps } from "./Icon";
import { CLOSE_SHORTCUT, commandShortcutMatches } from "./keyboardShortcut";
import { cn } from "./lib/utils";
import type { MenuItem } from "./Menu";

export interface MenuButtonProps {
    readonly label: string;
    readonly icon: IconName;
    /** Shown beside the glyph, for a trigger that names itself on the surface. */
    readonly text?: string;
    /**
     * Optical size of the trigger glyph, for a name backed by the heavier of the
     * two families. An Octicons glyph is drawn across the full 16 box where an
     * Ionicons outline uses a 14 × 12 ink box, so at the button's own 14px it
     * paints visibly larger than the Ionicons buttons beside it; 12px is where
     * the two inks match. Defaults to the button's size for its own family.
     */
    readonly iconSize?: IconProps["size"];
    /** Static rows, or a catalog materialized only when the menu opens. */
    readonly items: readonly MenuItem[] | (() => readonly MenuItem[]);
    readonly onSelect: (id: string) => void;
    /** The popover opened or closed, for a caller that holds still while it is open. */
    readonly onOpenChange?: (open: boolean) => void;
    readonly align?: "start" | "end";
    /** Which edge of the trigger the popover opens from. */
    readonly placement?: "above" | "below";
    /**
     * @deprecated The menu always hangs off the window's overlay lane now, placed
     * beside the trigger and pushed back inside the window near an edge, so a
     * pane that would clip it no longer can. Stop passing it.
     */
    readonly overlay?: boolean;
    readonly disabled?: boolean;
    /** Caps a long menu to a scrollable viewport while keeping its trigger fixed. */
    readonly menuMaxHeight?: number;
    /** Fixed heading above the menu's scrollable rows. */
    readonly menuLabel?: string;
    /** Keeps large catalogs in bounded DOM pages while leaving every row reachable. */
    readonly menuPageSize?: number;
    readonly menuWidth?: number;
    readonly size?: ButtonSize;
    readonly variant?: ButtonVariant;
    readonly className?: string;
    readonly "data-testid"?: string;
}

/** How close to the window's edge the menu may sit before it is pushed back in. */
const VIEWPORT_MARGIN = 8;

/**
 * C-027a MenuButton — a compact icon action opening shadcn/ui's DropdownMenu
 * of `MenuItem` rows. Radix owns the open menu's placement, focus, roving
 * arrow keys, typeahead, and dismissal; the menu returns focus to the trigger
 * when it closes. It owns only whether it is open and which page of a large
 * catalog it shows; the caller owns every item and what choosing one means.
 */
export function MenuButton(props: MenuButtonProps) {
    const [open, setOpen] = useState(false);
    const [materializedItems, setMaterializedItems] = useState<readonly MenuItem[]>([]);
    const [menuPage, setMenuPage] = useState(0);
    // The open menu's node, in the overlay lane where a query from the root
    // would not find it.
    const content = useRef<HTMLDivElement>(null);
    const menuId = useId();
    const expanded = open && !props.disabled;
    const above = props.placement === "above";
    const alignEnd = props.align === "end";
    const openChange = (next: boolean): void => {
        if (next) {
            setMaterializedItems(typeof props.items === "function" ? props.items() : props.items);
            setMenuPage(0);
        }
        setOpen(next);
        props.onOpenChange?.(next);
    };
    const firstItemFocus = (): void => {
        content.current
            ?.querySelector<HTMLElement>('[role^="menuitem"]:not([data-disabled])')
            ?.focus();
    };
    const allItems = typeof props.items === "function" ? materializedItems : props.items;
    const pageSize =
        props.menuPageSize !== undefined && props.menuPageSize > 0
            ? Math.floor(props.menuPageSize)
            : undefined;
    const pageCount =
        pageSize === undefined ? 1 : Math.max(1, Math.ceil(allItems.length / pageSize));
    const currentPage = Math.min(menuPage, pageCount - 1);
    const pageName = props.menuLabel?.toLowerCase() ?? "items";
    const pageItems =
        pageSize === undefined
            ? allItems
            : allItems.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const hasIcons = pageItems.some(
        (item) => item.kind === "item" && (item.icon !== undefined || item.iconUrl !== undefined),
    );
    // shadcn's `data-inset:` matches the attribute whatever its value, so a row
    // that is not inset must not carry it at all: `true` or absent, never `false`.
    const inset = (indented: boolean): true | undefined => (indented ? true : undefined);
    // A page turn keeps the menu open on the new page's first row.
    const pageTurn = (event: Event, page: number): void => {
        event.preventDefault();
        setMenuPage(page);
        requestAnimationFrame(firstItemFocus);
    };
    const pageItem = (id: string, label: string, page: number) => (
        <DropdownMenuItem
            data-happy-desktop-ui="menu-item"
            data-item-id={id}
            inset={inset(hasIcons)}
            onSelect={(event) => pageTurn(event, page)}
        >
            <span className="min-w-0 flex-1 truncate" data-happy-desktop-ui="menu-item-label">
                {label}
            </span>
        </DropdownMenuItem>
    );
    const menuMaxHeight =
        props.menuMaxHeight === undefined
            ? undefined
            : `min(${String(props.menuMaxHeight)}px, var(--radix-dropdown-menu-content-available-height))`;
    return (
        <div
            className={cn("happy-menu-button relative flex flex-none", props.className)}
            data-align={alignEnd ? "end" : undefined}
            data-happy-desktop-ui="menu-button"
            data-open={expanded ? "" : undefined}
            data-testid={props["data-testid"]}
        >
            <DropdownMenu onOpenChange={openChange} open={expanded}>
                <DropdownMenuTrigger asChild disabled={props.disabled}>
                    <Button
                        aria-label={props.label}
                        disabled={props.disabled}
                        {...(props.iconSize === undefined ? { icon: props.icon } : {})}
                        {...(props.text === undefined ? { iconOnly: true } : {})}
                        size={props.size ?? "small"}
                        variant={props.variant ?? "ghost"}
                    >
                        {props.iconSize === undefined ? null : (
                            <Icon name={props.icon} size={props.iconSize} />
                        )}
                        {props.text}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align={alignEnd ? "end" : "start"}
                    className={cn(
                        // The heading holds still above rows that scroll in
                        // their own edge-to-edge scrollport.
                        "happy-menu-button__popover flex flex-col overflow-hidden p-0",
                        props.menuWidth === undefined ? "w-auto" : undefined,
                    )}
                    collisionPadding={VIEWPORT_MARGIN}
                    data-happy-desktop-ui="menu-button-popover"
                    // The close chord closes what is in front, and an open menu
                    // is in front of everything behind it: it answers here, as
                    // Escape does, and the press goes no further.
                    onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                        if (commandShortcutMatches(event.nativeEvent, CLOSE_SHORTCUT)) {
                            event.preventDefault();
                            event.stopPropagation();
                            openChange(false);
                            return;
                        }
                        if (event.key === "Escape") event.stopPropagation();
                    }}
                    ref={content}
                    side={above ? "top" : "bottom"}
                    style={{
                        ...(props.menuWidth === undefined
                            ? null
                            : { width: `${String(props.menuWidth)}px` }),
                        ...(menuMaxHeight === undefined ? null : { maxHeight: menuMaxHeight }),
                    }}
                >
                    {props.menuLabel ? (
                        <div className="flex shrink-0 flex-col px-1 pt-1">
                            <DropdownMenuLabel data-happy-desktop-ui="menu-header">
                                {props.menuLabel}
                            </DropdownMenuLabel>
                        </div>
                    ) : null}
                    <div
                        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                        data-happy-desktop-ui="menu-list"
                    >
                        <div className="flex flex-col p-1" data-happy-desktop-ui="menu-rows">
                            {currentPage > 0
                                ? pageItem(
                                      `${menuId}-previous-page`,
                                      `Previous ${pageName} (${String(currentPage)} of ${String(pageCount)})`,
                                      currentPage - 1,
                                  )
                                : null}
                            {pageItems.map((item, index) => {
                                if (item.kind === "separator") {
                                    return (
                                        <DropdownMenuSeparator
                                            data-happy-desktop-ui="menu-separator"
                                            key={`separator-${index}`}
                                        />
                                    );
                                }
                                if (item.kind === "label") {
                                    return (
                                        <DropdownMenuLabel
                                            data-happy-desktop-ui="menu-label"
                                            inset={inset(hasIcons)}
                                            key={`label-${item.label}-${index}`}
                                        >
                                            {item.label}
                                        </DropdownMenuLabel>
                                    );
                                }
                                const leading = item.iconUrl ? (
                                    <img
                                        alt=""
                                        className="size-4 shrink-0 rounded-sm object-contain"
                                        data-happy-desktop-ui="menu-item-image"
                                        src={item.iconUrl}
                                    />
                                ) : item.icon ? (
                                    <Icon name={item.icon} size={16} />
                                ) : null;
                                const row = (
                                    <>
                                        {leading}
                                        <span
                                            className="min-w-0 flex-1 truncate"
                                            data-happy-desktop-ui="menu-item-label"
                                        >
                                            {item.label}
                                        </span>
                                        {item.detail ? (
                                            <span
                                                className="shrink-0 text-xs text-muted-foreground"
                                                data-happy-desktop-ui="menu-item-detail"
                                            >
                                                {item.detail}
                                            </span>
                                        ) : null}
                                        {item.shortcut ? (
                                            <KeyCap className="shrink-0" keys={item.shortcut} />
                                        ) : null}
                                    </>
                                );
                                const select = (): void => props.onSelect(item.id);
                                return item.checked === undefined ? (
                                    <DropdownMenuItem
                                        data-happy-desktop-ui="menu-item"
                                        data-item-id={item.id}
                                        disabled={item.disabled}
                                        inset={inset(hasIcons && leading === null)}
                                        key={item.id}
                                        onSelect={select}
                                        variant={item.danger ? "destructive" : "default"}
                                    >
                                        {row}
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuCheckboxItem
                                        checked={item.checked}
                                        className={
                                            item.danger
                                                ? "text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                : undefined
                                        }
                                        data-happy-desktop-ui="menu-item"
                                        data-item-id={item.id}
                                        disabled={item.disabled}
                                        inset={inset(hasIcons && leading === null)}
                                        key={item.id}
                                        onSelect={select}
                                    >
                                        {row}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                            {currentPage + 1 < pageCount
                                ? pageItem(
                                      `${menuId}-next-page`,
                                      `More ${pageName} (${String(currentPage + 2)} of ${String(pageCount)})`,
                                      currentPage + 1,
                                  )
                                : null}
                        </div>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
