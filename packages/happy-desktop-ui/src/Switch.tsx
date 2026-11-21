import { useId, type CSSProperties } from "react";
import { Field, FieldContent, FieldDescription, FieldLabel } from "./components/ui/field";
import { Switch as SwitchControl } from "./components/ui/switch";
import { cn } from "./lib/utils";
export type SwitchSize = "small" | "medium";
export type SwitchProps = {
    "aria-label"?: string;
    checked: boolean;
    className?: string;
    "data-testid"?: string;
    description?: string;
    disabled?: boolean;
    id?: string;
    label?: string;
    onChange?: (checked: boolean) => void;
    size?: SwitchSize;
    style?: CSSProperties;
};
/** Happy's two switch sizes are shadcn's two. */
const controlSizes: Record<SwitchSize, "sm" | "default"> = {
    small: "sm",
    medium: "default",
};
/**
 * C-020 Switch — shadcn's Switch (a Radix `role="switch"` button) with an
 * optional label and muted description after it, laid out as a horizontal
 * shadcn Field: the label is the switch's own `<label>`, so clicking the words
 * toggles it too, and the description describes it. Desktop only, props only.
 */
export function Switch(props: SwitchProps) {
    const size = props.size ?? "medium";
    const generatedId = useId();
    const controlId = props.id ?? `happy-switch-${generatedId}`;
    const descriptionId = `${controlId}-description`;
    const described = props.label !== undefined && props.label !== "" && Boolean(props.description);
    return (
        <Field
            className={cn("happy-switch w-fit", props.className)}
            data-checked={props.checked ? "" : undefined}
            data-disabled={props.disabled ? "true" : undefined}
            data-happy-desktop-ui="switch"
            data-size={size}
            data-testid={props["data-testid"]}
            orientation="horizontal"
            style={props.style}
        >
            <SwitchControl
                aria-describedby={described ? descriptionId : undefined}
                aria-label={props["aria-label"]}
                checked={props.checked}
                className="happy-switch__track"
                data-happy-desktop-ui="switch-track"
                disabled={props.disabled}
                id={controlId}
                onCheckedChange={(checked) => props.onChange?.(checked)}
                size={controlSizes[size]}
            />
            {props.label ? (
                <FieldContent className="happy-switch__text" data-happy-desktop-ui="switch-text">
                    <FieldLabel
                        className="happy-switch__label"
                        data-happy-desktop-ui="switch-label"
                        htmlFor={controlId}
                    >
                        {props.label}
                    </FieldLabel>
                    {described ? (
                        <FieldDescription
                            className="happy-switch__description"
                            data-happy-desktop-ui="switch-description"
                            id={descriptionId}
                        >
                            {props.description}
                        </FieldDescription>
                    ) : null}
                </FieldContent>
            ) : null}
        </Field>
    );
}
