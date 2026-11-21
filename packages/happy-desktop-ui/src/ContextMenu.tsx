import { useCallback, useRef } from "react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { menuHasIcons, menuLabelClassName, MenuRowContent, type MenuItem } from "./Menu";
import { WindowOverlay } from "./WindowOverlay";

export interface ContextMenuProps {
    /** Where the pointer was when the menu was asked for, in viewport pixels. */
    readonly x: number;
    readonly y: number;
    readonly items: readonly MenuItem[];
    /** A row was chosen. The owner closes the menu; the choice does not close it by itself. */
    readonly onSelect: (id: string) => void;
    /** The menu was dismissed without a choice: a click elsewhere, Escape, Tab, or a resize. */
    readonly onClose: () => void;
    readonly width?: number;
    readonly "data-testid"?: string;
}

/**
 * A menu opened at the pointer rather than off a control: shadcn's
 * DropdownMenu, held open by its owner and anchored to a zero-size point where
 * the pointer was. It is controlled: the owner decides that it is open and
 * where, and takes it down on a choice or a dismissal, so the same menu serves
 * a link in a message and a row in a list without either owning a copy of the
 * open/close logic. (Radix's own ContextMenu cannot be held open by its owner,
 * so the dropdown is the primitive here; it draws exactly the same menu.)
 *
 * Radix places the card beside the point, flips and shifts it to stay inside
 * the window, moves focus into it, and runs the keyboard: arrows (wrapping),
 * Home and End, typeahead, Enter and Space. Escape, Tab, a click or a
 * right-click anywhere else dismiss it. The click beside the menu lands on a
 * transparent backdrop that only closes it, so it does not also press whatever
 * was underneath. The menu is not modal: a modal Radix menu disables pointer
 * events on the whole document, which would outlive the menu's view when
 * `RetainedViews` hides that view with its menu still open. The backdrop hides
 * with the view instead.
 *
 * Everything hangs off the window's overlay lane, so a menu asked for from
 * inside a paragraph or a layered pane resolves its z-index against the window
 * and is not sealed under the chrome beside it.
 */
export function ContextMenu(props: ContextMenuProps) {
    const { x, y } = props;
    const backdrop = useRef<HTMLButtonElement>(null);
    // The anchor's commit is the lifetime boundary at which its box exists, and
    // it comes before Radix measures it to place the card. Radix's trigger
    // composes this ref afresh on each render, so it may run again on a box it
    // has already moved: it corrects from where the box is now, which leaves an
    // anchor already at the point where it is.
    const anchorRef = useCallback(
        (node: HTMLSpanElement | null): void => {
            // Not rendered (a hidden retained view): there is nothing to measure.
            if (!node || node.getClientRects().length === 0) return;
            const bounds = node.getBoundingClientRect();
            // A transformed or contained ancestor makes itself the containing
            // block of a fixed box, so `left: x` does not land at viewport x.
            // Where it did land says how far that block is offset.
            const left = Number.parseFloat(node.style.left) || 0;
            const top = Number.parseFloat(node.style.top) || 0;
            node.style.left = `${String(left - (bounds.left - x))}px`;
            node.style.top = `${String(top - (bounds.top - y))}px`;
        },
        [x, y],
    );
    const hasIcons = menuHasIcons(props.items);
    const select = (event: Event, id: string): void => {
        // The owner closes the menu, so a choice that fails (a refused
        // clipboard write) can leave it open to try again.
        event.preventDefault();
        props.onSelect(id);
    };
    return (
        <DropdownMenu
            modal={false}
            onOpenChange={(open) => {
                if (!open) props.onClose();
            }}
            open
        >
            <WindowOverlay>
                <button
                    aria-label="Close menu"
                    className="happy-context-menu__backdrop fixed inset-0 z-(--happy-z-overlay) cursor-default bg-transparent"
                    data-happy-desktop-ui="context-menu-backdrop"
                    onClick={(event) => {
                        event.stopPropagation();
                        props.onClose();
                    }}
                    onContextMenu={(event) => {
                        // A second right-click while the menu is up takes the
                        // menu down rather than asking the page for another.
                        event.preventDefault();
                        event.stopPropagation();
                        props.onClose();
                    }}
                    ref={backdrop}
                    tabIndex={-1}
                    type="button"
                />
                <DropdownMenuTrigger asChild>
                    <span
                        aria-hidden="true"
                        className="happy-context-menu__anchor pointer-events-none fixed size-0"
                        data-happy-desktop-ui="context-menu-anchor"
                        ref={anchorRef}
                        style={{ left: x, top: y }}
                    />
                </DropdownMenuTrigger>
            </WindowOverlay>
            <DropdownMenuContent
                align="start"
                // The card floats out of whatever opened it, possibly over a
                // title band, so it owns its hit surface (app-shell.css, rule 2).
                className="happy-context-menu happy-menu w-auto max-w-80 min-w-36 p-0 [-webkit-app-region:no-drag] [app-region:no-drag]"
                collisionPadding={8}
                data-happy-desktop-ui="context-menu"
                data-testid={props["data-testid"]}
                loop
                onClick={(event) => event.stopPropagation()}
                onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }}
                onInteractOutside={(event) => {
                    // The backdrop's own click closes the menu, after it has
                    // kept that click from the page.
                    if (event.target === backdrop.current) event.preventDefault();
                }}
                onKeyDown={(event) => {
                    // Radix has already taken the menu down on Escape; the key
                    // stops here so it does not also close a dialog beneath.
                    if (event.key === "Escape") event.stopPropagation();
                    else if (event.key === "Tab") props.onClose();
                }}
                side="right"
                sideOffset={2}
                style={props.width === undefined ? undefined : { width: props.width }}
            >
                {/* The content is the scrollport and stays edge to edge; the
                    rows carry the inset. */}
                <div
                    className="happy-context-menu__rows flex flex-col p-1"
                    data-happy-desktop-ui="context-menu-rows"
                >
                    {props.items.map((item, index) => {
                        if (item.kind === "separator") {
                            return (
                                <DropdownMenuSeparator
                                    className="happy-menu__separator"
                                    data-happy-desktop-ui="menu-separator"
                                    key={`separator-${index}`}
                                />
                            );
                        }
                        if (item.kind === "label") {
                            return (
                                <DropdownMenuLabel
                                    className={menuLabelClassName}
                                    data-happy-desktop-ui="menu-label"
                                    key={`label-${item.label}-${index}`}
                                >
                                    {item.label}
                                </DropdownMenuLabel>
                            );
                        }
                        if (item.checked !== undefined) {
                            return (
                                <DropdownMenuCheckboxItem
                                    checked={item.checked}
                                    className="happy-menu__item"
                                    data-item-id={item.id}
                                    data-happy-desktop-ui="menu-item"
                                    disabled={item.disabled}
                                    key={item.id}
                                    onSelect={(event) => select(event, item.id)}
                                >
                                    <MenuRowContent hasIcons={hasIcons} item={item} />
                                </DropdownMenuCheckboxItem>
                            );
                        }
                        return (
                            <DropdownMenuItem
                                className="happy-menu__item"
                                data-danger={item.danger ? "" : undefined}
                                data-item-id={item.id}
                                data-happy-desktop-ui="menu-item"
                                disabled={item.disabled}
                                key={item.id}
                                onSelect={(event) => select(event, item.id)}
                                variant={item.danger ? "destructive" : "default"}
                            >
                                <MenuRowContent hasIcons={hasIcons} item={item} />
                            </DropdownMenuItem>
                        );
                    })}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
