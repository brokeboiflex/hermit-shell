import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { browserAddressUrl } from "./BrowserPanel";
import { FileKindIcon } from "./FileKindIcon";
import { Icon, type IconName } from "./Icon";
import type { MenuItem } from "./Menu";
import { MenuButton } from "./MenuButton";
import { TextField } from "./TextField";

/** One thing a new tab can open. */
export interface PanelNewTabItem {
    readonly id: string;
    readonly icon: IconName;
    readonly label: string;
    /** Why it cannot be opened here, as its tooltip. Absent when it can. */
    readonly unavailable?: string;
}

/** A page the pane's browser visited, offered again when typed for. */
export interface PanelNewTabPage {
    readonly url: string;
    readonly label: string;
}

/** The checkout's files matching what was typed, as the owner's search answered it. */
export interface PanelNewTabSearch {
    /** The query this answer is for; an answer to another query is not shown. */
    readonly query: string;
    /** Matching paths, ranked; absent until an answer arrived. */
    readonly files?: readonly string[];
    readonly searching: boolean;
}

export interface PanelNewTabProps {
    /** Everything this tab can open, in the order its menu lists them. */
    readonly items: readonly PanelNewTabItem[];
    /** The items shown as tiles under "New", in tile order. */
    readonly pinned: readonly string[];
    /** How many tiles may be pinned. */
    readonly pinnedLimit: number;
    readonly onItemOpen: (id: string) => void;
    readonly onPinnedChange: (id: string, pinned: boolean) => void;
    /** The owner's file search; it is asked again whenever the typed text changes. */
    readonly search?: PanelNewTabSearch;
    readonly onSearch: (query: string) => void;
    readonly onFileOpen: (path: string) => void;
    /** Opens a web address in this tab, or absent where this tab cannot browse. */
    readonly onPageOpen?: (url: string) => void;
    /** Pages to offer again when what is typed matches them. */
    readonly recentPages?: readonly PanelNewTabPage[];
    /** What the field starts with. A new tab starts empty; a fixture may not. */
    readonly defaultQuery?: string;
}

/** One row under the field while something is typed. */
type PanelNewTabResult =
    | { readonly kind: "url"; readonly url: string }
    | { readonly kind: "page"; readonly page: PanelNewTabPage }
    | { readonly kind: "file"; readonly path: string };

/** Menu action ids, kept apart from the owner's item ids. */
const MENU_CUSTOMIZE = "panel-new-tab:customize";
const MENU_PIN_PREFIX = "panel-new-tab:pin:";
/** How many visited pages a query brings back before the files. */
const PAGE_RESULT_LIMIT = 3;

/**
 * The page a new tab in a side pane shows: one field that finds a file in the
 * checkout or opens a web address, and under it the few things the reader
 * starts most, as tiles. Everything else this tab can become, and the choice of
 * which tiles to show, is one menu away.
 *
 * The field stands at one height in the pane whatever is under it, so typing,
 * answers arriving, and the tiles giving way to results never move it. What is
 * typed is this tab's own; the owner answers it through `search`.
 */
export function PanelNewTab(props: PanelNewTabProps) {
    const [query, querySet] = useState(props.defaultQuery ?? "");
    const [highlight, highlightSet] = useState(0);
    const [customizing, customizingSet] = useState(false);
    const typed = query.trim();
    const url = props.onPageOpen ? browserAddressUrl(typed) : undefined;
    const needle = typed.toLowerCase();
    const answer = props.search?.query === query ? props.search : undefined;
    const results: readonly PanelNewTabResult[] =
        typed === ""
            ? []
            : [
                  ...(url === undefined ? [] : [{ kind: "url" as const, url }]),
                  ...(props.onPageOpen
                      ? (props.recentPages ?? [])
                            .filter(
                                (page) =>
                                    page.url !== url &&
                                    (page.label.toLowerCase().includes(needle) ||
                                        page.url.toLowerCase().includes(needle)),
                            )
                            .slice(0, PAGE_RESULT_LIMIT)
                            .map((page) => ({ kind: "page" as const, page }))
                      : []),
                  ...(answer?.files ?? []).map((path) => ({
                      kind: "file" as const,
                      path,
                  })),
              ];
    const selected = Math.min(highlight, results.length - 1);
    const pinned = props.items.filter((item) => props.pinned.includes(item.id));
    const pinnedFull = pinned.length >= props.pinnedLimit;

    const resultOpen = (result: PanelNewTabResult | undefined): void => {
        if (result?.kind === "url") props.onPageOpen?.(result.url);
        else if (result?.kind === "page") props.onPageOpen?.(result.page.url);
        else if (result?.kind === "file") props.onFileOpen(result.path);
    };
    const queryChange = (next: string): void => {
        querySet(next);
        highlightSet(0);
        props.onSearch(next);
    };
    const keyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
        if (event.key === "Escape" && query !== "") {
            event.preventDefault();
            event.stopPropagation();
            queryChange("");
            return;
        }
        if (results.length === 0) return;
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        highlightSet((selected + step + results.length) % results.length);
    };

    const menuItems: MenuItem[] = [
        ...props.items
            .filter((item) => !props.pinned.includes(item.id))
            .map(
                (item): MenuItem => ({
                    kind: "item",
                    id: item.id,
                    icon: item.icon,
                    label: item.label,
                    ...(item.unavailable === undefined ? {} : { disabled: true }),
                }),
            ),
        ...(pinned.length < props.items.length ? [{ kind: "separator" as const }] : []),
        {
            kind: "item",
            id: MENU_CUSTOMIZE,
            label: "Customize shortcuts",
            stay: true,
            trailingIcon: customizing ? "chevron-up" : "chevron-down",
        },
        ...(customizing
            ? [
                  {
                      kind: "label" as const,
                      label: `Choose ${String(props.pinnedLimit)} shortcuts`,
                  },
                  ...props.items.map((item): MenuItem => {
                      const on = props.pinned.includes(item.id);
                      return {
                          kind: "item",
                          id: `${MENU_PIN_PREFIX}${item.id}`,
                          label: item.label,
                          checked: on,
                          stay: true,
                          ...(!on && pinnedFull ? { disabled: true } : {}),
                      };
                  }),
              ]
            : []),
    ];

    return (
        <section className="happy-panel-new-tab" data-happy-desktop-ui="panel-new-tab">
            <div
                className="happy-panel-new-tab__scroller"
                data-happy-desktop-ui="panel-new-tab-scroller"
            >
                <div
                    className="happy-panel-new-tab__content"
                    data-happy-desktop-ui="panel-new-tab-content"
                >
                    <div
                        className="happy-panel-new-tab__column"
                        data-happy-desktop-ui="panel-new-tab-column"
                    >
                        <div
                            className="happy-panel-new-tab__search"
                            data-happy-desktop-ui="panel-new-tab-search"
                            onKeyDown={keyDown}
                        >
                            <TextField
                                aria-label="Search files or enter a URL"
                                autoComplete="off"
                                autoFocus
                                fullWidth
                                leadingIcon="search"
                                onSubmit={() => resultOpen(results[selected])}
                                onValueChange={queryChange}
                                placeholder="Search files or enter a URL"
                                size="large"
                                value={query}
                            />
                        </div>
                        {typed === "" ? (
                            <div
                                className="happy-panel-new-tab__section"
                                data-happy-desktop-ui="panel-new-tab-section"
                            >
                                <div
                                    className="happy-panel-new-tab__heading"
                                    data-happy-desktop-ui="panel-new-tab-heading"
                                >
                                    <h2 className="happy-panel-new-tab__title">New</h2>
                                    <MenuButton
                                        align="end"
                                        icon="more"
                                        items={menuItems}
                                        label="More"
                                        menuMaxHeight={420}
                                        menuWidth={248}
                                        onOpenChange={(open) => {
                                            if (!open) customizingSet(false);
                                        }}
                                        onSelect={(id) => {
                                            if (id === MENU_CUSTOMIZE) customizingSet((on) => !on);
                                            else if (id.startsWith(MENU_PIN_PREFIX)) {
                                                const item = id.slice(MENU_PIN_PREFIX.length);
                                                props.onPinnedChange(
                                                    item,
                                                    !props.pinned.includes(item),
                                                );
                                            } else props.onItemOpen(id);
                                        }}
                                        overlay
                                    />
                                </div>
                                {pinned.length > 0 ? (
                                    <div
                                        className="happy-panel-new-tab__tiles"
                                        data-happy-desktop-ui="panel-new-tab-tiles"
                                    >
                                        {pinned.map((item) => (
                                            <button
                                                className="happy-panel-new-tab__tile"
                                                data-happy-desktop-ui="panel-new-tab-tile"
                                                disabled={item.unavailable !== undefined}
                                                key={item.id}
                                                onClick={() => props.onItemOpen(item.id)}
                                                title={item.unavailable}
                                                type="button"
                                            >
                                                <span
                                                    className="happy-panel-new-tab__tile-icon"
                                                    data-happy-desktop-ui="panel-new-tab-tile-icon"
                                                >
                                                    <Icon name={item.icon} size={16} />
                                                </span>
                                                <span
                                                    className="happy-panel-new-tab__tile-label"
                                                    data-happy-desktop-ui="panel-new-tab-tile-label"
                                                >
                                                    {item.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div
                                aria-label="Results"
                                className="happy-panel-new-tab__results"
                                data-happy-desktop-ui="panel-new-tab-results"
                                role="listbox"
                            >
                                {results.map((result, index) => (
                                    <button
                                        aria-selected={index === selected}
                                        className="happy-panel-new-tab__result"
                                        data-happy-desktop-ui="panel-new-tab-result"
                                        data-highlighted={index === selected ? "" : undefined}
                                        key={
                                            result.kind === "file"
                                                ? `file:${result.path}`
                                                : result.kind === "page"
                                                  ? `page:${result.page.url}`
                                                  : `url:${result.url}`
                                        }
                                        onClick={() => resultOpen(result)}
                                        onPointerMove={() => {
                                            if (index !== selected) highlightSet(index);
                                        }}
                                        role="option"
                                        tabIndex={-1}
                                        type="button"
                                    >
                                        <span className="happy-panel-new-tab__result-icon">
                                            {result.kind === "file" ? (
                                                <FileKindIcon path={result.path} size={16} />
                                            ) : (
                                                <Icon name="globe" size={16} />
                                            )}
                                        </span>
                                        <span className="happy-panel-new-tab__result-name">
                                            {result.kind === "file"
                                                ? result.path.slice(
                                                      result.path.lastIndexOf("/") + 1,
                                                  )
                                                : result.kind === "page"
                                                  ? result.page.label
                                                  : `Open ${urlHost(result.url)}`}
                                        </span>
                                        <span className="happy-panel-new-tab__result-detail">
                                            {result.kind === "file"
                                                ? result.path.slice(
                                                      0,
                                                      Math.max(0, result.path.lastIndexOf("/")),
                                                  )
                                                : result.kind === "page"
                                                  ? result.page.url
                                                  : result.url}
                                        </span>
                                    </button>
                                ))}
                                {results.length === 0 ? (
                                    <p
                                        className="happy-panel-new-tab__note"
                                        data-happy-desktop-ui="panel-new-tab-note"
                                        role="status"
                                    >
                                        {answer === undefined || answer.searching
                                            ? "Searching…"
                                            : answer.files === undefined
                                              ? "Files could not be searched."
                                              : "No files match."}
                                    </p>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

/** The host a web address names, for the row that opens it. */
function urlHost(url: string): string {
    try {
        return new URL(url).host || url;
    } catch {
        return url;
    }
}
