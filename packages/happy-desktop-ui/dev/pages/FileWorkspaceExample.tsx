import { useState } from "react";
import { ChangedFileDiff, type ChangedFileDiffMode } from "../../src/ChangedFileDiff";
import { FileBrowser, type FileBrowserScope } from "../../src/FileBrowser";
import { FileEditor } from "../../src/FileEditor";
import { FileWorkspace, FileWorkspaceEmpty } from "../../src/FileWorkspace";
import { FileRevealContext } from "../../src/LinkContextMenu";
import { MarkdownDocument } from "../../src/MarkdownDocument";
import { TabbedPane } from "../../src/TabbedPane";
import { fileTreeBuild } from "../../src/fileTreeBuild";

const documents: Record<string, string> = {
    "README.md":
        "# Workspace notes\n\nRead documents beside the conversation. Switch to **Source** to edit, or use the file menu to copy and save.\n\n## Files\n\n- Browse folders on the right.\n- Search by file name.\n- Open the context menu for file actions.\n",
    "docs/design.md": "# Design\n\nThe toolbar spans the document and its searchable tree.\n",
    "src/app.ts": "export const title = 'Hermit';\n",
    "package.json": '{\n  "name": "hermit-workspace"\n}\n',
};

/** Interactive renderer fixture; native actions report their target without opening host apps. */
export function FileWorkspaceExample(props: { empty?: boolean }) {
    const [selected, setSelected] = useState(props.empty ? undefined : "README.md");
    const [query, setQuery] = useState("");
    const [scope, setScope] = useState<FileBrowserScope>("all");
    const [opened, setOpened] = useState(new Set(["docs", "src"]));
    const [drafts, setDrafts] = useState(documents);
    const [showChanges, setShowChanges] = useState(false);
    const [mode, setMode] = useState<ChangedFileDiffMode>("unified");
    const [action, setAction] = useState("");
    const select = (path: string) => {
        setSelected(path);
        setShowChanges(false);
    };
    const nodes = fileTreeBuild(
        Object.keys(documents)
            .filter(
                (path) =>
                    path.toLowerCase().includes(query.toLowerCase()) &&
                    (scope === "all" || path === "README.md"),
            )
            .map((path) => ({
                path,
                ...(path === "README.md" ? { gitStatus: "modified" as const } : {}),
            })),
        { opened, closed: new Set(), defaultDepth: query ? Number.POSITIVE_INFINITY : 0 },
    );
    return (
        <div className="flex h-[560px] w-[900px] max-w-full flex-col overflow-hidden rounded-lg border border-[var(--divider)]">
            <FileRevealContext.Provider
                value={{
                    label: "Show in folder",
                    openWith: {
                        targets: [
                            { id: "default", label: "Default app", acceptsFolders: true },
                            { id: "vscode", label: "VS Code", acceptsFolders: true },
                            { id: "cursor", label: "Cursor", acceptsFolders: true },
                            { id: "terminal", label: "Terminal", acceptsFolders: true },
                            { id: "xcode", label: "Xcode", acceptsFolders: true },
                            { id: "android-studio", label: "Android Studio", acceptsFolders: true },
                        ],
                        open: async (path, target) =>
                            setAction(`Open with ${target.label}: ${path}`),
                    },
                    path: (path) => setAction(`Show in folder: ${path}`),
                    link: (link) => setAction(`Show in folder: ${link.path}`),
                }}
            >
                <TabbedPane
                    activeId="file"
                    className="happy-file-workspace-tabs"
                    onSelect={() => undefined}
                    tabs={[{ id: "file", label: selected ?? "Open file", icon: "doc" }]}
                >
                    <FileWorkspace
                        browser={
                            <FileBrowser
                                count={undefined}
                                layout="tree"
                                nodes={nodes}
                                scope={scope}
                                onScopeChange={setScope}
                                searchQuery={query}
                                onSearchQueryChange={setQuery}
                                selectedId={selected}
                                onSelect={select}
                                onOpen={(path) => setAction(`Open in main tab: ${path}`)}
                                onOpenBeside={select}
                                onShowChanges={(path) => {
                                    setSelected(path);
                                    setShowChanges(true);
                                }}
                                onReveal={(path) => setAction(`Show in folder: ${path}`)}
                                onToggle={(path, expanded) =>
                                    setOpened((previous) => {
                                        const next = new Set(previous);
                                        if (expanded) next.add(path);
                                        else next.delete(path);
                                        return next;
                                    })
                                }
                            />
                        }
                    >
                        {(files) =>
                            selected === undefined ? (
                                <FileWorkspaceEmpty files={files} />
                            ) : showChanges ? (
                                <ChangedFileDiff
                                    appearance="dark"
                                    files={files}
                                    path={selected}
                                    oldContent="# Workspace notes\n"
                                    newContent={drafts[selected] ?? ""}
                                    mode={mode}
                                    onModeChange={setMode}
                                    onDownload={() => setAction(`Save as: ${selected}`)}
                                    onOpenInTab={() => setAction(`Open in main tab: ${selected}`)}
                                />
                            ) : (
                                <FileEditor
                                    key={selected}
                                    files={files}
                                    path={selected}
                                    value={drafts[selected] ?? ""}
                                    onValueChange={(value) =>
                                        setDrafts((previous) => ({
                                            ...previous,
                                            [selected]: value,
                                        }))
                                    }
                                    onSave={() => setAction(`Save: ${selected}`)}
                                    onDownload={() => setAction(`Save as: ${selected}`)}
                                    onOpenInTab={() => setAction(`Open in main tab: ${selected}`)}
                                    {...(selected === "README.md"
                                        ? { onShowChanges: () => setShowChanges(true) }
                                        : {})}
                                    {...(selected.endsWith(".md")
                                        ? {
                                              rendered: (
                                                  <MarkdownDocument text={drafts[selected] ?? ""} />
                                              ),
                                          }
                                        : {})}
                                />
                            )
                        }
                    </FileWorkspace>
                </TabbedPane>
            </FileRevealContext.Provider>
            <div className="h-7 shrink-0 px-3 text-xs text-[var(--text-secondary)]" role="status">
                {action}
            </div>
        </div>
    );
}
