import { partitionComponentProps } from "./componentProps";
import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./lib/utils";

export type PanelHeaderProps = Omit<HTMLAttributes<HTMLElement>, "style"> & {
    /**
     * What the band carries. It is optional because the band's first job is
     * structural: it is what puts the panel's own content on the same baseline as
     * the surface beside it, whether or not it has anything to say yet.
     */
    children?: ReactNode;
    /** Uses the 12px chrome inset when the band carries an edge-docked control. */
    edgeControl?: boolean;
    style?: CSSProperties;
};

/**
 * The 56px band across the top of a docked panel column — the `ChannelHeader` of
 * the panel side, to the pixel and to the same transparent, borderless contract,
 * so the two columns' headers are one band across the window and whatever each
 * one holds beneath starts on the same line.
 *
 * It is legitimately empty. A panel whose content begins at the very top of the
 * window sits a header's height above the surface it belongs with, and in the
 * desktop shell it also leaves that edge of the window with no lane to drag it
 * by — the header row is the drag surface. Reserving the band answers both, and a
 * panel that later has a title or controls for this row puts them here.
 *
 * The row itself is utilities. Its height and inline insets are not: the shell
 * (app-shell.css, window-chrome.css) and the settings, Surface, artifacts,
 * plugins, and feed headers restate them for window controls and their own
 * content column, and those sheets still sit in the legacy layer, which a
 * utility would silently outrank. They stay in styles/panel-header.css until
 * those sheets convert. The band has no fill of its own for the same reason: a
 * caller may give it one.
 */
export function PanelHeader(props: PanelHeaderProps) {
    const [local, rest] = partitionComponentProps(props, [
        "children",
        "className",
        "edgeControl",
        "style",
    ]);
    return (
        <header
            {...rest}
            className={cn(
                "happy-panel-header flex w-full flex-none items-center gap-3 font-sans text-foreground",
                local.className,
            )}
            data-edge-control={local.edgeControl ? "" : undefined}
            data-happy-desktop-ui="panel-header"
            style={local.style}
        >
            {local.children}
        </header>
    );
}
