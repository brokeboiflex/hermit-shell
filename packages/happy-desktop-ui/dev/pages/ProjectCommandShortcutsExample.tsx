import { useState, useSyncExternalStore } from "react";
import {
    happyAgentCommandShortcutsStoreCreate,
    type HappyAgentCommandShortcutId,
} from "happy-desktop-state";
import { ProjectCommandShortcuts } from "../../src/ProjectCommandShortcuts";

export function ProjectCommandShortcutsExample(props: { empty?: boolean; unavailable?: string }) {
    const [store] = useState(() => {
        const store = happyAgentCommandShortcutsStoreCreate({
            initial: props.empty
                ? []
                : [
                      {
                          id: "launch" as HappyAgentCommandShortcutId,
                          name: "Launch app",
                          command: "pnpm dev",
                      },
                      {
                          id: "check" as HappyAgentCommandShortcutId,
                          name: "Check types",
                          command: "pnpm typecheck",
                      },
                  ],
        });
        return store;
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
