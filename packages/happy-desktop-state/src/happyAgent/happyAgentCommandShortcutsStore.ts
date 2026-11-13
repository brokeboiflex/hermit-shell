declare const shortcutIdBrand: unique symbol;
export type HappyAgentCommandShortcutId = string & { readonly [shortcutIdBrand]: true };

export interface HappyAgentCommandShortcut {
    readonly id: HappyAgentCommandShortcutId;
    readonly name: string;
    readonly command: string;
}

export interface HappyAgentCommandShortcutDraft {
    readonly id?: HappyAgentCommandShortcutId;
    readonly name: string;
    readonly command: string;
    readonly error?: string;
}

export interface HappyAgentCommandShortcutsSnapshot {
    readonly shortcuts: readonly HappyAgentCommandShortcut[];
    readonly draft?: HappyAgentCommandShortcutDraft;
}

export interface HappyAgentCommandShortcutsStore {
    get(): HappyAgentCommandShortcutsSnapshot;
    subscribe(listener: () => void): () => void;
    shortcutCreateOpen(): void;
    shortcutEditOpen(id: HappyAgentCommandShortcutId): void;
    shortcutEditorClose(): void;
    shortcutNameUpdate(name: string): void;
    shortcutCommandUpdate(command: string): void;
    shortcutSave(): void;
    shortcutRemove(id: HappyAgentCommandShortcutId): void;
}

export type HappyAgentCommandShortcutsOutput = {
    readonly type: "shortcutsUpdated";
    readonly shortcuts: readonly HappyAgentCommandShortcut[];
};

/** One project's pinned commands. Construction opens no resources and executes nothing. */
export function happyAgentCommandShortcutsStoreCreate(
    input: {
        readonly initial?: readonly HappyAgentCommandShortcut[];
        readonly output?: (event: HappyAgentCommandShortcutsOutput) => void;
    } = {},
): HappyAgentCommandShortcutsStore {
    let snapshot: HappyAgentCommandShortcutsSnapshot = { shortcuts: input.initial ?? [] };
    const listeners = new Set<() => void>();
    const set = (next: HappyAgentCommandShortcutsSnapshot): void => {
        snapshot = next;
        for (const listener of listeners) listener();
    };
    const shortcutsWrite = (shortcuts: readonly HappyAgentCommandShortcut[]): void => {
        set({ shortcuts });
        input.output?.({ type: "shortcutsUpdated", shortcuts });
    };
    return {
        get: () => snapshot,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        shortcutCreateOpen() {
            set({ ...snapshot, draft: { name: "", command: "" } });
        },
        shortcutEditOpen(id) {
            const shortcut = snapshot.shortcuts.find((item) => item.id === id);
            if (shortcut) set({ ...snapshot, draft: { ...shortcut } });
        },
        shortcutEditorClose() {
            if (snapshot.draft) set({ shortcuts: snapshot.shortcuts });
        },
        shortcutNameUpdate(name) {
            if (snapshot.draft)
                set({ ...snapshot, draft: { ...snapshot.draft, name, error: undefined } });
        },
        shortcutCommandUpdate(command) {
            if (snapshot.draft)
                set({ ...snapshot, draft: { ...snapshot.draft, command, error: undefined } });
        },
        shortcutSave() {
            const draft = snapshot.draft;
            if (!draft) return;
            const name = draft.name.trim();
            if (!name || !draft.command.trim()) {
                set({ ...snapshot, draft: { ...draft, error: "Enter a name and a command." } });
                return;
            }
            const shortcut: HappyAgentCommandShortcut = {
                id: draft.id ?? (`shortcut_${crypto.randomUUID()}` as HappyAgentCommandShortcutId),
                name,
                command: draft.command,
            };
            shortcutsWrite(
                draft.id
                    ? snapshot.shortcuts.map((item) => (item.id === draft.id ? shortcut : item))
                    : [...snapshot.shortcuts, shortcut],
            );
        },
        shortcutRemove(id) {
            if (!snapshot.shortcuts.some((item) => item.id === id)) return;
            shortcutsWrite(snapshot.shortcuts.filter((item) => item.id !== id));
        },
    };
}

/** Read only complete commands from the local preferences boundary; never repair a command. */
export function happyAgentCommandShortcutsParse(
    value: unknown,
): readonly HappyAgentCommandShortcut[] {
    if (!Array.isArray(value)) return [];
    const shortcuts: HappyAgentCommandShortcut[] = [];
    for (const candidate of value) {
        if (typeof candidate !== "object" || candidate === null) continue;
        const raw = candidate as Record<string, unknown>;
        if (
            typeof raw.id !== "string" ||
            !raw.id ||
            typeof raw.name !== "string" ||
            !raw.name.trim() ||
            typeof raw.command !== "string" ||
            !raw.command.trim() ||
            shortcuts.some((item) => item.id === raw.id)
        )
            continue;
        shortcuts.push({
            id: raw.id as HappyAgentCommandShortcutId,
            name: raw.name,
            command: raw.command,
        });
    }
    return shortcuts;
}
