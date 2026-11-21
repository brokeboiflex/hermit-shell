import { MenuButton } from "../../src/MenuButton";
import type { MenuItem } from "../../src/Menu";
import { ComponentPage, DimensionRule, Specimen } from "../kit";

/** The component plan this page documents. The selector and the page header read the same value. */
export const componentNumber = "C-027a";

const historyItems: MenuItem[] = [
    { kind: "label", label: "Archived sessions" },
    { kind: "item", id: "session-1", label: "Navigation cleanup", icon: "archive" },
    { kind: "item", id: "session-2", label: "Weekly plan usage", icon: "archive" },
    { kind: "separator" },
    { kind: "label", label: "Recent files" },
    { kind: "item", id: "file-1", label: "/…/navigation/history.ts", icon: "doc" },
    { kind: "item", id: "file-2", label: "/…/ui/AppShell.tsx", icon: "doc" },
];

/** Every row a MenuItem can be: plain, iconned, detailed, with a shortcut, checked, disabled, and destructive. */
const kindItems: MenuItem[] = [
    { kind: "label", label: "Appearance" },
    { kind: "item", id: "light", label: "Light", icon: "sun", checked: false },
    { kind: "item", id: "dark", label: "Dark", icon: "moon", checked: true },
    { kind: "separator" },
    { kind: "item", id: "copy", label: "Copy link", icon: "link", shortcut: "⌘C" },
    { kind: "item", id: "recent", label: "Reopen last chat", icon: "history", detail: "12m" },
    { kind: "item", id: "plain", label: "Rename" },
    { kind: "item", id: "offline", label: "Export (offline)", icon: "archive", disabled: true },
    { kind: "separator" },
    { kind: "item", id: "delete", label: "Delete workspace", icon: "trash", danger: true },
];

export function MenuButtonPage() {
    return (
        <ComponentPage
            number={componentNumber}
            summary="Compact icon action opening shadcn/ui's DropdownMenu of MenuItem rows. Radix places it beside the trigger, moves focus through its rows with the arrow keys, and returns focus to the trigger on Escape and on selection."
            title="Menu button"
        >
            <div className="specimen-grid">
                <Specimen
                    detail="28px icon trigger · end-aligned 300px popover · fixed heading · bounded history pages"
                    label="End aligned"
                    number="MB-01"
                    stage="app"
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            padding: "28px",
                            width: "380px",
                        }}
                    >
                        <MenuButton
                            align="end"
                            icon="history"
                            items={historyItems}
                            label="Open workspace history"
                            menuLabel="Tab history"
                            menuMaxHeight={220}
                            menuPageSize={4}
                            menuWidth={300}
                            onSelect={() => {}}
                        />
                    </div>
                    <DimensionRule label="trigger 28 px · popover 300 px · 4 px corner gap" />
                </Specimen>

                <Specimen
                    detail="disabled trigger · no popover · standard ghost-button treatment"
                    label="Unavailable"
                    number="MB-02"
                    stage="surface"
                >
                    <div style={{ display: "flex", padding: "28px" }}>
                        <MenuButton
                            disabled
                            icon="history"
                            items={historyItems}
                            label="Workspace history unavailable"
                            onSelect={() => {}}
                        />
                    </div>
                </Specimen>
                <Specimen
                    detail="label · checkbox rows · shortcut · detail · plain row inset to the icon column · disabled · destructive"
                    label="Every row kind"
                    number="MB-03"
                    stage="app"
                >
                    <div style={{ display: "flex", padding: "28px" }}>
                        <MenuButton
                            icon="settings"
                            items={kindItems}
                            label="Workspace options"
                            onSelect={() => {}}
                        />
                    </div>
                </Specimen>

                <Specimen
                    detail="named medium trigger · opens above · fixed heading · lazily built rows"
                    label="Named, above"
                    number="MB-04"
                    stage="surface"
                >
                    <div style={{ display: "flex", padding: "220px 28px 28px" }}>
                        <MenuButton
                            icon="question"
                            items={() => historyItems}
                            label="Ask a question"
                            menuLabel="Ask a question"
                            onSelect={() => {}}
                            placement="above"
                            size="medium"
                            text="Ask a question"
                        />
                    </div>
                </Specimen>
            </div>
        </ComponentPage>
    );
}
