import { useState, type ReactNode } from "react";
import { AppShell } from "../../src/AppShell";
import { Button } from "../../src/Button";
import { EmptyState } from "../../src/EmptyState";
import { commandShortcut } from "../../src/keyboardShortcut";
import { PanelNewTab, type PanelNewTabItem } from "../../src/PanelNewTab";
import { TabbedPane } from "../../src/TabbedPane";
import type { TabItem } from "../../src/Tabs";
import { ComponentPage, DimensionRule, FullScreenSpecimen, Specimen } from "../kit";

/** The component plan this page documents. The selector and the page header read the same value. */
export const componentNumber = "C-352";

const ITEMS: readonly PanelNewTabItem[] = [
    { id: "terminal", icon: "terminal", label: "Terminal" },
    { id: "files", icon: "files", label: "Files" },
    { id: "chat", icon: "chat", label: "Side chat" },
    { id: "artifact", icon: "package", label: "Artifact" },
    { id: "artifacts", icon: "list", label: "Artifacts" },
    { id: "activity", icon: "agents", label: "Activity" },
    { id: "usage", icon: "clock", label: "Usage" },
    { id: "devices", icon: "link", label: "Devices" },
];

const PINNED = ["terminal", "files", "chat", "artifact"];

const FILES = [
    "packages/happy-desktop-ui/src/PanelNewTab.tsx",
    "packages/happy-desktop-ui/src/styles/panel-new-tab.css",
    "packages/happy-desktop-ui/src/PanelHeader.tsx",
    "packages/happy-desktop-state/src/happyAgent/happyAgentPanelStore.ts",
];

const RECENT = [
    { url: "http://localhost:5173/", label: "Happy — local" },
    { url: "https://github.com/slopus/happy", label: "slopus/happy" },
];

/** The shortcut cap each of the pane's first tabs wears. */
const tabShortcut = (index: number) => commandShortcut(String(index + 1), { alt: true });

/** A new tab that keeps its pins in local state, so the menu can be tried. */
function NewTab(props: { defaultQuery?: string; pinned?: readonly string[]; searching?: boolean }) {
    const [pinned, pinnedSet] = useState<readonly string[]>(props.pinned ?? PINNED);
    const [query, querySet] = useState(props.defaultQuery ?? "");
    const files = FILES.filter((path) => path.toLowerCase().includes(query.trim().toLowerCase()));
    return (
        <PanelNewTab
            {...(props.defaultQuery === undefined ? {} : { defaultQuery: props.defaultQuery })}
            items={ITEMS}
            onFileOpen={() => undefined}
            onItemOpen={() => undefined}
            onPageOpen={() => undefined}
            onPinnedChange={(id, on) =>
                pinnedSet((current) =>
                    ITEMS.map((item) => item.id).filter((item) =>
                        item === id ? on : current.includes(item),
                    ),
                )
            }
            onSearch={querySet}
            pinned={pinned}
            pinnedLimit={4}
            recentPages={RECENT}
            search={{
                query,
                searching: props.searching === true,
                ...(props.searching ? {} : { files }),
            }}
        />
    );
}

/** The pane as the workspace draws it: card tabs on the band, the active tab's body under it. */
function Pane(props: { tabs: TabItem[]; active: string; children: ReactNode }) {
    return (
        <TabbedPane
            actions={
                <Button aria-label="New tab" icon="plus" iconOnly size="small" variant="ghost" />
            }
            activeId={props.active}
            appearance="card"
            closeLabel="Close tab"
            closeRevealedId={props.active}
            onClose={() => undefined}
            onSelect={() => undefined}
            overflowFade
            size="medium"
            tabs={props.tabs.map((tab, index) => ({
                ...tab,
                shortcut: tabShortcut(index),
            }))}
        >
            {props.children}
        </TabbedPane>
    );
}

const NEW_TAB: TabItem = { id: "new", icon: "globe", label: "New tab" };

export function PanelNewTabPage() {
    return (
        <ComponentPage
            number={componentNumber}
            summary="A side pane's new tab: one field that finds a file or opens a web address, the reader's shortcut tiles under it, and everything else this tab can become a menu away."
            title="Panel new tab"
            width={1328}
        >
            <FullScreenSpecimen
                detail="The pane opens on a new tab. Its band holds card tabs with a key cap and close; the shell's expand and pane toggle sit at the band's far edge."
                label="Side pane"
                number="01"
                screen="side-pane"
                window={{ width: 1280, height: 800 }}
            >
                <AppShell
                    panel={
                        <Pane active="new" tabs={[NEW_TAB]}>
                            <NewTab />
                        </Pane>
                    }
                    panelExpandAction={{ expanded: false, onClick: () => undefined }}
                    panelResizable
                    panelToggleAction={{ open: true, onClick: () => undefined }}
                    panelWidth={760}
                >
                    <EmptyState
                        description="The conversation the pane sits beside."
                        icon="chat"
                        size="panel"
                        title="Main content"
                    />
                </AppShell>
            </FullScreenSpecimen>
            <Specimen
                detail="Several tabs share one width; the selected card is filled and edged, and its close stays up."
                label="Several tabs"
                number="02"
                stage="surface"
            >
                <div style={{ display: "flex", width: "720px", height: "420px" }}>
                    <Pane
                        active="new"
                        tabs={[
                            { id: "files", icon: "files", label: "Files" },
                            { id: "terminal", icon: "terminal", label: "Terminal 1" },
                            { id: "page", icon: "globe", label: "localhost" },
                            NEW_TAB,
                        ]}
                    >
                        <NewTab />
                    </Pane>
                </div>
                <DimensionRule label="tab 200 × 28 · 4 apart · mark 6 from the card's edge" />
            </Specimen>
            <Specimen
                detail="Typing finds files in the checkout and visited pages; an address opens first. The field does not move."
                label="Typed"
                number="03"
                stage="surface"
            >
                <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ display: "flex", width: "560px", height: "460px" }}>
                        <Pane active="new" tabs={[NEW_TAB]}>
                            <NewTab defaultQuery="panel" />
                        </Pane>
                    </div>
                    <div style={{ display: "flex", width: "560px", height: "460px" }}>
                        <Pane active="new" tabs={[NEW_TAB]}>
                            <NewTab defaultQuery="localhost:5173" />
                        </Pane>
                    </div>
                </div>
            </Specimen>
            <Specimen
                detail="A narrow pane keeps the tiles in one row; nothing pinned leaves the heading and its menu."
                label="Narrow · nothing pinned"
                number="04"
                stage="surface"
            >
                <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ display: "flex", width: "360px", height: "420px" }}>
                        <Pane active="new" tabs={[NEW_TAB]}>
                            <NewTab />
                        </Pane>
                    </div>
                    <div style={{ display: "flex", width: "360px", height: "420px" }}>
                        <Pane active="new" tabs={[NEW_TAB]}>
                            <NewTab pinned={[]} />
                        </Pane>
                    </div>
                </div>
            </Specimen>
        </ComponentPage>
    );
}
