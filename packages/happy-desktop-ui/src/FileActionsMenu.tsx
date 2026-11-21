import { useContext, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Spinner } from "./components/ui/spinner";
import { Icon, type IconName } from "./Icon";
import { FileRevealContext } from "./LinkContextMenu";

export interface FileActionsMenuProps {
    readonly path: string;
    /** Current displayed text, including any unsaved draft. */
    readonly text?: string;
    readonly onOpenInTab?: () => void;
    readonly onShowChanges?: () => void;
    readonly onDownload?: () => void | Promise<void>;
    readonly disabled?: boolean;
}

/**
 * Actions for the actual file being read, shared by source and media viewers:
 * a small secondary button that opens shadcn's DropdownMenu. The button wears
 * the last action's outcome — a spinner while it runs, an alert glyph if it
 * failed — and a polite live region announces it.
 */
export function FileActionsMenu(props: FileActionsMenuProps) {
    const reveal = useContext(FileRevealContext);
    const busy = useRef<{ path: string } | undefined>(undefined);
    const [result, setResult] = useState<{
        path: string;
        type: "pending" | "done" | "error";
        message: string;
    }>();
    const outcome = result?.path === props.path ? result : undefined;
    const name = props.path.split(/[\\/]/).at(-1) ?? props.path;
    const run = (action: () => void | Promise<void>, completed: string): void => {
        if (busy.current?.path === props.path) return;
        const attempt = { path: props.path };
        busy.current = attempt;
        setResult({ ...attempt, type: "pending", message: "Working…" });
        const settle = (type: "done" | "error", message: string) => {
            if (busy.current !== attempt) return;
            busy.current = undefined;
            setResult({ ...attempt, type, message });
        };
        try {
            // Keep clipboard and download calls inside the initiating gesture.
            Promise.resolve(action()).then(
                () => settle("done", completed),
                (error: unknown) =>
                    settle("error", error instanceof Error ? error.message : "The action failed."),
            );
        } catch (error) {
            settle("error", error instanceof Error ? error.message : "The action failed.");
        }
    };
    const item = (
        label: string,
        icon: IconName,
        action: () => void | Promise<void>,
        result = label,
    ) => (
        <DropdownMenuItem
            disabled={outcome?.type === "pending"}
            onSelect={() => run(action, result)}
        >
            <Icon name={icon} size={16} />
            <span className="min-w-0 flex-1 truncate">{label}</span>
        </DropdownMenuItem>
    );
    return (
        <span
            className="happy-file-actions flex flex-none items-center"
            data-happy-desktop-ui="file-actions"
        >
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        aria-label="File actions"
                        className="happy-file-actions__trigger"
                        data-testid="file-actions-trigger"
                        disabled={props.disabled}
                        size="sm"
                        title={outcome?.message ?? "File actions"}
                        variant="secondary"
                    >
                        {outcome?.type === "pending" ? (
                            <Spinner data-icon="inline-start" size={14} />
                        ) : (
                            <Icon
                                data-icon="inline-start"
                                name={outcome?.type === "error" ? "alert" : "open-external"}
                                size={14}
                            />
                        )}
                        Open
                        <Icon data-icon="inline-end" name="chevron-down" size={14} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    aria-label={`Actions for ${name}`}
                    className="happy-file-menu w-58 max-w-[calc(100vw-16px)] p-0 [-webkit-app-region:no-drag] [app-region:no-drag]"
                    collisionPadding={8}
                >
                    {/* The content is the scrollport and stays edge to edge;
                        the rows carry the inset. */}
                    <div className="flex flex-col p-1">
                        <DropdownMenuLabel className="truncate" title={props.path}>
                            {name}
                        </DropdownMenuLabel>
                        {props.onOpenInTab || props.onShowChanges ? (
                            <>
                                <DropdownMenuGroup>
                                    {props.onOpenInTab
                                        ? item("Open in main tab", "doc", props.onOpenInTab)
                                        : null}
                                    {props.onShowChanges
                                        ? item("Show changes", "file-diff", props.onShowChanges)
                                        : null}
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                            </>
                        ) : null}
                        {reveal?.openWith && reveal.openWith.targets.length > 0 ? (
                            <>
                                <DropdownMenuLabel>Open with</DropdownMenuLabel>
                                <DropdownMenuGroup>
                                    {reveal.openWith.targets.map((target) => (
                                        <DropdownMenuItem
                                            key={target.id}
                                            disabled={outcome?.type === "pending"}
                                            onSelect={() =>
                                                run(
                                                    () => reveal.openWith!.open(props.path, target),
                                                    `Opened with ${target.label}`,
                                                )
                                            }
                                        >
                                            {target.iconUrl ? (
                                                <img
                                                    alt=""
                                                    className="size-4 flex-none rounded-xs object-contain"
                                                    src={target.iconUrl}
                                                />
                                            ) : (
                                                <Icon name="open-external" size={16} />
                                            )}
                                            <span className="min-w-0 flex-1 truncate">
                                                {target.label}
                                            </span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                            </>
                        ) : null}
                        <DropdownMenuGroup>
                            {reveal
                                ? item(reveal.label ?? "Show in folder", "folder-open", () =>
                                      reveal.path(props.path),
                                  )
                                : null}
                            {props.onDownload
                                ? item(
                                      "Save as…",
                                      "arrow-down",
                                      props.onDownload,
                                      "Download started",
                                  )
                                : null}
                        </DropdownMenuGroup>
                        {reveal || props.onDownload ? <DropdownMenuSeparator /> : null}
                        <DropdownMenuGroup>
                            {item(
                                "Copy path",
                                "copy",
                                () => navigator.clipboard.writeText(props.path),
                                "Path copied",
                            )}
                            {item(
                                "Copy file name",
                                "copy",
                                () => navigator.clipboard.writeText(name),
                                "File name copied",
                            )}
                            {props.text !== undefined
                                ? item(
                                      "Copy contents",
                                      "copy",
                                      () => navigator.clipboard.writeText(props.text ?? ""),
                                      "Contents copied",
                                  )
                                : null}
                        </DropdownMenuGroup>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
            <span aria-live="polite" className="sr-only" role="status">
                {outcome?.message}
            </span>
        </span>
    );
}
