import { useSyncExternalStore } from "react";
import type {
    HappyAgentCommandShortcut,
    HappyAgentCommandShortcutsStore,
} from "happy-desktop-state";
import { ProjectCommandShortcuts } from "happy-desktop-ui";

export function AppProjectCommandShortcuts(props: {
    readonly store: HappyAgentCommandShortcutsStore;
    readonly unavailable?: string;
    readonly onRun: (shortcut: HappyAgentCommandShortcut) => void;
}) {
    const { store } = props;
    const snapshot = useSyncExternalStore(store.subscribe, store.get, store.get);
    return (
        <ProjectCommandShortcuts
            snapshot={snapshot}
            unavailable={props.unavailable}
            onCreate={store.shortcutCreateOpen}
            onEdit={store.shortcutEditOpen}
            onRemove={store.shortcutRemove}
            onNameChange={store.shortcutNameUpdate}
            onCommandChange={store.shortcutCommandUpdate}
            onSave={store.shortcutSave}
            onEditorClose={store.shortcutEditorClose}
            onRun={(id) => {
                if (props.unavailable !== undefined) return;
                const shortcut = store.get().shortcuts.find((entry) => entry.id === id);
                if (shortcut) props.onRun(shortcut);
            }}
        />
    );
}
