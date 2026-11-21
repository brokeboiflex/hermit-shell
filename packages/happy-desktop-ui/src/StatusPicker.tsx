import { partitionComponentProps } from "./componentProps";
import { useId, type CSSProperties } from "react";
import { Card, CardContent } from "./components/ui/card";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "./components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import { Icon } from "./Icon";
import { cn } from "./lib/utils";
export type Availability = "automatic" | "online" | "away" | "dnd";
export type StatusPickerProps = {
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    availability: Availability;
    onAvailabilityChange?: (value: Availability) => void;
    statusEmoji?: string;
    statusText?: string;
    onStatusTextChange?: (value: string) => void;
    expiresLabel?: string;
    onClearStatus?: () => void;
};
/**
 * The four availability states in presentation order. Each carries a status
 * dot in a status token: muted for auto, green online, amber away, red busy.
 */
const AVAILABILITY: {
    value: Availability;
    label: string;
    dot: string;
}[] = [
    { value: "automatic", label: "Auto", dot: "bg-status-default" },
    { value: "online", label: "Online", dot: "bg-status-connected" },
    { value: "away", label: "Away", dot: "bg-warning" },
    { value: "dnd", label: "Busy", dot: "bg-status-error" },
];
const isAvailability = (value: string): value is Availability =>
    AVAILABILITY.some((option) => option.value === value);
/**
 * C-034 StatusPicker — availability chooser + custom status editor on a shadcn
 * Card. Availability is a single shadcn ToggleGroup, one layer deep like every
 * exclusive choice: four equal segments sitting on the card, each with its
 * status dot, and only the chosen one filled. The custom status is an
 * InputGroup: the emoji (or a smile placeholder), the text, and a clear button.
 * Props-only and fully controlled.
 */
export function StatusPicker(props: StatusPickerProps) {
    const [local] = partitionComponentProps(props, [
        "availability",
        "className",
        "data-testid",
        "expiresLabel",
        "onAvailabilityChange",
        "onClearStatus",
        "onStatusTextChange",
        "statusEmoji",
        "statusText",
        "style",
    ]);
    const id = useId();
    const availabilityLabelId = `happy-status-picker-${id}-availability`;
    const statusInputId = `happy-status-picker-${id}-status`;
    const hasStatus =
        (local.statusText !== undefined && local.statusText !== "") ||
        (local.statusEmoji !== undefined && local.statusEmoji !== "");
    return (
        <Card
            className={cn("happy-status-picker w-95", local.className)}
            data-happy-desktop-ui="status-picker"
            data-testid={local["data-testid"]}
            style={local.style}
        >
            <CardContent className="flex flex-col gap-4">
                <div
                    className="happy-status-picker__section flex flex-col gap-2"
                    data-happy-desktop-ui="status-picker-availability"
                >
                    <span
                        className="happy-status-picker__section-label text-xs font-medium text-muted-foreground"
                        data-happy-desktop-ui="status-picker-availability-label"
                        id={availabilityLabelId}
                    >
                        Availability
                    </span>
                    <ToggleGroup
                        aria-labelledby={availabilityLabelId}
                        className="happy-status-picker__segmented w-full"
                        data-happy-desktop-ui="status-picker-segmented"
                        onValueChange={(next) => {
                            // Pressing the chosen state again would clear it;
                            // there is always an availability.
                            if (isAvailability(next) && next !== local.availability) {
                                local.onAvailabilityChange?.(next);
                            }
                        }}
                        spacing={0.5}
                        type="single"
                        value={local.availability}
                    >
                        {AVAILABILITY.map((option) => {
                            const active = option.value === local.availability;
                            return (
                                <ToggleGroupItem
                                    className="happy-status-picker__segment min-w-0 flex-1 gap-1.5"
                                    data-active={active ? "" : undefined}
                                    data-availability={option.value}
                                    data-happy-desktop-ui="status-picker-segment"
                                    key={option.value}
                                    value={option.value}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            "happy-status-picker__dot size-2 shrink-0 rounded-full",
                                            option.dot,
                                        )}
                                        data-availability={option.value}
                                        data-happy-desktop-ui="status-picker-dot"
                                    />
                                    <span
                                        className="happy-status-picker__segment-label"
                                        data-happy-desktop-ui="status-picker-segment-label"
                                    >
                                        {option.label}
                                    </span>
                                </ToggleGroupItem>
                            );
                        })}
                    </ToggleGroup>
                </div>

                <div
                    className="happy-status-picker__section flex flex-col gap-2"
                    data-happy-desktop-ui="status-picker-status"
                >
                    <label
                        className="happy-status-picker__section-label text-xs font-medium text-muted-foreground"
                        data-happy-desktop-ui="status-picker-status-label"
                        htmlFor={statusInputId}
                    >
                        Status
                    </label>
                    <InputGroup
                        className="happy-status-picker__field"
                        data-happy-desktop-ui="status-picker-field"
                    >
                        <InputGroupAddon
                            aria-hidden="true"
                            className="happy-status-picker__emoji font-(family-name:--happy-font-emoji) text-base"
                            data-happy-desktop-ui="status-picker-emoji"
                        >
                            {local.statusEmoji ? (
                                local.statusEmoji
                            ) : (
                                <Icon name="smile" size={16} />
                            )}
                        </InputGroupAddon>
                        <InputGroupInput
                            className="happy-status-picker__input"
                            data-happy-desktop-ui="status-picker-input"
                            id={statusInputId}
                            onChange={(event) =>
                                local.onStatusTextChange?.(event.currentTarget.value)
                            }
                            placeholder="What's your status?"
                            type="text"
                            value={local.statusText ?? ""}
                        />
                        {hasStatus && local.onClearStatus ? (
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                    aria-label="Clear status"
                                    className="happy-status-picker__clear"
                                    onClick={() => local.onClearStatus?.()}
                                    size="icon-xs"
                                >
                                    <Icon name="close" size={16} />
                                </InputGroupButton>
                            </InputGroupAddon>
                        ) : null}
                    </InputGroup>
                    {local.expiresLabel ? (
                        <div
                            className="happy-status-picker__meta flex items-center gap-1.5 text-xs text-muted-foreground"
                            data-happy-desktop-ui="status-picker-meta"
                        >
                            <Icon
                                className="happy-status-picker__meta-icon"
                                name="clock"
                                size={12}
                            />
                            <span className="happy-status-picker__meta-label">
                                {local.expiresLabel}
                            </span>
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
