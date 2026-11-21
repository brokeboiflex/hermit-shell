/*
 * shadcn/ui Alert (radix-nova), MIT: https://ui.shadcn.com/docs/components/radix/alert
 *
 * Adapted to Happy: the leading glyph is an `Icon` (16px, shadcn's `size-4`)
 * addressed through `[data-slot=icon]`. With an icon the alert is a genuine
 * two-dimensional grid: the icon spans both rows of the first column while
 * the title and the description stack in the second, and those siblings
 * arrive without a wrapper flexbox could arrange them in.
 */
import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva(
    "group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>[data-slot=icon]]:grid-cols-[auto_1fr] has-[>[data-slot=icon]]:gap-x-2 *:data-[slot=icon]:row-span-2 *:data-[slot=icon]:translate-y-0.5 *:data-[slot=icon]:text-current",
    {
        variants: {
            variant: {
                default: "bg-card text-card-foreground",
                destructive:
                    "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:data-[slot=icon]:text-current",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

function Alert({
    className,
    variant,
    ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
    return (
        <div
            data-slot="alert"
            role="alert"
            className={cn(alertVariants({ variant }), className)}
            {...props}
        />
    );
}

function AlertTitle({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-title"
            className={cn(
                "font-medium group-has-[>[data-slot=icon]]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
                className,
            )}
            {...props}
        />
    );
}

function AlertDescription({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-description"
            className={cn(
                "text-sm text-pretty text-muted-foreground [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
                className,
            )}
            {...props}
        />
    );
}

function AlertAction({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-action"
            className={cn("absolute top-2 right-2", className)}
            {...props}
        />
    );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
