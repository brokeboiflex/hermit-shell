import { partitionComponentProps } from "./componentProps";
import { type CSSProperties, type HTMLAttributes } from "react";
import type { Dimension } from "./dimensions";
import { toCssDimension } from "./dimensions";
import { cn } from "./lib/utils";
export type BoxProps = Omit<HTMLAttributes<HTMLDivElement>, "style"> & {
    height?: Dimension;
    style?: CSSProperties;
    width?: Dimension;
};
export function Box(props: BoxProps) {
    const [local, rest] = partitionComponentProps(props, [
        "children",
        "className",
        "height",
        "style",
        "width",
    ]);
    return (
        <div
            {...rest}
            /* Box is the neutral layout primitive: it draws nothing, and its one
               rule (display and box sizing) sits in the legacy layer beneath
               the utilities (theme.css), so a caller's own class, legacy or
               utility, always decides its layout. It deliberately takes no
               utilities of its own, which would outrank a caller's legacy
               class, and is not a Card or an Item: it has no surface. */
            className={cn("happy-box", local.className)}
            /* A composing component's explicit part marker must survive so its
               measurable parts stay addressable; plain boxes keep the generic
               marker. */
            data-happy-desktop-ui={
                ((rest as Record<string, unknown>)["data-happy-desktop-ui"] as
                    | string
                    | undefined) ?? "box"
            }
            style={{
                ...local.style,
                ...(local.height === undefined ? {} : { height: toCssDimension(local.height) }),
                ...(local.width === undefined ? {} : { width: toCssDimension(local.width) }),
            }}
        >
            {local.children}
        </div>
    );
}
