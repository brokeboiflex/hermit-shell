import { useState, useSyncExternalStore } from "react";
import { happyAgentCommandShortcutsStoreOwnedCreate } from "happy-desktop-state";
import { ProjectCommandShortcuts } from "../../src/ProjectCommandShortcuts";

const TASKS_SAMPLE = `{
	// Shared with VS Code, Cursor and Zed.
	"version": "2.0.0",
	"tasks": [
		{ "label": "Launch app", "type": "shell", "command": "pnpm dev" },
		{ "label": "Check types", "type": "shell", "command": "pnpm", "args": ["typecheck"] }
	]
}
`;

export function ProjectCommandShortcutsExample(props: { empty?: boolean; unavailable?: string }) {
    const [store] = useState(() => {
        // The page is its own checkout: every write is accepted as written.
        let revision = 0;
        const owned = happyAgentCommandShortcutsStoreOwnedCreate({
            output: (event) =>
                owned.writer.tasksFileWriteSucceeded({
                    type: "present",
                    content: event.content,
                    hash: String((revision += 1)),
                }),
        });
        owned.writer.tasksFileRead(
            props.empty
                ? { type: "missing" }
                : { type: "present", content: TASKS_SAMPLE, hash: String(revision) },
        );
        return owned.store;
    });
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
            onRun={() => undefined}
        />
    );
}
