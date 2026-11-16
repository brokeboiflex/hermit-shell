import type {
    HappyAgentCommandShortcutId,
    HappyAgentCommandShortcutsSnapshot,
} from "happy-desktop-state";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { MenuButton } from "./MenuButton";
import { Modal } from "./Modal";
import { ModalOverlay } from "./ModalOverlay";
import { TextField } from "./TextField";
import { WindowOverlay } from "./WindowOverlay";

export interface ProjectCommandShortcutsProps {
    readonly snapshot: HappyAgentCommandShortcutsSnapshot;
    readonly unavailable?: string;
    readonly onCreate: () => void;
    readonly onEdit: (id: HappyAgentCommandShortcutId) => void;
    readonly onRemove: (id: HappyAgentCommandShortcutId) => void;
    readonly onRun: (id: HappyAgentCommandShortcutId) => void;
    readonly onNameChange: (name: string) => void;
    readonly onCommandChange: (command: string) => void;
    readonly onSave: () => void;
    readonly onEditorClose: () => void;
}

/** A workspace's task-file commands and their editor; execution and persistence belong to the caller. */
export function ProjectCommandShortcuts(props: ProjectCommandShortcutsProps) {
    const { shortcuts, draft, problem } = props.snapshot;
    return (
        <section
            className="happy-command-shortcuts"
            aria-label={
                props.unavailable ? `Project shortcuts. ${props.unavailable}` : "Project shortcuts"
            }
            data-happy-desktop-ui="project-command-shortcuts"
        >
            <div className="happy-command-shortcuts__heading">
                <span>Shortcuts</span>
                <Button
                    aria-label="Add shortcut"
                    icon="plus"
                    iconOnly
                    onClick={props.onCreate}
                    size="small"
                    variant="ghost"
                />
            </div>
            {problem ? <p className="happy-command-shortcuts__problem">{problem}</p> : null}
            {shortcuts.map((shortcut) => (
                <div className="happy-command-shortcuts__row" key={shortcut.id}>
                    <button
                        className="happy-command-shortcuts__run"
                        disabled={props.unavailable !== undefined}
                        onClick={() => props.onRun(shortcut.id)}
                        title={props.unavailable ?? shortcut.command}
                        type="button"
                    >
                        <Icon name="terminal" size={16} />
                        <span>{shortcut.name}</span>
                    </button>
                    <MenuButton
                        align="end"
                        icon="more"
                        items={[
                            { kind: "item", id: "edit", label: "Edit shortcut", icon: "edit" },
                            {
                                kind: "item",
                                id: "remove",
                                label: "Remove shortcut",
                                icon: "trash",
                                danger: true,
                            },
                        ]}
                        label={`Options for ${shortcut.name}`}
                        onSelect={(id) =>
                            id === "edit" ? props.onEdit(shortcut.id) : props.onRemove(shortcut.id)
                        }
                        overlay
                        size="small"
                        variant="ghost"
                    />
                </div>
            ))}
            {shortcuts.length === 0 ? (
                <button
                    className="happy-command-shortcuts__run"
                    onClick={props.onCreate}
                    type="button"
                >
                    <Icon name="terminal" size={16} />
                    <span>Add a command</span>
                </button>
            ) : null}
            {draft ? (
                <WindowOverlay>
                    <ModalOverlay onEscape={props.onEditorClose}>
                        <Modal
                            title={draft.id ? "Edit shortcut" : "Add shortcut"}
                            onClose={props.onEditorClose}
                            footer={
                                <>
                                    <Button onClick={props.onEditorClose} variant="ghost">
                                        Cancel
                                    </Button>
                                    <Button loading={draft.saving} onClick={props.onSave}>
                                        Save shortcut
                                    </Button>
                                </>
                            }
                        >
                            <div className="happy-command-shortcuts__form">
                                <TextField
                                    autoFocus
                                    fullWidth
                                    label="Name"
                                    placeholder="Launch app"
                                    value={draft.name}
                                    onValueChange={props.onNameChange}
                                />
                                <TextField
                                    fullWidth
                                    label="Command"
                                    placeholder="pnpm dev"
                                    multiline
                                    rows={4}
                                    value={draft.command}
                                    onValueChange={props.onCommandChange}
                                    error={draft.error}
                                    hint="Saved in .vscode/tasks.json. Runs in the active workspace; output opens in a terminal."
                                />
                            </div>
                        </Modal>
                    </ModalOverlay>
                </WindowOverlay>
            ) : null}
        </section>
    );
}
