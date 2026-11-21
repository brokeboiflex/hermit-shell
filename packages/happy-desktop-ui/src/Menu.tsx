import { type CSSProperties } from "react";
import { cva } from "class-variance-authority";
import { KeyCap } from "./Badge";
import { Icon, type IconName } from "./Icon";
import { cn } from "./lib/utils";
export type MenuItem =
    | {
          kind: "item";
          id: string;
          label: string;
          icon?: IconName;
          /**
           * An image to show instead of a house glyph, for a row that stands for
           * something outside our vocabulary — an installed application, for
           * instance, which brings its own artwork.
           */
          iconUrl?: string;
          danger?: boolean;
          disabled?: boolean;
          checked?: boolean;
          shortcut?: string;
          /**
           * A quiet word after the label that says something about the row
           * without being part of its name, such as when it was last used. It
           * keeps its whole width; a long label gives way to it.
           */
          detail?: string;
      }
    | {
          kind: "separator";
      }
    | {
          kind: "label";
          label: string;
      };
export type MenuProps = {
    className?: string;
    id?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    /** A fixed heading above the scrollable menu rows. */
    label?: string;
    items: readonly MenuItem[];
    onSelect?: (id: string) => void;
    width?: number;
};

/** One choosable row of a menu. */
type MenuRow = Extract<MenuItem, { kind: "item" }>;

/**
 * Whether a menu reserves the leading icon column: when any row brings a glyph
 * or an image, every row keeps the column so all the labels start together.
 */
export function menuHasIcons(items: readonly MenuItem[]): boolean {
    return items.some(
        (item) => item.kind === "item" && (item.icon !== undefined || item.iconUrl !== undefined),
    );
}

/*
 * The row of shadcn's DropdownMenuItem, drawn on a button: the static Menu has
 * no Radix menu around it, so the highlight follows the pointer (`hover:`) and
 * the keyboard (`focus-visible:`) where Radix would move focus with the pointer.
 */
const menuRowVariants = cva(
    "happy-menu__item relative flex w-full flex-none cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm outline-hidden select-none disabled:pointer-events-none disabled:opacity-50 [&_[data-slot=icon]]:pointer-events-none [&_[data-slot=icon]]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "hover:bg-accent hover:text-accent-foreground hover:**:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:**:text-accent-foreground",
                destructive:
                    "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10 dark:hover:bg-destructive/20 dark:focus-visible:bg-destructive/20",
            },
            checkable: {
                true: "pr-8",
                false: "",
            },
        },
        defaultVariants: { variant: "default", checkable: false },
    },
);

/** The class names a menu section label wears, in Menu and in ContextMenu alike. */
export const menuLabelClassName =
    "happy-menu__label flex-none px-1.5 py-1 text-xs font-medium text-muted-foreground wrap-anywhere";

/**
 * What a row shows, in Menu and in ContextMenu alike: the icon column when the
 * menu keeps one, the label, a quiet detail, and the shortcut. The label gives
 * way with an ellipsis; the detail and the shortcut stay whole.
 */
export function MenuRowContent(props: { item: MenuRow; hasIcons: boolean }) {
    const { item } = props;
    return (
        <>
            {props.hasIcons ? (
                <span
                    className="happy-menu__item-icon flex size-4 flex-none items-center justify-center"
                    data-happy-desktop-ui="menu-item-icon"
                >
                    {item.iconUrl ? (
                        <img
                            alt=""
                            className="happy-menu__item-image block size-4 rounded-xs object-contain"
                            data-happy-desktop-ui="menu-item-image"
                            src={item.iconUrl}
                        />
                    ) : item.icon ? (
                        <Icon name={item.icon} size={16} />
                    ) : null}
                </span>
            ) : null}
            <span
                className="happy-menu__item-label min-w-0 flex-1 truncate"
                data-happy-desktop-ui="menu-item-label"
            >
                {item.label}
            </span>
            {item.detail ? (
                <span
                    className="happy-menu__item-detail flex-none text-xs whitespace-nowrap text-muted-foreground tabular-nums"
                    data-happy-desktop-ui="menu-item-detail"
                >
                    {item.detail}
                </span>
            ) : null}
            {item.shortcut ? (
                <KeyCap
                    className="happy-menu__item-shortcut ml-auto flex-none"
                    keys={item.shortcut}
                />
            ) : null}
        </>
    );
}

/**
 * C-027 Menu — the list of a dropdown or context menu, drawn as shadcn's
 * DropdownMenu content: a popover card, rows that highlight in the accent
 * colour, muted section labels, hairline separators, destructive rows in the
 * destructive colour, and a check at the trailing edge of a checkable row.
 *
 * It is a static card with no open state of its own: the control that owns it
 * places it, opens and closes it, and moves focus through its rows (every row
 * is a `[role^="menuitem"]` button, disabled rows are `:disabled`). A menu
 * opened at the pointer is `ContextMenu`, which is a real Radix menu. When any
 * row carries an icon the whole menu keeps a 16px leading column so every
 * label aligns. Shortcuts are the one KeyCap the app draws everywhere.
 */
export function Menu(props: MenuProps) {
    const { className, items, label, onSelect, style, width, ...rest } = props;
    const hasIcons = menuHasIcons(items);
    return (
        <div
            {...rest}
            className={cn(
                "happy-menu flex w-55 flex-col overflow-hidden rounded-lg bg-popover font-sans text-popover-foreground shadow-md ring-1 ring-foreground/10 select-none",
                className,
            )}
            data-has-icons={hasIcons ? "" : undefined}
            data-happy-desktop-ui="menu"
            role="menu"
            style={{
                ...style,
                ...(width === undefined ? {} : { width: `${width}px` }),
            }}
        >
            {label ? (
                <div
                    className={cn(menuLabelClassName, "happy-menu__header mx-1 mt-1")}
                    data-happy-desktop-ui="menu-header"
                >
                    {label}
                </div>
            ) : null}
            {/* The list is the scrollport and stays edge to edge; the rows
                inside it carry the inset, so the inset scrolls with them. */}
            <div
                className="happy-menu__list flex min-h-0 flex-auto flex-col overflow-y-auto overscroll-contain"
                data-happy-desktop-ui="menu-list"
            >
                <div
                    className="happy-menu__rows flex flex-none flex-col p-1"
                    data-happy-desktop-ui="menu-rows"
                >
                    {items.map((item, index) => {
                        if (item.kind === "separator") {
                            return (
                                <div
                                    aria-hidden="true"
                                    className="happy-menu__separator -mx-1 my-1 h-px flex-none bg-border"
                                    data-happy-desktop-ui="menu-separator"
                                    key={`separator-${index}`}
                                    role="separator"
                                />
                            );
                        }
                        if (item.kind === "label") {
                            return (
                                <div
                                    className={menuLabelClassName}
                                    data-happy-desktop-ui="menu-label"
                                    key={`label-${item.label}-${index}`}
                                >
                                    {item.label}
                                </div>
                            );
                        }
                        const checkable = item.checked !== undefined;
                        return (
                            <button
                                aria-disabled={item.disabled ? "true" : undefined}
                                aria-checked={item.checked}
                                className={menuRowVariants({
                                    variant: item.danger ? "destructive" : "default",
                                    checkable,
                                })}
                                data-danger={item.danger ? "" : undefined}
                                data-item-id={item.id}
                                data-happy-desktop-ui="menu-item"
                                data-variant={item.danger ? "destructive" : "default"}
                                disabled={item.disabled}
                                key={item.id}
                                onClick={() => {
                                    if (!item.disabled) onSelect?.(item.id);
                                }}
                                role={checkable ? "menuitemcheckbox" : "menuitem"}
                                type="button"
                            >
                                <MenuRowContent hasIcons={hasIcons} item={item} />
                                {checkable ? (
                                    <span
                                        className="happy-menu__item-check pointer-events-none absolute right-2 flex items-center justify-center"
                                        data-happy-desktop-ui="menu-item-check"
                                    >
                                        {item.checked ? <Icon name="check" size={16} /> : null}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
