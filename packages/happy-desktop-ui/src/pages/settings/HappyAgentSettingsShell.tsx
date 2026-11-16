import type { ReactNode } from "react";
import { APP_SHELL_SIDEBAR_DEFAULT_WIDTH, AppShell } from "../../AppShell";
import { Box } from "../../Box";
import { Icon, type IconName } from "../../Icon";
import { PanelHeader } from "../../PanelHeader";
import { ScrollArea } from "../../Scrollbar";
import { Sidebar, type SidebarSection } from "../../Sidebar";

export interface HappyAgentSettingsCategory {
    readonly id: string;
    readonly label: string;
    readonly icon: IconName;
    /**
     * The heading of the block this category is listed in. Consecutive
     * categories with the same group share one block; absent lists the category
     * in an unheaded block, as the window's first, everyday categories are.
     */
    readonly group?: string;
}

export type HappyAgentSettingsShellProps = {
    activeCategoryId: string;
    categories: readonly HappyAgentSettingsCategory[];
    children: ReactNode;
    /** The open category's own subtitle, shown under its title. */
    description?: string;
    onCategorySelect: (id: string) => void;
    /** Leaves settings and returns to the workspace. */
    onClose: () => void;
    /**
     * Present on a page opened from inside the category: the band above the
     * page carries a control back to the category.
     */
    onBack?: () => void;
    title: string;
    /** Native macOS window chrome, matching the workspace shell it replaces. */
    windowControls?: boolean;
    windowFullScreen?: boolean;
    windowTrafficLights?: boolean;
    /** A connection rail holds the window's left edge; see `AppShell`. */
    connectionRail?: boolean;
    /** The workspace sidebar's width, so opening Settings does not move the column. */
    sidebarWidth?: number;
};

/** The column's first row, which leaves settings; no category may take this id. */
const BACK_TO_APP_ID = "happy-agent-settings:back-to-app";

/**
 * The local workspace's settings window: a permanent category column beside one
 * category's page.
 *
 * The column is not the workspace sidebar and does not collapse — settings is a
 * two-pane place with nothing to gain from hiding half of it. Its first row is
 * the way back out, a row like the categories under it, so the column reads as
 * one list of places. The page leads with the category's title and subtitle on
 * the content column, above its sections, and the band above it is left to the
 * window's drag lane and, on a page inside a category, the way back to it.
 */
export function HappyAgentSettingsShell(props: HappyAgentSettingsShellProps) {
    return (
        <AppShell
            windowControls={props.windowControls}
            windowFullScreen={props.windowFullScreen}
            windowTrafficLights={props.windowTrafficLights}
            connectionRail={props.connectionRail}
            sidebarDefaultWidth={props.sidebarWidth ?? APP_SHELL_SIDEBAR_DEFAULT_WIDTH}
            sidebar={
                <Sidebar
                    activeItemId={props.activeCategoryId}
                    className="happy-agent-settings__nav"
                    onItemSelect={(id) =>
                        id === BACK_TO_APP_ID ? props.onClose() : props.onCategorySelect(id)
                    }
                    sections={[
                        {
                            id: "back-to-app",
                            items: [
                                {
                                    icon: "chevron-left",
                                    id: BACK_TO_APP_ID,
                                    kind: "view",
                                    label: "Back to app",
                                },
                            ],
                        },
                        ...categorySections(props.categories),
                    ]}
                />
            }
        >
            <PanelHeader className="happy-agent-settings__header">
                {props.onBack ? (
                    <button
                        className="happy-agent-settings__back"
                        data-happy-desktop-ui="happy-agent-settings-back"
                        onClick={props.onBack}
                        type="button"
                    >
                        <Icon name="chevron-left" size={16} />
                        <span>{categoryLabel(props)}</span>
                    </button>
                ) : null}
            </PanelHeader>
            <ScrollArea
                className="happy-agent-settings__body"
                data-happy-desktop-ui="happy-agent-settings-body"
                viewportClassName="happy-agent-settings__body-viewport"
            >
                <Box className="happy-agent-settings__content">
                    <Box className="happy-agent-settings__heading">
                        <h1
                            className="happy-agent-settings__heading-title"
                            data-happy-desktop-ui="happy-agent-settings-heading-title"
                        >
                            {props.title}
                        </h1>
                        {props.description ? (
                            <p
                                className="happy-agent-settings__heading-description"
                                data-happy-desktop-ui="happy-agent-settings-heading-description"
                            >
                                {props.description}
                            </p>
                        ) : null}
                    </Box>
                    {props.children}
                </Box>
            </ScrollArea>
        </AppShell>
    );
}

/**
 * The column's blocks: each run of consecutive categories that share a group
 * becomes one section under that group's heading, in the order given.
 */
function categorySections(categories: readonly HappyAgentSettingsCategory[]): SidebarSection[] {
    const sections: SidebarSection[] = [];
    for (const category of categories) {
        const item = {
            icon: category.icon,
            id: category.id,
            kind: "view" as const,
            label: category.label,
        };
        const last = sections.at(-1);
        if (last !== undefined && last.label === category.group) last.items.push(item);
        else
            sections.push({
                // Named by its group, so filtering categories never renames a
                // block; a group listed apart twice numbers its second block.
                id: `categories:${category.group ?? ""}:${String(
                    sections.filter((section) => section.label === category.group).length,
                )}`,
                items: [item],
                ...(category.group === undefined ? {} : { label: category.group }),
            });
    }
    return sections;
}

function categoryLabel(props: HappyAgentSettingsShellProps): string {
    return (
        props.categories.find((category) => category.id === props.activeCategoryId)?.label ??
        "Settings"
    );
}

export interface HappyAgentSettingsSectionProps {
    children: ReactNode;
    description?: string;
    /**
     * `form` puts the children in one inset group, as rows split by hairlines.
     * `cards` stacks free-standing blocks with a gap instead — notices, editors,
     * and `HappyAgentSettingsGroup`s the section composes itself.
     */
    rows?: "form" | "cards";
    /**
     * Omitted when the category's own header already names the block — the
     * first section of a one-subject category would otherwise repeat the title
     * printed directly above it.
     */
    title?: string;
}

/** One block of settings rows inside a category body, titled or not: a heading over its group. */
export function HappyAgentSettingsSection(props: HappyAgentSettingsSectionProps) {
    return (
        <section
            className="happy-agent-settings__section"
            data-happy-desktop-ui="happy-agent-settings-section"
        >
            {props.title === undefined && props.description === undefined ? null : (
                <Box className="happy-agent-settings__section-heading">
                    {props.title === undefined ? null : (
                        <h2
                            className="happy-agent-settings__section-title"
                            data-happy-desktop-ui="happy-agent-settings-section-title"
                        >
                            {props.title}
                        </h2>
                    )}
                    {props.description ? (
                        <p
                            className="happy-agent-settings__section-description"
                            data-happy-desktop-ui="happy-agent-settings-section-description"
                        >
                            {props.description}
                        </p>
                    ) : null}
                </Box>
            )}
            {props.rows === "cards" ? (
                <Box className="happy-agent-settings__section-rows" data-rows="cards">
                    {props.children}
                </Box>
            ) : (
                <HappyAgentSettingsGroup>{props.children}</HappyAgentSettingsGroup>
            )}
        </section>
    );
}

export interface HappyAgentSettingsGroupProps {
    children: ReactNode;
}

/**
 * The inset group settings rows sit in, as the native clients draw theirs: one
 * rounded card on the grouped background, its rows split by hairlines. A row
 * owns its hairline, and the group hides the last one so the card's own edge
 * closes it.
 */
export function HappyAgentSettingsGroup(props: HappyAgentSettingsGroupProps) {
    return (
        <Box
            className="happy-agent-settings__group"
            data-happy-desktop-ui="happy-agent-settings-group"
        >
            {props.children}
        </Box>
    );
}
