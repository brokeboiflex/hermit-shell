import { partitionComponentProps } from "./componentProps";
import { type ButtonHTMLAttributes, type CSSProperties, type Ref } from "react";
import { type VariantProps } from "class-variance-authority";
import { KeyCap } from "./Badge";
import { Button as ShadcnButton, type buttonVariants } from "./components/ui/button";
import type { Dimension } from "./dimensions";
import { toCssDimension } from "./dimensions";
import { Icon, type IconName } from "./Icon";
import type { KeyboardShortcut } from "./keyboardShortcut";
import { cn } from "./lib/utils";
import { Spinner } from "./Spinner";
export type ButtonSize = "small" | "medium" | "large";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> & {
    fullWidth?: boolean;
    icon?: IconName;
    iconOnly?: boolean;
    /**
     * The button's own work is running: a spinner takes the icon's place and the
     * button stops accepting presses, while the label stays put. The work a
     * button started belongs on that button — replacing the surface around it
     * would throw away whatever the person was reading when they pressed it.
     */
    loading?: boolean;
    /**
     * Work the button leads to is running somewhere else — the chat it opens,
     * say: a spinner takes the icon's place, but unlike `loading` the button
     * still presses, because the work is not this button's own.
     */
    working?: boolean;
    /** The native button, for a Radix trigger (`asChild`) that anchors to it. */
    ref?: Ref<HTMLButtonElement>;
    /**
     * Command-key hint. It floats below the button after the hover delay or
     * immediately on keyboard focus.
     */
    shortcut?: KeyboardShortcut;
    size?: ButtonSize;
    style?: CSSProperties;
    variant?: ButtonVariant;
    width?: Dimension;
};

type ShadcnVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ShadcnSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

/*
 * Happy's five variants drawn as shadcn's. Secondary is shadcn's bordered
 * outline button; success has no shadcn counterpart and is drawn the way
 * radix-nova draws destructive (a soft fill of its own hue) over the default
 * variant, whose three colour utilities its own replace.
 */
const shadcnVariant = {
    primary: "default",
    secondary: "outline",
    ghost: "ghost",
    danger: "destructive",
    success: "default",
} as const satisfies Record<ButtonVariant, ShadcnVariant>;

const variantClassName: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: undefined,
    ghost: undefined,
    danger: undefined,
    success:
        "bg-success/10 text-success hover:bg-success/20 focus-visible:border-success/40 focus-visible:ring-success/20 dark:bg-success/20 dark:hover:bg-success/30 dark:focus-visible:ring-success/40",
};

/*
 * The three contract heights, 28/36/44, on shadcn's scale: small is shadcn's
 * `sm` (h-7) and medium its `lg` (h-9). Large has no shadcn size, so it is
 * `lg` raised to h-11 with room to match.
 */
const shadcnSize = {
    small: "sm",
    medium: "lg",
    large: "lg",
} as const satisfies Record<ButtonSize, ShadcnSize>;

const shadcnIconSize = {
    small: "icon-sm",
    medium: "icon-lg",
    large: "icon-lg",
} as const satisfies Record<ButtonSize, ShadcnSize>;

const sizeClassName: Record<ButtonSize, string | undefined> = {
    small: undefined,
    medium: undefined,
    large: "h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
};

const iconOnlySizeClassName: Record<ButtonSize, string | undefined> = {
    small: undefined,
    medium: undefined,
    large: "size-11",
};

/** Glyph per size: shadcn's 14 for `sm`, 16 for `lg`, and 18 in the 44px button. */
const iconSizes: Record<ButtonSize, 14 | 16 | 18> = {
    small: 14,
    medium: 16,
    large: 18,
};

/**
 * C-003 Button — shadcn/ui's Button under Happy's API: five variants, three
 * contract heights, a leading icon or icon-only form, an own-work `loading`
 * and an elsewhere-work `working` spinner, and an optional floating shortcut
 * hint. The `happy-button` parts stay on the elements as unstyled hooks, and
 * `data-variant` / `data-size` keep Happy's names for the surfaces that
 * address them.
 */
export function Button(props: ButtonProps) {
    const [local, rest] = partitionComponentProps(props, [
        "children",
        "className",
        "fullWidth",
        "icon",
        "iconOnly",
        "loading",
        "shortcut",
        "size",
        "style",
        "type",
        "variant",
        "width",
        "working",
    ]);
    const size = local.size ?? "medium";
    const variant = local.variant ?? "primary";
    const iconOnly = local.iconOnly === true;
    const busy = local.loading === true || local.working === true;
    const leading = busy ? (
        <Spinner size={iconSizes[size]} />
    ) : local.icon ? (
        <Icon name={local.icon} size={iconSizes[size]} />
    ) : iconOnly ? (
        local.children
    ) : null;
    return (
        <ShadcnButton
            {...rest}
            aria-keyshortcuts={local.shortcut?.aria ?? rest["aria-keyshortcuts"]}
            className={cn(
                "happy-button",
                variantClassName[variant],
                iconOnly ? iconOnlySizeClassName[size] : sizeClassName[size],
                local.fullWidth ? "w-full" : undefined,
                local.shortcut ? "relative" : undefined,
                local.className,
            )}
            data-icon-only={iconOnly ? "" : undefined}
            data-happy-desktop-ui="button"
            data-loading={local.loading ? "" : undefined}
            data-working={local.working && !local.loading ? "" : undefined}
            data-shortcut-hint={local.shortcut ? "" : undefined}
            data-size={size}
            data-variant={variant}
            disabled={rest.disabled === true || local.loading === true}
            size={iconOnly ? shadcnIconSize[size] : shadcnSize[size]}
            style={{
                ...local.style,
                ...(local.fullWidth || local.width === undefined
                    ? {}
                    : { width: toCssDimension(local.width) }),
            }}
            type={local.type ?? "button"}
            variant={shadcnVariant[variant]}
        >
            {/* `gap: inherit` passes the button's own shadcn gap through. */}
            <span
                className="happy-button__content inline-flex min-w-0 items-center gap-[inherit]"
                data-happy-desktop-ui="button-content"
            >
                {leading === null ? null : (
                    <span
                        className="happy-button__icon flex shrink-0"
                        data-happy-desktop-ui="button-icon"
                        data-icon={iconOnly ? undefined : "inline-start"}
                    >
                        {leading}
                    </span>
                )}
                {!iconOnly ? (
                    <span className="happy-button__label" data-happy-desktop-ui="button-label">
                        {local.children}
                    </span>
                ) : null}
            </span>
            {local.shortcut ? (
                <KeyCap
                    className="happy-button__shortcut-hint happy-shortcut-hint--floating"
                    decorative
                    keys={local.shortcut.caps}
                />
            ) : null}
        </ShadcnButton>
    );
}
