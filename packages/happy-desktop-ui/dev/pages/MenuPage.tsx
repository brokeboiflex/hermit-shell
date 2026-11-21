import { useState, type ReactNode } from "react";
import { AppShell } from "../../src/AppShell";
import { ContextMenu } from "../../src/ContextMenu";
import { FileActionsMenu } from "../../src/FileActionsMenu";
import { FileRevealContext, LinkContextMenu, type FileReveal } from "../../src/LinkContextMenu";
import { Menu, type MenuItem } from "../../src/Menu";
import { ComponentPage, DimensionRule, Specimen } from "../kit";

/** The component plan this page documents. The selector and the page header read the same value. */
export const componentNumber = "C-027";

const messageActions: MenuItem[] = [
    {
        kind: "item",
        id: "copy",
        label: "Copy link",
        icon: "link",
        shortcut: "⌘C",
    },
    { kind: "item", id: "star", label: "Add to starred", icon: "star" },
    {
        kind: "item",
        id: "view",
        label: "View details",
        icon: "eye",
        shortcut: "⌘I",
    },
    { kind: "separator" },
    {
        kind: "item",
        id: "edit",
        label: "Edit message",
        icon: "edit",
        shortcut: "⌘E",
    },
    {
        kind: "item",
        id: "delete",
        label: "Delete message",
        icon: "close",
        danger: true,
        shortcut: "⇧⌘D",
    },
];

const grouped: MenuItem[] = [
    { kind: "label", label: "Sort by" },
    { kind: "item", id: "recent", label: "Most recent", icon: "clock" },
    { kind: "item", id: "unread", label: "Unread first", icon: "inbox" },
    { kind: "separator" },
    { kind: "label", label: "Filter" },
    { kind: "item", id: "mentions", label: "Only mentions", icon: "at" },
    {
        kind: "item",
        id: "muted",
        label: "Include muted",
        icon: "bell",
        disabled: true,
    },
];

/** Rows that say when: the name gives way, the time stays whole. */
const dated: MenuItem[] = [
    { kind: "label", label: "Open" },
    {
        kind: "item",
        id: "one",
        label: "Refactor the router",
        icon: "chat",
        detail: "now",
    },
    {
        kind: "item",
        id: "two",
        label: "Address local sessions by URL through a cloud-shaped router",
        icon: "chat",
        detail: "12m",
    },
    { kind: "separator" },
    { kind: "label", label: "Closed" },
    {
        kind: "item",
        id: "three",
        label: "Fix the flaky upload test",
        icon: "archive",
        detail: "3h",
    },
    {
        kind: "item",
        id: "four",
        label: "Weekly plan usage",
        icon: "archive",
        detail: "10/19",
    },
];

const textOnly: MenuItem[] = [
    { kind: "item", id: "rename", label: "Rename" },
    { kind: "item", id: "duplicate", label: "Duplicate", shortcut: "⌘D" },
    { kind: "item", id: "archive", label: "Archive" },
    { kind: "separator" },
    { kind: "item", id: "leave", label: "Leave channel", danger: true },
];

const states: MenuItem[] = [
    { kind: "item", id: "reply", label: "Reply", icon: "reply" },
    {
        kind: "item",
        id: "pin",
        label: "Pin (disabled)",
        icon: "star",
        disabled: true,
    },
    { kind: "item", id: "notifications", label: "Notifications", checked: true },
    { kind: "item", id: "muted", label: "Muted", checked: false },
    { kind: "separator" },
    { kind: "item", id: "remove", label: "Remove", icon: "close", danger: true },
];

/* A task row's menu in the sidebar: the plus, the link, the pencil, and the cross
   share the icon column with a framed outline glyph, each on its own keyline. */
const taskRow: MenuItem[] = [
    { kind: "item", id: "surface", label: "Add to top of sidebar", icon: "plus" },
    { kind: "item", id: "link", label: "Copy link to task", icon: "link" },
    { kind: "separator" },
    { kind: "item", id: "rename", label: "Rename task", icon: "edit" },
    { kind: "item", id: "leave", label: "Leave task", icon: "close" },
    { kind: "separator" },
    {
        kind: "item",
        id: "archive",
        label: "Archive task",
        icon: "archive",
        danger: true,
    },
];

/* Starting something and changing something are two glyphs: the pencil leaving
   its frame says new, the bare pencil says modify what is already there. */
const createAndModify: MenuItem[] = [
    { kind: "item", id: "message", label: "New message", icon: "compose" },
    {
        kind: "item",
        id: "conversation",
        label: "Start a conversation",
        icon: "compose",
    },
    { kind: "separator" },
    { kind: "item", id: "rename", label: "Rename conversation", icon: "edit" },
    { kind: "item", id: "edit", label: "Edit message", icon: "edit" },
];

/** Every kind of row a pointer menu can hold, in one Radix menu. */
const everyRow: MenuItem[] = [
    { kind: "label", label: "Message" },
    { kind: "item", id: "reply", label: "Reply", icon: "reply", shortcut: "⌘R" },
    { kind: "item", id: "copy", label: "Copy link", icon: "link", detail: "12m" },
    {
        kind: "item",
        id: "pin",
        label: "Pin (disabled)",
        icon: "star",
        disabled: true,
    },
    { kind: "separator" },
    { kind: "label", label: "Notify me" },
    { kind: "item", id: "notifications", label: "Notifications", checked: true },
    { kind: "item", id: "muted", label: "Muted", checked: false },
    { kind: "separator" },
    {
        kind: "item",
        id: "delete",
        label: "Delete message",
        icon: "close",
        danger: true,
    },
];

const linkPlaces: MenuItem[] = [
    {
        kind: "item",
        id: "browser",
        label: "Open in browser",
        icon: "open-external",
    },
    {
        kind: "item",
        id: "panel",
        label: "Open in side panel",
        icon: "panel-expand",
    },
];

/** A dashed box that opens a menu wherever it is right-clicked. */
function RightClickArea(props: {
    chosen: string | undefined;
    onOpen: (at: { x: number; y: number }) => void;
    children: ReactNode;
}) {
    return (
        <div
            className="flex h-30 w-80 items-center justify-center rounded-lg border border-dashed border-border font-sans text-sm text-muted-foreground"
            onContextMenu={(event) => {
                event.preventDefault();
                props.onOpen({ x: event.clientX, y: event.clientY });
            }}
        >
            {props.chosen === undefined
                ? "Right-click anywhere in this box"
                : `Chose: ${props.chosen}`}
            {props.children}
        </div>
    );
}

/**
 * The pointer-anchored menu, opened live: it is fixed to the window and
 * stays inside its edges, which a card on the page cannot show at rest.
 */
function ContextMenuSpecimen() {
    const [menuAt, setMenuAt] = useState<{ x: number; y: number }>();
    const [chosen, setChosen] = useState<string>();
    return (
        <RightClickArea chosen={chosen} onOpen={setMenuAt}>
            {menuAt ? (
                <LinkContextMenu
                    href="https://example.com/destination?from=menu#details"
                    items={linkPlaces}
                    onClose={() => setMenuAt(undefined)}
                    onSelect={(id) => {
                        setMenuAt(undefined);
                        setChosen(id);
                    }}
                    x={menuAt.x}
                    y={menuAt.y}
                />
            ) : null}
        </RightClickArea>
    );
}

/** Labels, icons, a detail, a shortcut, a disabled row, check rows, and a danger row. */
function EveryRowSpecimen() {
    const [menuAt, setMenuAt] = useState<{ x: number; y: number }>();
    const [chosen, setChosen] = useState<string>();
    return (
        <RightClickArea chosen={chosen} onOpen={setMenuAt}>
            {menuAt ? (
                <ContextMenu
                    items={everyRow}
                    onClose={() => setMenuAt(undefined)}
                    onSelect={(id) => {
                        setMenuAt(undefined);
                        setChosen(id);
                    }}
                    width={232}
                    x={menuAt.x}
                    y={menuAt.y}
                />
            ) : null}
        </RightClickArea>
    );
}

function LinkMenuSpecimen() {
    const [clicks, setClicks] = useState(0);
    return (
        <div className="h-48 w-90">
            <AppShell embedded onClick={() => setClicks((count) => count + 1)}>
                <div className="flex flex-col gap-4 p-6">
                    <a href="https://example.com/destination?from=menu#details">
                        <strong>Right-click this link label</strong>
                    </a>
                    <a href="happy://agents/example/files/docs/plan.md#L12-L15">Happy file link</a>
                    <a href="docs/plan.md#L12-L15">Workspace file link</a>
                    <output>Shell clicks: {clicks}</output>
                </div>
            </AppShell>
        </div>
    );
}

/** The file viewer's Open menu, with a host that can reveal and open files. */
function FileActionsSpecimen() {
    const [action, setAction] = useState<string>();
    const reveal: FileReveal = {
        label: "Show in Finder",
        openWith: {
            targets: [
                { id: "default", label: "Default app", acceptsFolders: true },
                { id: "vscode", label: "VS Code", acceptsFolders: true },
                { id: "fails", label: "An app that refuses", acceptsFolders: false },
            ],
            open: async (path, target) => {
                if (target.id === "fails") throw new Error(`${target.label} could not open it.`);
                setAction(`Open with ${target.label}: ${path}`);
            },
        },
        path: (path) => setAction(`Show in Finder: ${path}`),
        link: (link) => setAction(`Show in Finder: ${link.path}`),
    };
    return (
        <FileRevealContext.Provider value={reveal}>
            <div className="flex flex-col items-start gap-3 font-sans text-sm text-muted-foreground">
                <FileActionsMenu
                    onDownload={() => setAction("Save as…")}
                    onOpenInTab={() => setAction("Open in main tab")}
                    onShowChanges={() => setAction("Show changes")}
                    path="docs/notes/file-viewer.md"
                    text="# Notes"
                />
                <FileActionsMenu disabled path="docs/notes/disabled.md" />
                <span>{action ?? "No action yet"}</span>
            </div>
        </FileRevealContext.Provider>
    );
}

export function MenuPage() {
    return (
        <ComponentPage
            number={componentNumber}
            summary="shadcn DropdownMenu look — popover card, accent-highlighted rows, icon column, KeyCap shortcuts, muted section labels, destructive rows, trailing checks, and hairline separators. ContextMenu opens the same menu at the pointer as a Radix menu."
            title="Menu"
        >
            <div className="specimen-grid">
                <Specimen
                    detail="220px default width · icon column · ⌘ shortcuts · destructive row"
                    label="Context menu"
                    number="M-01"
                    stage="app"
                >
                    <div className="flex flex-col gap-2 p-7">
                        <div className="w-55">
                            <DimensionRule label="width 220" />
                        </div>
                        <Menu items={messageActions} />
                    </div>
                </Specimen>

                <Specimen
                    detail="section labels · separators · disabled row"
                    label="Grouped"
                    number="M-02"
                    stage="app"
                >
                    <div className="p-7">
                        <Menu items={grouped} width={224} />
                    </div>
                </Specimen>
            </div>

            <div className="specimen-grid">
                <Specimen
                    detail="no icons — no icon column reserved"
                    label="Text only"
                    number="M-03"
                    stage="app"
                >
                    <div className="flex flex-col gap-2 p-7">
                        <div className="w-48">
                            <DimensionRule label="width 192" />
                        </div>
                        <Menu items={textOnly} width={192} />
                    </div>
                </Specimen>

                <Specimen
                    detail="resting · disabled (50%) · checked and unchecked rows · destructive row"
                    label="States"
                    number="M-04"
                    stage="app"
                >
                    <div className="p-7">
                        <Menu items={states} width={200} />
                    </div>
                </Specimen>

                <Specimen
                    detail="opened at the pointer · fixed to the window · flips and shifts to stay inside it · Escape, Tab, or a click elsewhere closes"
                    label="Context menu at the pointer"
                    number="M-05"
                    stage="app"
                >
                    <div className="p-7">
                        <ContextMenuSpecimen />
                    </div>
                </Specimen>

                <Specimen
                    detail="plus 10.5 · pencil 13 · cross 9 · framed 13–14 px of ink — every glyph centred in its 16px slot"
                    label="Icon column"
                    number="M-06"
                    stage="app"
                >
                    <div className="p-7">
                        <Menu items={taskRow} width={200} />
                    </div>
                </Specimen>

                <Specimen
                    detail="right-click a link or its nested label · copy its destination · custom schemes and file fragments stay intact"
                    label="Copy link in the app shell"
                    number="M-08"
                    stage="app"
                >
                    <LinkMenuSpecimen />
                </Specimen>

                <Specimen
                    detail="compose starts something new · edit changes what exists — compose centres its frame, the pencil overshoots"
                    label="Create and modify"
                    number="M-07"
                    stage="app"
                >
                    <div className="p-7">
                        <Menu items={createAndModify} width={220} />
                    </div>
                </Specimen>

                <Specimen
                    detail="a quiet word after the name, such as when · muted, tabular figures · stays whole while a long name ends in an ellipsis before it"
                    label="Rows with a detail"
                    number="M-09"
                    stage="app"
                >
                    <div className="flex flex-col gap-2 p-7">
                        <Menu items={dated} label="Chats" width={300} />
                        <DimensionRule label="width 300 · fixed heading over the scrolling rows" />
                    </div>
                </Specimen>

                <Specimen
                    detail="labels · icons · detail · shortcut · disabled · checked and unchecked · destructive — arrows wrap, typeahead jumps"
                    label="Every row at the pointer"
                    number="M-10"
                    stage="app"
                >
                    <div className="p-7">
                        <EveryRowSpecimen />
                    </div>
                </Specimen>

                <Specimen
                    detail="secondary trigger · spinner while an action runs · alert glyph after a failure · disabled trigger"
                    label="File actions"
                    number="M-11"
                    stage="app"
                >
                    <div className="p-7">
                        <FileActionsSpecimen />
                    </div>
                </Specimen>
            </div>
        </ComponentPage>
    );
}
