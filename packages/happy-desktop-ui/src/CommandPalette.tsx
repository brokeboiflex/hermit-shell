import { partitionComponentProps } from "./componentProps";
import {
    useLayoutEffect,
    useRef,
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
} from "react";
import { KeyCap } from "./Badge";
import { InputGroup, InputGroupAddon } from "./components/ui/input-group";
import { Kbd, KbdGroup } from "./components/ui/kbd";
import { Icon } from "./Icon";
import { cn } from "./lib/utils";
import { commandShortcut, commandShortcutMatches } from "./keyboardShortcut";
import { ScrollArea } from "./Scrollbar";
import { useModalOverlayPresence } from "./ModalOverlay";
import { Ionicon } from "./vectorIcons/VectorIcon";
/**
 * The chord that opens the palette, owned here as well so it can close it. The
 * window dispatcher cannot: an open palette is a dialog, and every window
 * shortcut is deliberately switched off while one is up.
 */
const PALETTE_SHORTCUT = commandShortcut("k");
/** ⌘1…⌘9, which open the owner's numbered results while the palette is up. */
const NUMBER_SHORTCUTS = Array.from({ length: 9 }, (_, index) =>
    commandShortcut(String(index + 1)),
);
export type CommandPaletteProps = {
    /** The current query text; the palette input is a controlled reflection of it. */
    query: string;
    /** Emits the committed query text (IME composition is coalesced to its end). */
    onQueryChange: (value: string) => void;
    /** Dismisses the palette from Escape or ⌘K again. */
    onClose: () => void;
    /**
     * Moves the owner's highlighted row: 1 for ArrowDown, -1 for ArrowUp typed
     * in the input. The card does not own the selection — the rows and their
     * order belong to whoever supplied the body — so it reports the intent,
     * keeps the caret where it is, and never moves focus out of the input.
     */
    onSelectionMove?: (direction: 1 | -1) => void;
    /** Runs the owner's highlighted row from Enter typed in the input. */
    onSelectionCommit?: () => void;
    /**
     * Opens the owner's result numbered 1–9 from ⌘1…⌘9. While the palette is
     * up the chord is its own: it never reaches the window's ⌘-number
     * navigation, even when no row wears that number.
     */
    onNumberCommit?: (number: number) => void;
    /** Result/command body rendered under the input row. */
    children: ReactNode;
    placeholder?: string;
    /**
     * Focuses the input on mount, caret after the query. On by default so the palette is
     * ready to type; disable it only for deterministic screenshot fixtures.
     */
    autoFocus?: boolean;
    className?: string;
    style?: CSSProperties;
    "data-testid"?: string;
};
/**
 * C-060 CommandPalette — the ⌘K palette card, drawn as shadcn's Command in a
 * dialog: the popover surface on the XL corner with a quiet ring, the search
 * field as CommandInput draws it (a soft InputGroup with the search glyph), a
 * scrollable result/command body with the browser's own bar, and a footer
 * naming the keys that drive it. Hosted by ModalOverlay at its `top` placement.
 * The card fits its results: a short list ends the card right under it, and
 * the body grows with the list up to 365px and scrolls only past that. Hung
 * from the top, the field stays where it is while the reader types; only the
 * card's bottom edge follows the list.
 *
 * It is not built on cmdk. The body is whatever the owner hands it
 * (CommandPaletteResults, whose rows host real switches and so cannot be
 * listbox options), the highlight is the owner's state, and the field emits
 * only committed IME text — none of which cmdk's own input and list allow.
 *
 * The card owns four behaviors application code should not re-implement: it
 * focuses its input on mount with the caret after the query, returns focus to whatever control
 * was focused when it opened once it unmounts, closes on Escape and on ⌘K
 * again, and reads ArrowUp/ArrowDown/Enter and ⌘1…⌘9 for the owner's result
 * list without ever surrendering focus. Typing is IME-safe —
 * intermediate composition text is left to the browser's buffer and only the
 * committed value is emitted, so a controlled `query` never interrupts an
 * active composition. It renders the card only (no scrim/stacking); compose it
 * inside `ModalOverlay` so the host owns its dim, stacking, and placement.
 */
/* One key hint in the footer: its caps, then what they do. */
const hintClassName = "happy-command-palette__hint flex flex-none items-center gap-1.5";
export function CommandPalette(props: CommandPaletteProps) {
    const [local, rest] = partitionComponentProps(props, [
        "query",
        "onQueryChange",
        "onClose",
        "onSelectionMove",
        "onSelectionCommit",
        "onNumberCommit",
        "children",
        "placeholder",
        "autoFocus",
        "className",
        "style",
    ]);
    const inputRef = useRef<HTMLInputElement>(null);
    const invokerRef = useRef<HTMLElement | null>(null);
    const composingRef = useRef(false);
    const label = () => local.placeholder ?? "Search";
    // eslint-disable-next-line happy-react/no-layout-effect -- opening the palette must capture the live invoking element and move browser focus into the committed input before paint
    useLayoutEffect(() => {
        // Capture the invoking control before autofocus moves focus into the
        // input, so closing the palette can hand focus back to it.
        invokerRef.current = document.activeElement as HTMLElement | null;
        // The caret goes after the query rather than selecting it: the field
        // shows exactly what was typed, never a highlighted run of text.
        const input = inputRef.current;
        if (local.autoFocus !== false && input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }, [local.autoFocus]);
    const cardRef = useRef<HTMLDivElement>(null);
    // Hands focus back to the control that opened the palette, unless the
    // reader's choice has already put it somewhere else.
    const focusReturn = (card: HTMLElement | null) => {
        const invoker = invokerRef.current;
        if (!invoker || invoker === inputRef.current || !invoker.isConnected) return;
        const focused = document.activeElement;
        if (focused === null || focused === document.body || card?.contains(focused) !== false)
            invoker.focus();
    };
    const closing = useModalOverlayPresence()?.closing === true;
    // eslint-disable-next-line happy-react/no-layout-effect -- a palette that starts leaving hands live focus back at once, so typing during its exit already reaches where the reader is going, and takes it again if it is opened before it is gone
    useLayoutEffect(() => {
        if (closing) {
            focusReturn(cardRef.current);
            return;
        }
        // Opened again while it was still leaving: the same card is back, and
        // so is the caret, after the query as on a first opening.
        const input = inputRef.current;
        if (local.autoFocus === false || !input || document.activeElement === input) return;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when leaving starts or is called off; focusReturn reads only refs
    }, [closing]);
    // eslint-disable-next-line happy-react/no-layout-effect -- closing the palette restores focus to the exact still-connected DOM control that invoked it, which is an imperative unmount handoff
    useLayoutEffect(() => {
        const card = cardRef.current;
        return () => focusReturn(card);
    }, []);
    // 229 is the legacy IME "processing" keyCode some engines still report when
    // `isComposing` is not yet set on the keydown that starts a composition.
    const isComposing = (event: ReactKeyboardEvent) =>
        composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229;
    return (
        <div
            {...rest}
            aria-label={label()}
            aria-modal="true"
            className={cn(
                /* The footer keeps the last row out of the card's bottom
                   corners, so a hosted SearchResults rounds its last row like
                   every other. */
                "happy-command-palette flex max-h-full w-160 max-w-full flex-none flex-col overflow-hidden rounded-xl bg-popover font-sans text-popover-foreground shadow-lg ring-1 ring-foreground/10 [--happy-search-results-last-radius:calc(var(--radius)*0.6)]",
                local.className,
            )}
            data-happy-desktop-ui="command-palette"
            ref={cardRef}
            onKeyDown={(event) => {
                if (event.key === "Escape" && !isComposing(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    local.onClose();
                    return;
                }
                // The chord that opened it closes it again, from anywhere in
                // the card. It is handled here rather than in the window
                // dispatcher because that dispatcher stands down for a dialog,
                // which is exactly what this card is while it is open.
                if (commandShortcutMatches(event.nativeEvent, PALETTE_SHORTCUT)) {
                    event.preventDefault();
                    event.stopPropagation();
                    local.onClose();
                    return;
                }
                const onNumberCommit = local.onNumberCommit;
                if (!onNumberCommit) return;
                const number =
                    NUMBER_SHORTCUTS.findIndex((shortcut) =>
                        commandShortcutMatches(event.nativeEvent, shortcut),
                    ) + 1;
                if (number === 0) return;
                event.preventDefault();
                event.stopPropagation();
                onNumberCommit(number);
            }}
            role="dialog"
            style={local.style}
        >
            <div
                className="happy-command-palette__header flex-none p-1 pb-0"
                data-happy-desktop-ui="command-palette-header"
            >
                <InputGroup className="border-input/30 bg-input/30 shadow-none">
                    <InputGroupAddon
                        aria-hidden="true"
                        className="happy-command-palette__icon pl-2.5"
                        data-happy-desktop-ui="command-palette-icon"
                    >
                        <Icon className="opacity-50" name="search" size={16} />
                    </InputGroupAddon>
                    <input
                        aria-label={label()}
                        className="happy-command-palette__input h-full w-full min-w-0 flex-auto bg-transparent pr-2.5 text-sm text-foreground outline-hidden placeholder:text-muted-foreground"
                        data-happy-desktop-ui="command-palette-input"
                        onCompositionEnd={() => {
                            composingRef.current = false;
                        }}
                        onCompositionStart={() => {
                            composingRef.current = true;
                        }}
                        onInput={(event) => {
                            // Single commit path. Intermediate composition input events
                            // are held back on either signal: the local composition flag
                            // (authoritative, so an unreliable/absent `isComposing` hint
                            // is still suppressed) or the event's `isComposing` hint.
                            // `compositionend` clears the flag before the browser's
                            // trailing input (isComposing === false), so that one event is
                            // the sole commit — a value is never emitted twice.
                            if (composingRef.current || event.nativeEvent.isComposing) return;
                            local.onQueryChange(event.currentTarget.value);
                        }}
                        onKeyDown={(event) => {
                            // Travelling the result list is typing, so it is read
                            // here rather than on the card: the list never takes
                            // focus, and Escape keeps the card-level path above.
                            if (
                                isComposing(event) ||
                                event.metaKey ||
                                event.ctrlKey ||
                                event.altKey
                            )
                                return;
                            if (event.key === "ArrowDown" && local.onSelectionMove) {
                                // Without this the caret jumps to the end of the query.
                                event.preventDefault();
                                local.onSelectionMove(1);
                                return;
                            }
                            if (event.key === "ArrowUp" && local.onSelectionMove) {
                                event.preventDefault();
                                local.onSelectionMove(-1);
                                return;
                            }
                            if (event.key === "Enter" && local.onSelectionCommit) {
                                event.preventDefault();
                                local.onSelectionCommit();
                            }
                        }}
                        placeholder={label()}
                        ref={inputRef}
                        type="text"
                        value={local.query}
                    />
                </InputGroup>
            </div>
            {/* The scrollport is edge to edge, with no spacing of its own; its
                content carries the inset. The bar is the product's one
                scrollbar (styles/scrollbar.css) and lies over that inset,
                beside the selected row rather than on it, so nothing moves when
                the list grows long enough to scroll. */}
            <ScrollArea
                className="happy-command-palette__body min-h-0 flex-[0_1_auto]"
                data-happy-desktop-ui="command-palette-body"
                data-scrollbar-rows=""
                viewportClassName="happy-command-palette__body-viewport flex max-h-91.25 flex-col overflow-x-hidden overflow-y-auto"
            >
                <div
                    className="happy-command-palette__body-content flex flex-[1_0_auto] flex-col p-1"
                    data-happy-desktop-ui="command-palette-body-content"
                >
                    {local.children}
                </div>
            </ScrollArea>
            {/* The keys that drive the card, named once at its foot rather
                than taught on every row. Travel and commit are offered only by
                an owner that reads them; Escape always closes. A picture of
                the keys, so it is not read out: the keys themselves work. */}
            <div
                aria-hidden="true"
                className="happy-command-palette__footer flex h-9 flex-none items-center gap-4 border-t px-3 text-xs whitespace-nowrap text-muted-foreground"
                data-happy-desktop-ui="command-palette-footer"
            >
                {local.onSelectionMove ? (
                    <span className={hintClassName} data-happy-desktop-ui="command-palette-hint">
                        <KbdGroup className="happy-command-palette__hint-keys gap-0.5">
                            <Kbd className="happy-command-palette__key">
                                <Icon name="arrow-up" size={12} />
                            </Kbd>
                            <Kbd className="happy-command-palette__key">
                                <Icon name="arrow-down" size={12} />
                            </Kbd>
                        </KbdGroup>
                        <span className="happy-command-palette__hint-label leading-4">
                            Navigate
                        </span>
                    </span>
                ) : null}
                {local.onSelectionCommit ? (
                    <span className={hintClassName} data-happy-desktop-ui="command-palette-hint">
                        <KbdGroup className="happy-command-palette__hint-keys gap-0.5">
                            <Kbd className="happy-command-palette__key">
                                <Ionicon name="return-down-back" size={12} />
                            </Kbd>
                        </KbdGroup>
                        <span className="happy-command-palette__hint-label leading-4">Open</span>
                    </span>
                ) : null}
                <span className={hintClassName} data-happy-desktop-ui="command-palette-hint">
                    <KbdGroup className="happy-command-palette__hint-keys gap-0.5">
                        <KeyCap decorative keys="ESC" />
                    </KbdGroup>
                    <span className="happy-command-palette__hint-label leading-4">Close</span>
                </span>
            </div>
        </div>
    );
}
