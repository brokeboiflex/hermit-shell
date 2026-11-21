import { partitionComponentProps } from "./componentProps";
import { type CSSProperties, type ReactNode } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./components/ui/input-group";
import { Icon } from "./Icon";
import { cn } from "./lib/utils";
export type ToolbarSearch = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};
export type ToolbarProps = {
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    title?: string;
    subtitle?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
    search?: ToolbarSearch;
    height?: number;
    /**
     * Names the title as a heading at this level. A toolbar over a section is
     * usually a label rather than a heading, which is why the default stays a
     * span; when the toolbar heads a whole screen it is that screen's heading,
     * and the headings below it need something to sit under.
     */
    titleLevel?: 1 | 2 | 3;
};
/*
 * Optical vertical ink corrections, tuned per engine at true-2x with
 * alpha-weighted centroids (see Toolbar.test.tsx). Figtree paints low in its
 * line box; each lift is a device-pixel (0.5px-at-2x) multiple so the paint
 * never re-rasterizes. Raw uncorrected centroids: title (15px/700) Blink +1.0,
 * Gecko +1.5, WebKit +0.45 low; subtitle (12px/500) Blink +1.1, Gecko +1.6,
 * WebKit +0.58 low. The lifts are declared on the root so the resolved value is
 * readable through getComputedStyle there, which the test asserts. Only Gecko
 * parses -moz-appearance, only WebKit parses -webkit-named-image(), so those
 * two @supports scopes are engine scopes. The title and subtitle keep the type
 * these were measured at; changing either means measuring them again.
 */
const opticalLift = [
    "[--happy-toolbar-title-optical-y:-1px] [--happy-toolbar-subtitle-optical-y:-1px]",
    "supports-[-moz-appearance:none]:[--happy-toolbar-title-optical-y:-1.5px] supports-[-moz-appearance:none]:[--happy-toolbar-subtitle-optical-y:-1.5px]",
    "supports-[background:-webkit-named-image(i)]:[--happy-toolbar-title-optical-y:-0.5px] supports-[background:-webkit-named-image(i)]:[--happy-toolbar-subtitle-optical-y:-0.5px]",
];
/**
 * C-026 Toolbar — panel/section header bar. A default 48px strip that sits at
 * the top of a panel (admin tables, settings sections): a title with an
 * optional subtitle on the left, an optional leading slot, and a right-pinned
 * actions cluster holding an optional search field (shadcn's InputGroup) and a
 * trailing slot. Transparent, with no separator of its own, so it composes on
 * whatever surface it heads. The heading truncates through its lane; the
 * actions never shrink. Height is overridable through `height`, which sets
 * `--happy-toolbar-height`.
 */
export function Toolbar(props: ToolbarProps) {
    const [local] = partitionComponentProps(props, [
        "className",
        "data-testid",
        "style",
        "title",
        "subtitle",
        "leading",
        "trailing",
        "search",
        "height",
        "titleLevel",
    ]);
    const hasHeading = () => local.title !== undefined || local.subtitle !== undefined;
    const hasActions = () => local.search !== undefined || local.trailing !== undefined;
    return (
        <header
            className={cn(
                "happy-toolbar flex h-[var(--happy-toolbar-height,48px)] w-full items-center gap-3 px-4 font-sans text-foreground",
                opticalLift,
                local.className,
            )}
            data-happy-desktop-ui="toolbar"
            data-testid={local["data-testid"]}
            style={{
                ...local.style,
                ...(local.height === undefined
                    ? {}
                    : { "--happy-toolbar-height": `${local.height}px` }),
            }}
        >
            {local.leading ? (
                <div
                    className="happy-toolbar__leading flex flex-none items-center gap-2 text-muted-foreground"
                    data-happy-desktop-ui="toolbar-leading"
                >
                    {local.leading}
                </div>
            ) : null}
            {hasHeading() ? (
                <div
                    className="happy-toolbar__heading flex min-w-0 flex-auto flex-col justify-center"
                    data-happy-desktop-ui="toolbar-heading"
                >
                    {local.title !== undefined
                        ? ((
                              Title = local.titleLevel === undefined
                                  ? ("span" as const)
                                  : (`h${String(local.titleLevel)}` as "h1" | "h2" | "h3"),
                          ) => (
                              /* Every declaration a heading element would bring
                                 its own value for is stated, so titleLevel changes
                                 what the title is called and nothing about how it
                                 sits: the same 20px line whether span or h1. */
                              <Title
                                  className="happy-toolbar__title m-0 block min-w-0 font-heading text-[15px]/5 font-bold tracking-[-0.01em] text-foreground"
                                  data-happy-desktop-ui="toolbar-title"
                              >
                                  {/* Truncation and the optical lift live on the
                                      ink, so the title box keeps its whole 20px
                                      line on the grid while the paint moves. */}
                                  <span className="happy-toolbar__title-ink block translate-y-(--happy-toolbar-title-optical-y) truncate">
                                      {local.title}
                                  </span>
                              </Title>
                          ))()
                        : null}
                    {local.subtitle !== undefined ? (
                        <span
                            className="happy-toolbar__subtitle block min-w-0 text-xs/4 font-medium text-muted-foreground"
                            data-happy-desktop-ui="toolbar-subtitle"
                        >
                            <span className="happy-toolbar__subtitle-ink block translate-y-(--happy-toolbar-subtitle-optical-y) truncate">
                                {local.subtitle}
                            </span>
                        </span>
                    ) : null}
                </div>
            ) : null}
            {hasActions() ? (
                <div
                    className="happy-toolbar__actions ml-auto flex flex-none items-center gap-2"
                    data-happy-desktop-ui="toolbar-actions"
                >
                    {local.search
                        ? ((search) => (
                              <InputGroup
                                  className="happy-toolbar__search w-55 flex-none"
                                  data-happy-desktop-ui="toolbar-search"
                              >
                                  <InputGroupInput
                                      aria-label={search.placeholder ?? "Search"}
                                      className="happy-toolbar__search-input"
                                      data-happy-desktop-ui="toolbar-search-input"
                                      onChange={(event) =>
                                          search.onChange(event.currentTarget.value)
                                      }
                                      placeholder={search.placeholder ?? "Search"}
                                      type="text"
                                      value={search.value}
                                  />
                                  <InputGroupAddon
                                      aria-hidden="true"
                                      className="happy-toolbar__search-icon"
                                      data-happy-desktop-ui="toolbar-search-icon"
                                  >
                                      <Icon name="search" size={16} />
                                  </InputGroupAddon>
                              </InputGroup>
                          ))(local.search)
                        : null}
                    {local.trailing ? (
                        <div
                            className="happy-toolbar__trailing flex flex-none items-center gap-2"
                            data-happy-desktop-ui="toolbar-trailing"
                        >
                            {local.trailing}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </header>
    );
}
