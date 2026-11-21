import { partitionComponentProps } from "./componentProps";
import { useId, type CSSProperties } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "./components/ui/field";
import {
    Select as SelectRoot,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./components/ui/select";
import type { Dimension } from "./dimensions";
import { toCssDimension } from "./dimensions";
import { cn } from "./lib/utils";
export type SelectSize = "small" | "medium" | "large";
export type SelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};
export type SelectProps = {
    /** Accessible name for the control when no visible `label` is shown. */
    "aria-label"?: string;
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    value?: string;
    onValueChange?: (value: string) => void;
    options: SelectOption[];
    label?: string;
    placeholder?: string;
    size?: SelectSize;
    disabled?: boolean;
    error?: string;
    hint?: string;
    fullWidth?: boolean;
    /* Optional, additive: give the control an explicit width or bind a form. */
    id?: string;
    name?: string;
    width?: Dimension;
};
/*
 * The trigger by size: shadcn's 28px `sm` and 32px default triggers, and a
 * 36px large one level with the large button and text field.
 */
const triggerSizes: Record<SelectSize, { size: "sm" | "default"; className?: string }> = {
    small: { size: "sm" },
    medium: { size: "default" },
    large: { size: "default", className: "data-[size=default]:h-9" },
};
/**
 * C-019 Select — shadcn's Select (Radix) inside a shadcn Field: a trigger
 * showing the chosen option or the placeholder, a list of options with a
 * visible native scrollbar, and an optional label, hint, and error.
 * Placeholder, error, hint, disabled, and size are prop-driven so a fixture
 * renders every state without a store.
 *
 * Radix reserves the empty string for "nothing chosen" and refuses an item
 * whose value is empty, while a Happy option may use `""` (an "Any" choice), so
 * each item is addressed by its index and the caller only ever sees option
 * values. A value that matches no option shows the placeholder, or the first
 * option when there is none, as a native select would.
 */
export function Select(props: SelectProps) {
    const [local] = partitionComponentProps(props, [
        "aria-label",
        "className",
        "data-testid",
        "style",
        "value",
        "onValueChange",
        "options",
        "label",
        "placeholder",
        "size",
        "disabled",
        "error",
        "hint",
        "fullWidth",
        "id",
        "name",
        "width",
    ]);
    const size = local.size ?? "medium";
    const generatedId = useId();
    const controlId = local.id ?? `happy-select-${generatedId}`;
    const matchedIndex = local.options.findIndex((option) => option.value === local.value);
    const placeholderVisible = matchedIndex === -1 && local.placeholder !== undefined;
    const itemValue =
        matchedIndex !== -1
            ? String(matchedIndex)
            : placeholderVisible || local.options.length === 0
              ? ""
              : "0";
    const message = local.error || local.hint;
    const messageId = `${controlId}-message`;
    const trigger = triggerSizes[size];
    return (
        <Field
            className={cn(
                "happy-select",
                local.fullWidth ? "w-full" : "inline-flex w-fit",
                local.className,
            )}
            data-disabled={local.disabled ? "true" : undefined}
            data-error={local.error ? "" : undefined}
            data-full-width={local.fullWidth ? "" : undefined}
            data-invalid={local.error ? "true" : undefined}
            data-placeholder={placeholderVisible ? "" : undefined}
            data-happy-desktop-ui="select"
            data-size={size}
            data-testid={local["data-testid"]}
            style={{
                ...local.style,
                ...(local.fullWidth || local.width === undefined
                    ? {}
                    : { width: toCssDimension(local.width) }),
            }}
        >
            {local.label ? (
                <FieldLabel
                    className="happy-select__label"
                    data-happy-desktop-ui="select-label"
                    htmlFor={controlId}
                >
                    {local.label}
                </FieldLabel>
            ) : null}
            <SelectRoot
                disabled={local.disabled}
                onValueChange={(next) => {
                    const option = next === "" ? undefined : local.options[Number(next)];
                    if (option !== undefined) local.onValueChange?.(option.value);
                }}
                value={itemValue}
            >
                <SelectTrigger
                    aria-describedby={message ? messageId : undefined}
                    aria-invalid={local.error ? "true" : undefined}
                    aria-label={local["aria-label"] ?? local.label}
                    className={cn("happy-select__control w-full", trigger.className)}
                    data-happy-desktop-ui="select-control"
                    id={controlId}
                    size={trigger.size}
                >
                    <SelectValue
                        className="happy-select__value"
                        data-happy-desktop-ui="select-value"
                        placeholder={local.placeholder}
                    />
                </SelectTrigger>
                <SelectContent data-happy-desktop-ui="select-content">
                    {/* The group is the list's inset: the scrollport stays edge to edge. */}
                    <SelectGroup>
                        {local.options.map((option, index) => (
                            <SelectItem
                                data-happy-desktop-ui="select-option"
                                disabled={option.disabled}
                                key={option.value}
                                value={String(index)}
                            >
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </SelectRoot>
            {local.name ? (
                // The form carries the option's own value, never the item index.
                <input name={local.name} type="hidden" value={local.value ?? ""} />
            ) : null}
            {message ? (
                local.error ? (
                    <FieldError
                        className="happy-select__message"
                        data-happy-desktop-ui="select-error"
                        id={messageId}
                    >
                        {message}
                    </FieldError>
                ) : (
                    <FieldDescription
                        className="happy-select__message"
                        data-happy-desktop-ui="select-hint"
                        id={messageId}
                    >
                        {message}
                    </FieldDescription>
                )
            ) : null}
        </Field>
    );
}
