import { partitionComponentProps } from "./componentProps";
import { type CSSProperties, type ReactNode } from "react";
import { cva } from "class-variance-authority";
import { Field, FieldContent, FieldDescription, FieldLabel } from "./components/ui/field";
import { cn } from "./lib/utils";
export type FormRowLayout = "inline" | "stacked";
export type FormRowAlign = "start" | "center";
/**
 * `regular` is the settings page's own rhythm. `compact` keeps the same type,
 * gaps, and divider with half the vertical padding, for a list that holds
 * settings rows among others — the command palette — where a full settings row
 * would stand taller than everything around it.
 */
export type FormRowDensity = "regular" | "compact";
export type FormRowProps = {
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    label: string;
    description?: string;
    /** A mark before the words, such as an `IconTile`, centred on them. */
    icon?: ReactNode;
    htmlFor?: string;
    control: ReactNode;
    layout?: FormRowLayout;
    align?: FormRowAlign;
    density?: FormRowDensity;
};
/*
 * The row on a shadcn Field. `align` only tunes an inline row: a horizontal
 * Field tops its items whenever its words are a FieldContent, so the centred
 * row restates the alignment under that same condition. A stacked row reads as
 * a form field, its words over a full-width control, and ignores `align` (a
 * centred label over a narrow control looks broken).
 */
const formRowVariants = cva("happy-form-row border-b", {
    variants: {
        layout: {
            inline: "gap-6",
            stacked: "gap-3",
        },
        align: {
            center: "",
            start: "",
        },
        density: {
            regular: "py-4",
            compact: "py-2",
        },
    },
    compoundVariants: [
        {
            layout: "inline",
            align: "center",
            className: "items-center has-[>[data-slot=field-content]]:items-center",
        },
        {
            layout: "inline",
            align: "start",
            className: "items-start",
        },
    ],
});
/**
 * C-029 FormRow — a settings row. An optional leading mark and a label with an
 * optional muted description on the leading side, and a trailing control slot
 * (a TextField, Select, Switch, Button, …). `inline` places the control to the
 * right of the words; `stacked` places it on its own line below them. A
 * hairline bottom divider lets rows stack into a settings list without extra
 * chrome.
 */
export function FormRow(props: FormRowProps) {
    const [local, rest] = partitionComponentProps(props, [
        "align",
        "className",
        "control",
        "density",
        "description",
        "htmlFor",
        "icon",
        "label",
        "layout",
        "style",
    ]);
    const layout = local.layout ?? "inline";
    const align = local.align ?? "center";
    const text = (
        <FieldContent
            className="happy-form-row__text min-w-0"
            data-happy-desktop-ui="form-row-text"
        >
            <FieldLabel
                className="happy-form-row__label"
                data-happy-desktop-ui="form-row-label"
                htmlFor={local.htmlFor}
            >
                {local.label}
            </FieldLabel>
            {local.description ? (
                <FieldDescription
                    className="happy-form-row__description"
                    data-happy-desktop-ui="form-row-description"
                >
                    {local.description}
                </FieldDescription>
            ) : null}
        </FieldContent>
    );
    return (
        <Field
            {...rest}
            className={cn(
                formRowVariants({ layout, align, density: local.density ?? "regular" }),
                local.className,
            )}
            data-align={align}
            data-density={local.density === "compact" ? "compact" : undefined}
            data-layout={layout}
            data-happy-desktop-ui="form-row"
            orientation={layout === "inline" ? "horizontal" : "vertical"}
            style={local.style}
        >
            {local.icon === undefined ? (
                text
            ) : (
                <div
                    className="happy-form-row__lead flex min-w-0 flex-1 items-center gap-3"
                    data-happy-desktop-ui="form-row-lead"
                >
                    <span
                        className="happy-form-row__icon flex shrink-0"
                        data-happy-desktop-ui="form-row-icon"
                    >
                        {local.icon}
                    </span>
                    {text}
                </div>
            )}
            <div
                className={cn(
                    "happy-form-row__control flex items-center",
                    layout === "inline" ? "shrink-0" : "min-w-0 *:min-w-0 *:flex-1",
                )}
                data-happy-desktop-ui="form-row-control"
            >
                {local.control}
            </div>
        </Field>
    );
}
