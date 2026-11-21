import { useCallback, type CSSProperties } from "react";
import type { ComposerCommand } from "happy-desktop-state";
import { Command, CommandGroup, CommandItem, CommandList } from "./components/ui/command";
import { Icon, type IconName } from "./Icon";
import { cn } from "./lib/utils";

export type CommandPickerItem = {
    id: string;
    /** How the command is typed, e.g. `/model`. */
    slash: string;
    /** What it does, in a few words. */
    description: string;
    icon: IconName;
};

export type CommandPickerProps = {
    items: readonly CommandPickerItem[];
    /** The highlighted row; the owner moves it with the arrow keys. */
    activeId?: string;
    /** Section heading above the rows (default "Commands"). */
    label?: string;
    onSelect: (id: string) => void;
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
};

/**
 * C-152 CommandPicker — the slash-command popover for the composer, on
 * shadcn's Command (cmdk). It is the same kind of surface as the mention
 * picker beside it, not a ⌘K palette: no search field of its own (the draft is
 * the query), no scrim, and one row per command under a quiet group heading,
 * so a dozen of them read as a short menu rather than a page of cards. It
 * spans the composer it belongs to, and each row is one line: glyph, command,
 * then what it does in muted ink.
 *
 * Props only — the owner filters, highlights, and commits. cmdk is therefore
 * told not to filter (`shouldFilter={false}`), its selection is the owner's
 * `activeId` (`value`), and the pointer does not move it
 * (`disablePointerSelection`): keys go to the composer's textarea, never into
 * this list, and Enter is the owner's to dispatch. A click on a row selects it.
 */
export function CommandPicker(props: CommandPickerProps) {
    // Focus stays in the composer textarea while the owner moves this visual
    // highlight. Attach a stable ref only to the active row so each keyboard
    // move brings that row into the nearest visible part of the scrollport
    // without moving DOM focus away from the draft. (cmdk scrolls only after
    // its own key handling, which never runs here.)
    const activeRowRef = useCallback((element: HTMLDivElement | null) => {
        element?.scrollIntoView({ block: "nearest" });
    }, []);
    const label = props.label ?? "Commands";
    return (
        <Command
            className={cn(
                "happy-command-picker h-auto max-h-80 w-full rounded-xl p-0 font-sans ring-1 ring-foreground/10",
                props.className,
            )}
            data-happy-desktop-ui="command-picker"
            data-testid={props["data-testid"]}
            disablePointerSelection
            label={label}
            shouldFilter={false}
            style={props.style}
            value={props.activeId ?? ""}
        >
            {/* The list is the scrollport: edge to edge in the card, with the
                browser's own bar and no spacing of its own; the group inside
                it owns the inset. */}
            <CommandList
                className="happy-command-picker__list max-h-none min-h-0 flex-auto"
                data-happy-desktop-ui="command-picker-list"
                data-scrollbar-axes="vertical"
                data-scrollbar-viewport=""
                label={label}
            >
                <CommandGroup
                    className="happy-command-picker__group"
                    data-happy-desktop-ui="command-picker-group"
                    heading={label}
                >
                    {props.items.map((item) => {
                        const active = item.id === props.activeId;
                        return (
                            <CommandItem
                                className="happy-command-picker__row cursor-pointer hover:data-[selected=false]:bg-muted/50"
                                data-active={active ? "" : undefined}
                                data-command-id={item.id}
                                data-happy-desktop-ui="command-picker-row"
                                key={item.id}
                                onSelect={() => props.onSelect(item.id)}
                                ref={active ? activeRowRef : undefined}
                                value={item.id}
                            >
                                <span
                                    aria-hidden="true"
                                    className="happy-command-picker__icon flex flex-none text-muted-foreground group-data-selected/command-item:text-foreground"
                                    data-happy-desktop-ui="command-picker-icon"
                                >
                                    <Icon name={item.icon} size={16} />
                                </span>
                                <span
                                    className="happy-command-picker__slash flex-none font-medium whitespace-nowrap"
                                    data-happy-desktop-ui="command-picker-slash"
                                >
                                    {item.slash}
                                </span>
                                <span
                                    className="happy-command-picker__description min-w-0 flex-auto truncate text-muted-foreground"
                                    data-happy-desktop-ui="command-picker-description"
                                >
                                    {item.description}
                                </span>
                            </CommandItem>
                        );
                    })}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}

type CommandMeta = { description: string; icon: IconName };

/**
 * How each Happy Agent session command reads in the picker. A command the composer offers
 * but this table does not know still appears, wearing its own label.
 */
const COMMAND_META: Record<string, CommandMeta> = {
    model: { description: "Choose the model and provider", icon: "spark" },
    effort: { description: "Change the reasoning level", icon: "zap" },
    permissions: {
        description: "Choose filesystem and shell access",
        icon: "shield",
    },
    fast: { description: "Toggle fastest inference", icon: "zap" },
    usage: { description: "Token usage for the session", icon: "clock" },
    tasks: { description: "Show the session task list", icon: "tasks" },
    agents: { description: "Monitor delegated subagents", icon: "users" },
    goal: { description: "Show the persistent goal", icon: "star" },
    ps: { description: "List running background terminals", icon: "terminal" },
    compact: {
        description: "Summarize older messages to free context",
        icon: "filter",
    },
    abort: { description: "Stop the current response", icon: "close" },
};

/** Presents the composer's supported commands as picker rows, in the order given. */
export function commandPickerItems(
    commands: readonly ComposerCommand[],
): readonly CommandPickerItem[] {
    return commands.map((command) => {
        const meta = COMMAND_META[command.id];
        return {
            id: command.id,
            slash: command.label.startsWith("/") ? command.label : `/${command.id}`,
            description: command.description ?? meta?.description ?? "",
            icon: meta?.icon ?? "spark",
        };
    });
}
