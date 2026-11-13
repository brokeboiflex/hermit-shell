import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

export interface FileWorkspaceControls {
    readonly filesVisible: boolean;
    readonly onFilesToggle: () => void;
}

export interface FileWorkspaceProps {
    readonly browser: ReactNode;
    readonly children: (controls: FileWorkspaceControls) => ReactNode;
}

/** A file stays beside its searchable workspace tree within the same tab. */
export function FileWorkspace(props: FileWorkspaceProps) {
    const [filesVisible, setFilesVisible] = useState(true);
    return (
        <div className="happy-file-workspace" data-happy-desktop-ui="file-workspace">
            {props.children({
                filesVisible,
                onFilesToggle: () => setFilesVisible(!filesVisible),
            })}
            <aside
                aria-label="Workspace files"
                className="happy-file-workspace__tree"
                hidden={!filesVisible}
            >
                {props.browser}
            </aside>
        </div>
    );
}

/** The toolbar sits above both the document and the tree, as one file surface. */
export function FileWorkspaceBody(props: { children: ReactNode }) {
    return (
        <div className="happy-file-workspace__body">
            <div className="happy-file-workspace__document">{props.children}</div>
        </div>
    );
}

export function FileWorkspaceNotices(props: { children: ReactNode }) {
    return <div className="happy-file-workspace__notices">{props.children}</div>;
}

export function FileWorkspaceEmpty(props: { files: FileWorkspaceControls }) {
    return (
        <>
            <header className="happy-file-workspace__header">
                <span>Workspace files</span>
                <Button
                    aria-label={props.files.filesVisible ? "Hide file tree" : "Show file tree"}
                    aria-pressed={props.files.filesVisible}
                    icon="files"
                    iconOnly
                    onClick={props.files.onFilesToggle}
                    size="small"
                    variant="ghost"
                />
            </header>
            <FileWorkspaceBody>
                <EmptyState
                    description="Select a file from the workspace tree."
                    icon="files"
                    size="panel"
                    title="Open file"
                />
            </FileWorkspaceBody>
        </>
    );
}
