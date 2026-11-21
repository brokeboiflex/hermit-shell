import { cva } from "class-variance-authority";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
    createContext,
    use,
    useEffectEvent,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react";
import { partitionComponentProps } from "./componentProps";
import { Dialog } from "./components/ui/dialog";
import { CLOSE_SHORTCUT, commandShortcutMatches } from "./keyboardShortcut";
import { cn } from "./lib/utils";
export type ModalOverlayProps = {
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    children: ReactNode;
    /**
     * Called when the dim outside the hosted card is clicked. Wiring it makes
     * the backdrop dismissable; omit it for surfaces that must not be closed by
     * clicking away — e.g. an editor holding unsaved work.
     */
    onDismiss?: () => void;
    /**
     * Called on Escape inside the overlay; defaults to `onDismiss`. A surface
     * that must not be lost to a stray click on the dim, but that the reader
     * may still close from the keyboard, wires only this.
     */
    onEscape?: () => void;
    /**
     * `center` (default) hosts dialogs and forms in the standard modal
     * location. `top` anchors transient type-ahead surfaces below the adaptive
     * top gutter; it is not a form placement. `fill` drops the gutter and gives
     * the whole window to one immersive media surface, which then paints its
     * own dark instead of floating as a card on the dim.
     */
    placement?: "center" | "top" | "fill";
    /**
     * `dim` (default) lays the scrim over the window and makes it the click
     * target that dismisses. `clear` leaves the window exactly as it is: no
     * dim, and pointers pass through to it. A press anywhere outside the hosted
     * card — the app behind it, or chrome outside the overlay such as the
     * connection rail — calls `onDismiss`, and the press still reaches what it
     * landed on. `soft` is the same tint without the blur, still the click
     * target that dismisses: for a transient type-ahead such as the ⌘K
     * palette, which sets itself apart from the window without hiding it.
     */
    backdrop?: "dim" | "soft" | "clear";
};
/**
 * What a ModalOverlayPresence tells the overlay and the card it hosts: whether
 * the surface is leaving, and how to say that it has finished leaving.
 */
export type ModalOverlayPresenceState = {
    readonly closing: boolean;
    readonly exited: () => void;
};
const ModalOverlayPresenceContext = createContext<ModalOverlayPresenceState | null>(null);
/**
 * The presence an enclosing ModalOverlayPresence gives, or null outside one. A
 * hosted card reads it to hand focus back the moment its surface starts
 * leaving rather than when the leaving is over.
 */
export function useModalOverlayPresence(): ModalOverlayPresenceState | null {
    return use(ModalOverlayPresenceContext);
}
export type ModalOverlayPresenceProps = {
    /** Whether the surface should be on screen. */
    open: boolean;
    /** The ModalOverlay, mounted while open and through its exit. */
    children: ReactNode;
};
/**
 * Keeps one ModalOverlay mounted through its exit, so a surface such as the ⌘K
 * palette arrives and leaves rather than cutting in and out. While `open` it
 * renders its overlay, which plays its entrance; when `open` turns false the
 * same overlay stays, inert, and plays its exit, then goes. Opening it again
 * while it is still leaving turns the very same overlay round — no second
 * mount, no restarted entrance. Outside one, a ModalOverlay neither enters nor
 * leaves with motion, which keeps the blueprint's fixtures still.
 */
export function ModalOverlayPresence(props: ModalOverlayPresenceProps) {
    const [mounted, setMounted] = useState(props.open);
    // An opening is known during render, so the overlay mounts in the same
    // commit that opened it: its input can take focus before the first frame.
    if (props.open && !mounted) setMounted(true);
    if (!mounted) return null;
    return (
        <ModalOverlayPresenceContext
            value={{ closing: !props.open, exited: () => setMounted(false) }}
        >
            {props.children}
        </ModalOverlayPresenceContext>
    );
}
const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/*
 * Escape presses Radix handed to an overlay as the top layer, which the overlay
 * claimed in the capture phase and answers in the bubble phase; and the presses
 * an overlay has already answered, so an enclosing one does not close too. A
 * press that was claimed by anything else — a Radix menu, select, or popover
 * open in the card — is not the overlay's to answer.
 */
const overlayEscapes = new WeakSet<Event>();
const answeredEscapes = new WeakSet<Event>();

/**
 * Hands an Escape press on to the overlay beneath, for a Radix layer that
 * answers Escape only by closing itself — a tooltip bubble. Radix gives the
 * press to the highest layer alone, so an open tooltip would otherwise take the
 * press the person meant for the dialog under it; the bubble still closes, and
 * the overlay then answers the same press as its own.
 */
export function modalOverlayEscapeHandOn(event: KeyboardEvent): void {
    overlayEscapes.add(event);
}

/*
 * The window-covering layer: shadcn's dialog overlay (the theme's soft scrim
 * under a light blur) as a flex box that hosts one card inside a 24px gutter.
 * A hosted Modal is capped short of the gutter box so a tall one keeps a clear
 * margin above and below and scrolls its own body; the clearance form keeps
 * every resolved height on whole pixels for an integer window, so the card's
 * hairlines land on physical pixels at 2×. Cards that bound themselves
 * (Lightbox, an editor panel) are left alone.
 */
const overlayVariants = cva(
    "happy-modal-overlay fixed inset-0 z-(--happy-z-overlay) box-border flex outline-none",
    {
        variants: {
            placement: {
                center: "items-center justify-center p-6 [&>[data-happy-desktop-ui=modal]]:max-h-[min(calc(100%-80px),760px)]",
                /* A container cannot resolve cqh units against itself, so the
                   top layout inside owns the adaptive gutter. */
                top: "@container-size items-start justify-center p-0",
                /* One immersive surface instead of a card: no gutter, and the
                   hosted surface stretches to every edge of the window. */
                fill: "items-stretch justify-stretch p-0",
            },
            backdrop: {
                dim: "bg-overlay supports-backdrop-filter:backdrop-blur-xs",
                soft: "bg-overlay",
                /* Nothing painted, and pointers pass through every box the
                   overlay draws; only the hosted card takes presses. */
                clear: "pointer-events-none bg-transparent",
            },
        },
        compoundVariants: [
            /* The immersive surface paints over the whole window, so a blur
               under it would cost a frame and show nothing. */
            {
                placement: "fill",
                backdrop: "dim",
                class: "supports-backdrop-filter:backdrop-blur-none",
            },
            {
                placement: "center",
                backdrop: "clear",
                class: "*:pointer-events-auto",
            },
            { placement: "fill", backdrop: "clear", class: "*:pointer-events-auto" },
        ],
    },
);

/*
 * Presence motion, as transitions rather than keyframes so an overlay opened
 * again while it is still leaving turns round from wherever it stands. The dim
 * fades in; the card fades in while it settles a few pixels down from just
 * under its size; leaving runs faster and the other way. The open and closing
 * states are exclusive selectors, so neither depends on the order Tailwind
 * writes them in.
 */
const OVERLAY_MOTION =
    "data-[presence=open]:transition-opacity data-[presence=open]:duration-(--happy-motion-backdrop-enter) data-[presence=open]:ease-(--happy-motion-ease-out) data-[presence=open]:starting:opacity-0 data-[presence=closing]:pointer-events-none data-[presence=closing]:opacity-0 data-[presence=closing]:transition-opacity data-[presence=closing]:duration-(--happy-motion-pop-exit) data-[presence=closing]:ease-(--happy-motion-ease-in)";

/* Applied by whichever box is the hosted card's parent: the overlay itself, or
   its top layout. */
const CARD_MOTION =
    "data-[presence=open]:*:origin-top data-[presence=open]:*:transition-[opacity,transform] data-[presence=open]:*:duration-(--happy-motion-pop-enter) data-[presence=open]:*:ease-(--happy-motion-ease-out) data-[presence=open]:starting:*:opacity-0 data-[presence=open]:starting:*:transform-(--happy-motion-pop-enter-transform) data-[presence=closing]:*:origin-top data-[presence=closing]:*:opacity-0 data-[presence=closing]:*:transform-(--happy-motion-pop-exit-transform) data-[presence=closing]:*:transition-[opacity,transform] data-[presence=closing]:*:duration-(--happy-motion-pop-exit) data-[presence=closing]:*:ease-(--happy-motion-ease-in)";

/**
 * C-058 ModalOverlay — the single backdrop every modal-class surface sits on,
 * built on the shadcn/Radix dialog: the overlay box is the dialog's content
 * layer, so it takes its place in Radix's layer stack, loops Tab inside
 * itself, and lets a Radix menu, select, or popover opened in the card answer
 * Escape before the overlay does.
 *
 * One scrim, one stacking level (`--happy-z-overlay`), fixed to the app window,
 * and a flex box that hosts exactly one card (Modal, Lightbox, editor panel, or
 * transient type-ahead) inside a 24px safe-area gutter. The default placement
 * centers dialogs and forms; `top` anchors a transient type-ahead below an
 * adaptive top gutter; `fill` hands the whole window to one immersive surface
 * with no gutter at all. Clicking the scrim outside the card calls `onDismiss`
 * when wired; clicks inside never dismiss.
 *
 * The dialog is non-modal on purpose: menus and pickers that have not moved to
 * Radix still hang off the shell's overlay lane, outside this box, and a modal
 * Radix dialog would freeze pointer events on the page and pull focus back from
 * them. The overlay draws its own scrim for the same reason, since Radix only
 * draws one for a modal dialog. The hosted card names itself (Modal carries
 * `role="dialog"`), so the overlay box takes no role of its own.
 *
 * A `clear` backdrop paints nothing and lets pointers through: the window
 * stays exactly as it was, and a press anywhere outside the card dismisses it.
 * A `soft` one is the scrim without its blur, for a transient type-ahead such
 * as the ⌘K palette.
 *
 * The overlay owns modal focus: on mount it moves focus to the hosted card's
 * first focusable control (unless the card already focused itself, as the
 * command palette does), so Escape works immediately without a preceding
 * click; on unmount it hands focus back to the control that opened it. Radix's
 * own open and close focus moves are turned off, because they run a frame late.
 */
export function ModalOverlay(props: ModalOverlayProps) {
    const [local, rest] = partitionComponentProps(props, [
        "className",
        "style",
        "children",
        "onDismiss",
        "onEscape",
        "placement",
        "backdrop",
    ]);
    const overlayEl = useRef<HTMLDivElement>(null);
    const presence = use(ModalOverlayPresenceContext);
    const present = presence !== null;
    const closing = presence?.closing === true;
    const invokerRef = useRef<HTMLElement | null>(null);
    // Imperative focus handoff at the overlay's lifetime boundary: there is no
    // declarative way to move browser focus into the dialog on open and back to
    // the invoking control on close.
    // eslint-disable-next-line happy-react/no-layout-effect -- opening and closing a modal must move live browser focus into its committed dialog and back to the still-connected invoker
    useLayoutEffect(() => {
        const overlay = overlayEl.current;
        if (!overlay) return;
        const invoker = document.activeElement as HTMLElement | null;
        invokerRef.current = invoker;
        // A hosted card may have claimed focus in its own mount effect (child
        // effects run first); only fill the gap when focus is still outside.
        if (!overlay.contains(document.activeElement)) {
            const target = overlay.querySelector<HTMLElement>(FOCUSABLE) ?? overlay;
            target.focus();
        }
        // A press outside a clear overlay, or anything a leaving overlay's
        // departure set off, may already have put focus somewhere else.
        const passThrough = local.backdrop === "clear" || presence !== null;
        return () => {
            // A press outside a clear overlay may already have put focus where
            // it landed; that is where the reader went, so leave it there.
            const focused = document.activeElement;
            const unclaimed =
                !passThrough ||
                focused === null ||
                focused === document.body ||
                overlay.contains(focused);
            if (unclaimed && invoker && invoker.isConnected && invoker !== document.body)
                invoker.focus();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- focus moves in on open and back on close only; the backdrop is read once for that lifetime, and re-running on a change would steal focus mid-dialog
    }, []);
    const exited = useEffectEvent(() => presence?.exited());
    // eslint-disable-next-line happy-react/no-layout-effect -- a leaving overlay must hand live browser focus back before it goes (and take it again if opened before it is gone), and its exit ends only when the browser's own transitions on it do
    useLayoutEffect(() => {
        const overlay = overlayEl.current;
        if (!overlay || !present) return;
        if (!closing) {
            // Opened again before it was gone: focus comes back in, as on a
            // first opening, unless the card has already taken it.
            if (!overlay.contains(document.activeElement))
                (overlay.querySelector<HTMLElement>(FOCUSABLE) ?? overlay).focus();
            return;
        }
        // Focus goes back as the overlay starts to leave, not when it is gone,
        // so the next keystroke already lands where the reader is going.
        const invoker = invokerRef.current;
        const focused = document.activeElement;
        if (
            invoker &&
            invoker.isConnected &&
            !overlay.contains(invoker) &&
            (focused === null || focused === document.body || overlay.contains(focused))
        )
            invoker.focus();
        // Reading the animations settles style, which starts the exit
        // transitions. Each ends or is cancelled — by opening again, which
        // turns them round — and either way the wait ends, so a leaving
        // overlay can never be left standing.
        // Where there are no Web Animations at all (jsdom), nothing is running.
        const animations =
            "getAnimations" in overlay ? overlay.getAnimations({ subtree: true }) : [];
        let current = true;
        void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
            if (current) exited();
        });
        return () => {
            current = false;
        };
    }, [closing, present]);
    const placement = local.placement ?? "center";
    const backdrop = local.backdrop ?? "dim";
    const clear = backdrop === "clear";
    const dismissOutside = useEffectEvent((event: PointerEvent) => {
        const overlay = overlayEl.current;
        // Pointers pass through the clear overlay's own boxes, so a press that
        // lands anywhere inside it landed on the card or something it hosts.
        if (!overlay || (event.target instanceof Node && overlay.contains(event.target))) return;
        local.onDismiss?.();
    });
    // eslint-disable-next-line happy-react/no-layout-effect -- a clear overlay lets presses through to the window, so dismissing on a press outside the card can only be read from the document itself, at once and whether or not what was pressed stops the event
    useLayoutEffect(() => {
        if (!clear) return;
        const onPointerDown = (event: PointerEvent) => dismissOutside(event);
        document.addEventListener("pointerdown", onPointerDown, true);
        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [clear]);
    const presenceState = presence ? (closing ? "closing" : "open") : undefined;
    const close = local.onEscape ?? local.onDismiss;
    return (
        <Dialog
            modal={false}
            // A hosted shadcn DialogClose closes the surface as Escape does.
            onOpenChange={(open) => {
                if (!open) close?.();
            }}
            open
        >
            <DialogPrimitive.Content
                {...rest}
                aria-describedby={undefined}
                className={cn(
                    overlayVariants({ placement, backdrop }),
                    OVERLAY_MOTION,
                    placement === "top" ? undefined : CARD_MOTION,
                    local.className,
                )}
                data-backdrop={backdrop === "dim" ? undefined : backdrop}
                data-happy-desktop-ui="modal-overlay"
                data-placement={placement === "center" ? undefined : placement}
                data-presence={presenceState}
                inert={closing || undefined}
                onClick={(event) => {
                    if (
                        local.onDismiss &&
                        (event.target === event.currentTarget ||
                            (placement === "top" &&
                                event.target instanceof HTMLElement &&
                                event.target.dataset.happyDesktopUi === "modal-overlay-top-layout"))
                    )
                        local.onDismiss();
                }}
                // The overlay moves focus itself, in the same commit (see above).
                onCloseAutoFocus={(event) => event.preventDefault()}
                // Escape is answered in the bubble phase below, so a control in
                // the card that keeps Escape for itself — a video's speed list,
                // a context menu — still can. Radix would answer it here, in the
                // capture phase, before any of them.
                onEscapeKeyDown={(event) => {
                    overlayEscapes.add(event);
                    event.preventDefault();
                }}
                // Focus leaving never dismisses; a press outside dismisses only
                // where this overlay says so (the scrim's click, or the clear
                // backdrop's document listener).
                onFocusOutside={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        const press = event.nativeEvent;
                        // A nested overlay already closed for this press, or a
                        // Radix layer above this one answered it.
                        if (answeredEscapes.has(press)) return;
                        if (press.defaultPrevented && !overlayEscapes.has(press)) return;
                        if (!close) return;
                        answeredEscapes.add(press);
                        close();
                        return;
                    }
                    // The close chord means the innermost thing that is up, and
                    // while an overlay is up that is the overlay: it leaves as
                    // it does on Escape. Claiming the event keeps the same press
                    // from reaching the window, which would close what is behind
                    // it too.
                    if (!close || !commandShortcutMatches(event.nativeEvent, CLOSE_SHORTCUT))
                        return;
                    event.preventDefault();
                    close();
                }}
                onOpenAutoFocus={(event) => event.preventDefault()}
                onPointerDownOutside={(event) => event.preventDefault()}
                ref={overlayEl}
                role={undefined}
                style={local.style}
                tabIndex={-1}
            >
                {placement === "top" ? (
                    <div
                        className={cn(
                            "happy-modal-overlay__top-layout box-border flex h-full w-full flex-none items-start justify-center px-6 pt-[min(128px,max(24px,calc(100cqh-485px)))] pb-6",
                            CARD_MOTION,
                            clear && "*:pointer-events-auto",
                        )}
                        data-happy-desktop-ui="modal-overlay-top-layout"
                        data-presence={presenceState}
                    >
                        {local.children}
                    </div>
                ) : (
                    local.children
                )}
            </DialogPrimitive.Content>
        </Dialog>
    );
}
