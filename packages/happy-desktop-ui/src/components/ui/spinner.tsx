/*
 * shadcn/ui Spinner (radix-nova), MIT: https://ui.shadcn.com/docs/components/radix/spinner
 *
 * Adapted to Happy: the turning mark is the curated `loading` glyph (Ionicons'
 * open circular arrow) in place of Lucide's loader, at the 16px shadcn draws.
 */
import { Icon, type IconProps } from "../../Icon";
import { cn } from "../../lib/utils";

function Spinner({
    className,
    size = 16,
    "aria-label": label = "Loading",
    ...props
}: Omit<IconProps, "name">) {
    return (
        <span
            data-slot="spinner"
            role="status"
            aria-label={label}
            className={cn("inline-flex shrink-0", className)}
        >
            <Icon className="animate-spin" name="loading" size={size} {...props} />
        </span>
    );
}

export { Spinner };
