import { applyEdits, modify, parse, type FormattingOptions, type ParseError } from "jsonc-parser";

/**
 * Where a checkout's shortcuts live: VS Code's task file, which Cursor,
 * Windsurf and Zed read too, and which agents already know how to edit. The
 * file is the source of truth; Happy shows the tasks it can run as written and
 * edits only those, leaving every other task and comment in place.
 */
export const HAPPY_AGENT_COMMAND_SHORTCUTS_PATH = ".vscode/tasks.json";

const TASKS_VERSION = "2.0.0";
/**
 * Fields that change what a task runs or where it runs. A task using one is not
 * a command Happy can run as written, so it is not offered; on the file's root
 * they apply to every task.
 */
const TASK_FIELDS_UNSUPPORTED = ["options", "osx", "linux", "windows", "dependsOn"] as const;
/** An argument that reads the same under every shell without quoting. */
const ARGUMENT_PLAIN = /^[\w.,/:=@%+-]+$/;

declare const shortcutIdBrand: unique symbol;
/** A task's label, which is its identity in the file. */
export type HappyAgentCommandShortcutId = string & {
    readonly [shortcutIdBrand]: true;
};

export interface HappyAgentCommandShortcut {
    readonly id: HappyAgentCommandShortcutId;
    readonly name: string;
    readonly command: string;
}

export interface HappyAgentCommandShortcutDraft {
    readonly id?: HappyAgentCommandShortcutId;
    readonly name: string;
    readonly command: string;
    readonly saving?: boolean;
    readonly error?: string;
}

export interface HappyAgentCommandShortcutsSnapshot {
    readonly shortcuts: readonly HappyAgentCommandShortcut[];
    readonly draft?: HappyAgentCommandShortcutDraft;
    /** Why the file could not be read or the last removal failed, in one sentence. */
    readonly problem?: string;
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

/** The whole new file, guarded by the hash it was computed from; `null` when it did not exist. */
export type HappyAgentCommandShortcutsOutput = {
    readonly type: "tasksFileWriteRequested";
    readonly content: string;
    readonly expectedHash: string | null;
};

/** The task file as one read or write found it. */
export type HappyAgentCommandShortcutsFile =
    | { readonly type: "missing" }
    | {
          readonly type: "present";
          readonly content: string;
          readonly hash: string;
      };

/** Owner-only authoritative input: what the checkout's file says, and how writes ended. */
export interface HappyAgentCommandShortcutsWriter {
    tasksFileRead(file: HappyAgentCommandShortcutsFile): void;
    /** A read failed; the shortcuts last read stay on screen. */
    tasksFileReadFailed(reason: string): void;
    tasksFileWriteSucceeded(
        file: HappyAgentCommandShortcutsFile & { readonly type: "present" },
    ): void;
    tasksFileWriteFailed(reason: string): void;
}

interface TaskEntry {
    readonly shortcut: HappyAgentCommandShortcut;
    /** Its position in the file's `tasks` list. */
    readonly index: number;
    readonly hasArgs: boolean;
}

type FileState =
    | { readonly type: "unread" }
    | { readonly type: "missing" }
    | {
          readonly type: "present";
          readonly content: string;
          readonly hash: string;
          readonly tasks: TasksParsed;
      };

type TasksParsed =
    | {
          readonly valid: true;
          readonly entries: readonly TaskEntry[];
          /** Every label in the file, offered or not, so a new one never collides. */
          readonly labels: ReadonlySet<string>;
          readonly taskCount: number;
          readonly hasTaskList: boolean;
      }
    | { readonly valid: false; readonly reason: string };

/** A checkout's shortcuts. Construction opens no resources and executes nothing. */
export function happyAgentCommandShortcutsStoreOwnedCreate(
    input: {
        readonly output?: (event: HappyAgentCommandShortcutsOutput) => void;
    } = {},
): {
    readonly store: HappyAgentCommandShortcutsStore;
    readonly writer: HappyAgentCommandShortcutsWriter;
} {
    let file: FileState = { type: "unread" };
    let draft: HappyAgentCommandShortcutDraft | undefined;
    let problem: string | undefined;
    /** Only one write is in flight, so each is computed from the file the last one left. */
    let writing = false;
    let snapshot: HappyAgentCommandShortcutsSnapshot = { shortcuts: [] };
    const listeners = new Set<() => void>();

    const entries = (): readonly TaskEntry[] =>
        file.type === "present" && file.tasks.valid ? file.tasks.entries : [];
    const publish = (): void => {
        // An unchanged task keeps its object, so only the row that changed rerenders.
        const previous = new Map(snapshot.shortcuts.map((shortcut) => [shortcut.id, shortcut]));
        const shortcuts = entries().map((entry) => {
            const kept = previous.get(entry.shortcut.id);
            return kept && shortcutSame(entry.shortcut, kept) ? kept : entry.shortcut;
        });
        snapshot = {
            shortcuts:
                shortcuts.length === snapshot.shortcuts.length &&
                shortcuts.every((shortcut, index) => shortcut === snapshot.shortcuts[index])
                    ? snapshot.shortcuts
                    : shortcuts,
            ...(draft ? { draft } : {}),
            ...(problem ? { problem } : {}),
        };
        for (const listener of listeners) listener();
    };
    const fileApply = (next: HappyAgentCommandShortcutsFile): void => {
        file = next.type === "missing" ? next : { ...next, tasks: tasksParse(next.content) };
        problem = file.type === "present" && !file.tasks.valid ? file.tasks.reason : undefined;
    };
    /** The new file content for one change, or the reason it cannot be made. */
    const contentFor = (
        change:
            | {
                  readonly type: "save";
                  readonly id?: HappyAgentCommandShortcutId;
                  readonly name: string;
                  readonly command: string;
              }
            | { readonly type: "remove"; readonly id: HappyAgentCommandShortcutId },
    ): { readonly content: string; readonly expectedHash: string | null } | string => {
        if (file.type === "unread") return "Shortcuts are still loading.";
        if (file.type === "missing") {
            if (change.type === "remove") return "That shortcut is no longer in the file.";
            const task = {
                label: change.name,
                type: "shell",
                command: change.command,
            };
            return {
                content: `${JSON.stringify({ version: TASKS_VERSION, tasks: [task] }, null, "\t")}\n`,
                expectedHash: null,
            };
        }
        const tasks = file.tasks;
        if (!tasks.valid) return tasks.reason;
        const entry =
            change.id === undefined
                ? undefined
                : tasks.entries.find((candidate) => candidate.shortcut.id === change.id);
        if (change.id !== undefined && !entry) return "That shortcut is no longer in the file.";
        const formattingOptions = formattingFor(file.content);
        let content = file.content;
        const edit = (
            path: (string | number)[],
            value: unknown,
            isArrayInsertion = false,
        ): void => {
            content = applyEdits(
                content,
                modify(content, path, value, { formattingOptions, isArrayInsertion }),
            );
        };
        if (change.type === "remove") {
            if (!entry) return "That shortcut is no longer in the file.";
            edit(["tasks", entry.index], undefined);
            return { content, expectedHash: file.hash };
        }
        if (change.name !== entry?.shortcut.name && tasks.labels.has(change.name))
            return `A task named “${change.name}” is already in ${HAPPY_AGENT_COMMAND_SHORTCUTS_PATH}.`;
        if (!entry) {
            const task = {
                label: change.name,
                type: "shell",
                command: change.command,
            };
            if (tasks.hasTaskList) edit(["tasks", tasks.taskCount], task, true);
            else edit(["tasks"], [task]);
        } else {
            if (change.name !== entry.shortcut.name)
                edit(["tasks", entry.index, "label"], change.name);
            if (change.command !== entry.shortcut.command || entry.hasArgs) {
                edit(["tasks", entry.index, "command"], change.command);
                if (entry.hasArgs) edit(["tasks", entry.index, "args"], undefined);
            }
        }
        return { content, expectedHash: file.hash };
    };

    const store: HappyAgentCommandShortcutsStore = {
        get: () => snapshot,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        shortcutCreateOpen() {
            draft = { name: "", command: "" };
            publish();
        },
        shortcutEditOpen(id) {
            const entry = entries().find((candidate) => candidate.shortcut.id === id);
            if (!entry) return;
            draft = { ...entry.shortcut };
            publish();
        },
        shortcutEditorClose() {
            if (!draft || draft.saving) return;
            draft = undefined;
            publish();
        },
        shortcutNameUpdate(name) {
            if (!draft || draft.saving) return;
            draft = { ...draft, name, error: undefined };
            publish();
        },
        shortcutCommandUpdate(command) {
            if (!draft || draft.saving) return;
            draft = { ...draft, command, error: undefined };
            publish();
        },
        shortcutSave() {
            if (!draft || draft.saving || writing) return;
            const name = draft.name.trim();
            if (!name || !draft.command.trim()) {
                draft = { ...draft, error: "Enter a name and a command." };
                publish();
                return;
            }
            const next = contentFor({
                type: "save",
                id: draft.id,
                name,
                command: draft.command,
            });
            if (typeof next === "string") {
                draft = { ...draft, error: next };
                publish();
                return;
            }
            writing = true;
            draft = { ...draft, saving: true, error: undefined };
            publish();
            input.output?.({ type: "tasksFileWriteRequested", ...next });
        },
        shortcutRemove(id) {
            if (writing) return;
            const next = contentFor({ type: "remove", id });
            if (typeof next === "string") {
                problem = next;
                publish();
                return;
            }
            writing = true;
            input.output?.({ type: "tasksFileWriteRequested", ...next });
        },
    };
    const writer: HappyAgentCommandShortcutsWriter = {
        tasksFileRead(next) {
            // A read that lands mid-write is older than the write's answer will be.
            if (writing) return;
            fileApply(next);
            publish();
        },
        tasksFileReadFailed(reason) {
            if (writing) return;
            problem = reason;
            publish();
        },
        tasksFileWriteSucceeded(next) {
            writing = false;
            fileApply(next);
            if (draft?.saving) draft = undefined;
            publish();
        },
        tasksFileWriteFailed(reason) {
            writing = false;
            if (draft?.saving) draft = { ...draft, saving: false, error: reason };
            else problem = reason;
            publish();
        },
    };
    return { store, writer };
}

function shortcutSame(
    left: HappyAgentCommandShortcut,
    right: HappyAgentCommandShortcut | undefined,
) {
    return (
        right !== undefined &&
        left.id === right.id &&
        left.name === right.name &&
        left.command === right.command
    );
}

/** The tasks Happy can run exactly as VS Code would; every other task is kept but not offered. */
function tasksParse(content: string): TasksParsed {
    const errors: ParseError[] = [];
    const value: unknown = parse(content, errors, { allowTrailingComma: true });
    if (errors.length > 0)
        return {
            valid: false,
            reason: `${HAPPY_AGENT_COMMAND_SHORTCUTS_PATH} isn't valid JSON.`,
        };
    if (!objectIs(value) || value.version !== TASKS_VERSION)
        return {
            valid: false,
            reason: `${HAPPY_AGENT_COMMAND_SHORTCUTS_PATH} needs "version": "${TASKS_VERSION}".`,
        };
    if (value.tasks !== undefined && !Array.isArray(value.tasks))
        return {
            valid: false,
            reason: `"tasks" in ${HAPPY_AGENT_COMMAND_SHORTCUTS_PATH} must be a list.`,
        };
    const tasks: readonly unknown[] = Array.isArray(value.tasks) ? value.tasks : [];
    const labels = new Set<string>();
    for (const task of tasks)
        if (objectIs(task) && typeof task.label === "string") labels.add(task.label);
    const rootSupported = !TASK_FIELDS_UNSUPPORTED.some((field) => field in value);
    const entries: TaskEntry[] = [];
    tasks.forEach((task, index) => {
        const command = rootSupported && objectIs(task) ? taskCommand(task) : undefined;
        if (command === undefined || !objectIs(task)) return;
        const label = task.label as string;
        if (entries.some((entry) => entry.shortcut.name === label)) return;
        entries.push({
            shortcut: {
                id: label as HappyAgentCommandShortcutId,
                name: label,
                command,
            },
            index,
            hasArgs: task.args !== undefined,
        });
    });
    return {
        valid: true,
        entries,
        labels,
        taskCount: tasks.length,
        hasTaskList: Array.isArray(value.tasks),
    };
}

/** The shell line a task runs, when it is one Happy can run as written. */
function taskCommand(task: Readonly<Record<string, unknown>>): string | undefined {
    if (task.type !== "shell" || task.hide === true) return undefined;
    if (typeof task.label !== "string" || !task.label.trim()) return undefined;
    if (typeof task.command !== "string" || !task.command.trim()) return undefined;
    if (TASK_FIELDS_UNSUPPORTED.some((field) => field in task)) return undefined;
    const args = task.args ?? [];
    if (!Array.isArray(args)) return undefined;
    if (!args.every((arg) => typeof arg === "string" && ARGUMENT_PLAIN.test(arg))) return undefined;
    // VS Code quotes a command that contains spaces once it has arguments.
    if (args.length > 0 && /\s/.test(task.command)) return undefined;
    const line = [task.command, ...(args as string[])].join(" ");
    // Variables such as `${workspaceFolder}` are VS Code's to substitute.
    return line.includes("${") ? undefined : line;
}

/** Inserted text follows the file's own indentation and line endings. */
function formattingFor(content: string): FormattingOptions {
    const indent = /^([ \t]+)\S/m.exec(content)?.[1];
    const eol = content.includes("\r\n") ? "\r\n" : "\n";
    return indent?.startsWith("\t")
        ? { insertSpaces: false, tabSize: 4, eol }
        : { insertSpaces: true, tabSize: indent?.length ?? 4, eol };
}

function objectIs(value: unknown): value is Readonly<Record<string, unknown>> & {
    readonly tasks?: unknown;
} {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
