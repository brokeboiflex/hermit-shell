import { partitionComponentProps } from "./componentProps";
import { useId, type CSSProperties } from "react";
import { Checkbox as CheckboxControl } from "./components/ui/checkbox";
import { Field, FieldLabel } from "./components/ui/field";
import { cn } from "./lib/utils";
export type CheckboxProps = {
    "aria-describedby"?: string;
    "aria-label"?: string;
    checked: boolean;
    className?: string;
    "data-testid"?: string;
    disabled?: boolean;
    id?: string;
    indeterminate?: boolean;
    label?: string;
    name?: string;
    onChange?: (checked: boolean) => void;
    style?: CSSProperties;
};
/*
 * shadcn's Checkbox draws its tick for checked and for indeterminate alike, and
 * paints only the checked state. A mixed box gets the checked fill too, with the
 * tick hidden and a short bar drawn in its place.
 */
const indeterminateClasses =
    "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:before:h-0.5 data-[state=indeterminate]:before:w-2 data-[state=indeterminate]:before:rounded-full data-[state=indeterminate]:before:bg-current data-[state=indeterminate]:[&_[data-slot=icon]]:hidden";
/**
 * C-021 Checkbox — shadcn's Checkbox (a Radix `role="checkbox"` button) with an
 * optional label beside it, laid out as a horizontal shadcn Field. Checked,
 * unchecked, indeterminate, and disabled are prop-driven. Compose it inside
 * FormRow/DataTable/Menu wherever a boolean toggle is needed.
 */
export function Checkbox(props: CheckboxProps) {
    const [local] = partitionComponentProps(props, [
        "aria-describedby",
        "aria-label",
        "checked",
        "className",
        "data-testid",
        "disabled",
        "id",
        "indeterminate",
        "label",
        "name",
        "onChange",
        "style",
    ]);
    const generatedId = useId();
    const controlId = local.id ?? `happy-checkbox-${generatedId}`;
    const state = local.indeterminate ? "indeterminate" : local.checked ? "checked" : "unchecked";
    return (
        <Field
            className={cn("happy-checkbox w-fit", local.className)}
            data-checked={local.checked ? "" : undefined}
            data-disabled={local.disabled ? "true" : undefined}
            data-indeterminate={local.indeterminate ? "" : undefined}
            data-happy-desktop-ui="checkbox"
            data-state={state}
            data-testid={local["data-testid"]}
            orientation="horizontal"
            style={local.style}
        >
            <CheckboxControl
                aria-describedby={local["aria-describedby"]}
                aria-label={local["aria-label"]}
                checked={local.indeterminate ? "indeterminate" : local.checked}
                className={cn("happy-checkbox__control happy-checkbox__box", indeterminateClasses)}
                data-happy-desktop-ui="checkbox-control"
                disabled={local.disabled}
                id={controlId}
                name={local.name}
                onCheckedChange={(checked) => local.onChange?.(checked === true)}
            />
            {local.label !== undefined ? (
                <FieldLabel
                    className="happy-checkbox__label"
                    data-happy-desktop-ui="checkbox-label"
                    htmlFor={controlId}
                >
                    {local.label}
                </FieldLabel>
            ) : null}
        </Field>
    );
}
