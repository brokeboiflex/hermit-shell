import { partitionComponentProps } from "./componentProps";
import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { cva } from "class-variance-authority";
import { Field, FieldDescription, FieldError, FieldLabel } from "./components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea,
} from "./components/ui/input-group";
import { Icon, type IconName } from "./Icon";
import { cn } from "./lib/utils";
import { useFocusOnType } from "./useFocusOnType";
export type TextFieldType = "text" | "email" | "password" | "search";
export type TextFieldSize = "small" | "medium" | "large";
export type TextFieldProps = {
    "aria-label"?: string;
    /**
     * Takes the focus as the field mounts. It exists so a surface whose whole
     * purpose is this one field — a dialog asking for a folder — puts the caret
     * where a reader is about to type instead of on the control that closes it.
     * Declared rather than done through a handle, so the field exposes no element.
     */
    autoFocus?: boolean;
    className?: string;
    "data-testid"?: string;
    /**
     * Makes this field the surface's last resort for typing, as the chat's
     * composer is: a character typed while no control that wants it has focus
     * lands here. Turn it on for at most one field on screen.
     */
    focusOnType?: boolean;
    /** Puts the caret here whenever it changes; see `useFocusOnType`. */
    focusKey?: string;
    style?: CSSProperties;
    value?: string;
    onValueChange?: (value: string) => void;
    /** Fires when the field loses focus, for commit-on-blur controls. */
    onBlur?: () => void;
    /** Fires on Enter in a single-line field, for commit-on-submit controls. */
    onSubmit?: () => void;
    label?: string;
    placeholder?: string;
    type?: TextFieldType;
    multiline?: boolean;
    rows?: number;
    size?: TextFieldSize;
    hint?: string;
    error?: string;
    disabled?: boolean;
    /** Shows a value to select and copy, such as a link, without letting it be edited. */
    readOnly?: boolean;
    required?: boolean;
    leadingIcon?: IconName;
    /** Fixed text before the value, such as `@` before a handle; not part of the value. */
    leadingText?: string;
    /**
     * A small control inside the field's box after the value, such as the
     * show/hide toggle of `SecretValueField`: an `InputGroupButton`.
     */
    trailing?: ReactNode;
    fullWidth?: boolean;
    id?: string;
    name?: string;
    autoComplete?: string;
    /** The on-screen keyboard and input hint, such as `numeric` for a code. */
    inputMode?: "text" | "email" | "numeric";
};
/** Leading-icon glyph by control size: shadcn's 16px, 14px in the 28px control. */
const iconSizes: Record<TextFieldSize, 14 | 16> = {
    small: 14,
    medium: 16,
    large: 16,
};
/*
 * The control box's height by size: shadcn's 32px input in the middle, with the
 * 28px and 36px steps its small and large buttons use, so a field and a button
 * of the same size stand level in one row. A multiline field grows with its
 * rows instead.
 */
const controlVariants = cva("happy-text-field__control", {
    variants: {
        size: {
            small: "h-7",
            medium: "h-8",
            large: "h-9",
        },
    },
});
/*
 * Multiline height. The textarea gets an explicit height of rows × the 20px
 * line of `text-sm` plus its 8px top and bottom padding, so its box is the same
 * in every engine (native `rows` sizing drifts a pixel or two between
 * Blink/Gecko/WebKit, and `field-sizing: content` exists only in some).
 */
const MULTILINE_LINE_HEIGHT = 20;
const MULTILINE_PADDING = 16;
/**
 * C-018 TextField — shadcn's Field around an InputGroup: an optional label with
 * a required marker, the input or textarea with an optional leading icon or
 * text and a trailing control, and a hint or error below. Three heights
 * (28/32/36). Props-only and fully controlled.
 */
export function TextField(props: TextFieldProps) {
    const controlEl = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const [local] = partitionComponentProps(props, [
        "aria-label",
        "autoComplete",
        "inputMode",
        "autoFocus",
        "className",
        "data-testid",
        "disabled",
        "error",
        "focusKey",
        "focusOnType",
        "fullWidth",
        "hint",
        "id",
        "label",
        "leadingIcon",
        "leadingText",
        "multiline",
        "name",
        "onBlur",
        "onSubmit",
        "onValueChange",
        "placeholder",
        "readOnly",
        "required",
        "rows",
        "size",
        "style",
        "trailing",
        "type",
        "value",
    ]);
    const size = local.size ?? "medium";
    const invalid = local.error !== undefined && local.error !== "";
    const message = invalid ? local.error : local.hint;
    const rows = local.rows ?? 3;
    const generatedId = useId();
    const fieldId = local.id ?? `happy-text-field-${generatedId}`;
    const messageId = `${fieldId}-message`;
    const describedBy = message ? messageId : undefined;
    // A multiline field's addons sit on its first line rather than its middle.
    const addonAlign = local.multiline ? "self-start" : undefined;
    useFocusOnType(
        controlEl,
        local.focusOnType === true && !local.disabled,
        local.disabled ? undefined : local.focusKey,
    );
    return (
        <Field
            className={cn(
                "happy-text-field",
                local.fullWidth ? "w-full" : "inline-flex w-60",
                local.className,
            )}
            data-disabled={local.disabled ? "true" : undefined}
            data-full-width={local.fullWidth ? "" : undefined}
            data-invalid={invalid ? "true" : undefined}
            data-multiline={local.multiline ? "" : undefined}
            data-happy-desktop-ui="text-field"
            data-size={size}
            data-testid={local["data-testid"]}
            style={local.style}
        >
            {local.label ? (
                <FieldLabel
                    className="happy-text-field__label gap-0.5"
                    data-happy-desktop-ui="text-field-label"
                    htmlFor={fieldId}
                >
                    {local.label}
                    {local.required ? (
                        <span
                            aria-hidden="true"
                            className="happy-text-field__required text-destructive"
                            data-happy-desktop-ui="text-field-required"
                        >
                            *
                        </span>
                    ) : null}
                </FieldLabel>
            ) : null}

            <InputGroup
                className={controlVariants({ size: local.multiline ? null : size })}
                data-invalid={invalid ? "" : undefined}
                data-multiline={local.multiline ? "" : undefined}
                data-happy-desktop-ui="text-field-control"
                data-size={size}
            >
                {local.leadingIcon ? (
                    <InputGroupAddon
                        aria-hidden="true"
                        className={cn(
                            "happy-text-field__icon",
                            local.multiline && "self-start pt-2.5",
                        )}
                        data-happy-desktop-ui="text-field-icon"
                    >
                        <Icon name={local.leadingIcon} size={iconSizes[size]} />
                    </InputGroupAddon>
                ) : null}
                {local.leadingText ? (
                    <InputGroupAddon
                        aria-hidden="true"
                        className={cn(local.multiline && "self-start pt-2")}
                    >
                        <InputGroupText
                            className="happy-text-field__leading-text whitespace-pre"
                            data-happy-desktop-ui="text-field-leading-text"
                        >
                            {local.leadingText}
                        </InputGroupText>
                    </InputGroupAddon>
                ) : null}

                {local.multiline ? (
                    <InputGroupTextarea
                        aria-label={local["aria-label"]}
                        aria-describedby={describedBy}
                        aria-invalid={invalid ? "true" : undefined}
                        className="happy-text-field__input min-h-0 field-sizing-fixed overflow-y-auto"
                        data-happy-desktop-ui="text-field-input"
                        data-scrollbar-axes="vertical"
                        data-scrollbar-viewport=""
                        disabled={local.disabled}
                        id={fieldId}
                        name={local.name}
                        onBlur={() => local.onBlur?.()}
                        onChange={(event) => local.onValueChange?.(event.currentTarget.value)}
                        placeholder={local.placeholder}
                        ref={(element) => {
                            controlEl.current = element;
                        }}
                        required={local.required}
                        rows={rows}
                        style={{
                            height: `${rows * MULTILINE_LINE_HEIGHT + MULTILINE_PADDING}px`,
                        }}
                        value={local.value ?? ""}
                    />
                ) : (
                    <InputGroupInput
                        aria-label={local["aria-label"]}
                        aria-describedby={describedBy}
                        aria-invalid={invalid ? "true" : undefined}
                        autoComplete={local.autoComplete}
                        autoFocus={local.autoFocus}
                        className={cn(
                            "happy-text-field__input h-full [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
                            // The fixed text reads as the start of the value.
                            local.leadingText && "pl-0!",
                        )}
                        inputMode={local.inputMode}
                        data-happy-desktop-ui="text-field-input"
                        disabled={local.disabled}
                        id={fieldId}
                        name={local.name}
                        onBlur={() => local.onBlur?.()}
                        onChange={(event) => local.onValueChange?.(event.currentTarget.value)}
                        onKeyDown={(event) => {
                            if (event.key !== "Enter" || local.onSubmit === undefined) return;
                            // The Enter is the submit's. Left to the browser, it
                            // would also reach whatever the submit puts focus in —
                            // a new document's text, opened to be written in.
                            event.preventDefault();
                            local.onSubmit();
                        }}
                        placeholder={local.placeholder}
                        readOnly={local.readOnly}
                        ref={(element) => {
                            controlEl.current = element;
                        }}
                        required={local.required}
                        type={local.type ?? "text"}
                        value={local.value ?? ""}
                    />
                )}

                {local.trailing ? (
                    <InputGroupAddon
                        align="inline-end"
                        className={cn("happy-text-field__trailing", addonAlign)}
                        data-happy-desktop-ui="text-field-trailing"
                    >
                        {local.trailing}
                    </InputGroupAddon>
                ) : null}
            </InputGroup>

            {message ? (
                invalid ? (
                    <FieldError
                        className="happy-text-field__message"
                        data-happy-desktop-ui="text-field-error"
                        data-tone="error"
                        id={messageId}
                    >
                        {message}
                    </FieldError>
                ) : (
                    <FieldDescription
                        className="happy-text-field__message"
                        data-happy-desktop-ui="text-field-hint"
                        data-tone="hint"
                        id={messageId}
                    >
                        {message}
                    </FieldDescription>
                )
            ) : null}
        </Field>
    );
}
