import { partitionComponentProps } from "./componentProps";
import { type CSSProperties } from "react";
import { Badge } from "./components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import { Icon, type IconName } from "./Icon";
import { cn } from "./lib/utils";
export type SegmentedControlSize = "compact" | "small" | "medium" | "large";
/** A small badge on a segment's top-right corner, such as "New". */
export type SegmentedControlTag = {
    label: string;
};
export type SegmentedControlSegment = {
    value: string;
    label: string;
    icon?: IconName;
    /** A short tag after the label, such as "Experimental". */
    badge?: string;
    /** A badge overlapping the segment's top-right corner. */
    tag?: SegmentedControlTag;
    disabled?: boolean;
    title?: string;
};
export type SegmentedControlProps = {
    /** What the segments choose between, for anyone who cannot see the group. */
    "aria-label"?: string;
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    value: string;
    onChange?: (value: string) => void;
    segments: SegmentedControlSegment[];
    size?: SegmentedControlSize;
    fullWidth?: boolean;
    disabled?: boolean;
};
/** Happy's sizes on shadcn's toggle sizes; `compact` is the 24px subheader radio. */
const toggleSizes: Record<SegmentedControlSize, "sm" | "default" | "lg"> = {
    compact: "sm",
    small: "sm",
    medium: "default",
    large: "lg",
};
const iconSizes: Record<SegmentedControlSize, 14 | 16> = {
    compact: 14,
    small: 14,
    medium: 16,
    large: 16,
};
/** The compact segment: shadcn's small toggle cut to the subheader's control height. */
const compactSegment = "h-(--happy-subheader-control-height) px-1.5 text-xs";
/**
 * C-022 SegmentedControl — an exclusive choice group (2–5 segments) on shadcn's
 * single ToggleGroup, one layer deep: the group draws no track, unselected
 * segments sit directly on the owning surface, and only the selected one
 * carries the quiet selected fill.
 *
 * Every segment is as wide as the widest label. That is the one layout here
 * flexbox cannot express — equal columns sized by their widest content — so the
 * group is a single-row CSS grid of equal `1fr` tracks.
 */
export function SegmentedControl(props: SegmentedControlProps) {
    const [local] = partitionComponentProps(props, [
        "aria-label",
        "className",
        "data-testid",
        "disabled",
        "fullWidth",
        "onChange",
        "segments",
        "size",
        "style",
        "value",
    ]);
    const size = local.size ?? "medium";
    return (
        <ToggleGroup
            aria-label={local["aria-label"]}
            className={cn(
                "happy-segmented-control auto-cols-fr grid-flow-col items-stretch",
                local.fullWidth ? "grid w-full" : "inline-grid",
                local.className,
            )}
            data-disabled={local.disabled ? "" : undefined}
            data-full-width={local.fullWidth ? "" : undefined}
            data-happy-desktop-ui="segmented-control"
            data-size={size}
            data-testid={local["data-testid"]}
            disabled={local.disabled}
            onValueChange={(next) => {
                // Pressing the chosen segment again would clear the choice;
                // an exclusive choice always has one.
                if (next !== "" && next !== local.value) local.onChange?.(next);
            }}
            size={toggleSizes[size]}
            spacing={0.5}
            style={local.style}
            type="single"
            value={local.value}
        >
            {local.segments.map((segment) => {
                const active = segment.value === local.value;
                return (
                    <ToggleGroupItem
                        className={cn(
                            "happy-segmented-control__segment relative min-w-0",
                            size === "compact" && compactSegment,
                        )}
                        data-active={active ? "" : undefined}
                        data-happy-desktop-ui="segmented-control-segment"
                        data-value={segment.value}
                        disabled={segment.disabled}
                        key={segment.value}
                        title={segment.title}
                        value={segment.value}
                    >
                        {segment.tag ? (
                            <Badge
                                className="happy-segmented-control__tag absolute -top-2 right-0 z-10 h-4 bg-background px-1.5 text-[0.625rem] text-muted-foreground"
                                data-happy-desktop-ui="segmented-control-tag"
                                variant="outline"
                            >
                                {segment.tag.label}
                            </Badge>
                        ) : null}
                        {segment.icon ? (
                            <Icon
                                className="happy-segmented-control__icon"
                                data-icon="inline-start"
                                name={segment.icon}
                                size={iconSizes[size]}
                            />
                        ) : null}
                        <span
                            className="happy-segmented-control__label"
                            data-happy-desktop-ui="segmented-control-label"
                        >
                            {segment.label}
                        </span>
                        {segment.badge ? (
                            <Badge className="happy-segmented-control__badge" variant="outline">
                                {segment.badge}
                            </Badge>
                        ) : null}
                    </ToggleGroupItem>
                );
            })}
        </ToggleGroup>
    );
}
