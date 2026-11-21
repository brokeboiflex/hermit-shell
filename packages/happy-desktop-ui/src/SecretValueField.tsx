import { useState } from "react";
import { InputGroupButton } from "./components/ui/input-group";
import { Icon } from "./Icon";
import { cn } from "./lib/utils";
import { TextField, type TextFieldProps } from "./TextField";

export type SecretValueFieldProps = Omit<TextFieldProps, "type" | "trailing"> & {
    /** Starts with the value shown, for fixtures; a person always starts with it hidden. */
    readonly initialShown?: boolean;
};

/**
 * A write-only value being typed, hidden until the person shows it with the
 * toggle at the end of the field. A single line hides as a password; several
 * lines stay a textarea whose glyphs are masked, so a pasted key or certificate
 * keeps its line breaks. Showing or hiding never touches the value.
 */
export function SecretValueField(props: SecretValueFieldProps) {
    const { initialShown, ...field } = props;
    const [shown, setShown] = useState(initialShown ?? false);
    return (
        <div
            className={cn(
                "happy-secret-value-field flex min-w-0",
                // A textarea has no password type; masking its glyphs keeps the
                // line breaks a password input drops.
                !shown && "[&_textarea]:[-webkit-text-security:disc]",
            )}
            data-happy-desktop-ui="secret-value-field"
            data-labelled={field.label ? "" : undefined}
            data-shown={shown ? "" : undefined}
        >
            <TextField
                {...field}
                className={cn("min-w-0 flex-1", field.className)}
                trailing={
                    <InputGroupButton
                        aria-label={shown ? "Hide value" : "Show value"}
                        aria-pressed={shown}
                        className="happy-secret-value-field__toggle"
                        disabled={field.disabled}
                        onClick={() => setShown(!shown)}
                        size="icon-xs"
                    >
                        <Icon name={shown ? "eye-off" : "eye"} size={16} />
                    </InputGroupButton>
                }
                type={field.multiline || shown ? "text" : "password"}
            />
        </div>
    );
}
