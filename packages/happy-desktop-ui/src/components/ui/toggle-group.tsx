/*
 * shadcn/ui Toggle Group (radix-nova), MIT: https://ui.shadcn.com/docs/components/radix/toggle-group
 *
 * Adapted to Happy's one-layer rule for exclusive choice controls
 * (master-plans/03-file-viewer.md): the group draws no track, border, or
 * background, unselected options sit directly on the surface in muted ink, and
 * only the selected option carries the quiet selected fill (`bg-muted`, the
 * same fill as a selected row). Hovering an unselected option brightens its ink
 * without filling it, so a fill always means "selected". shadcn's `outline`
 * variant and its joined, zero-spacing segments are therefore not offered.
 */
import { createContext, useContext, type ComponentProps, type CSSProperties } from "react";
import { type VariantProps } from "class-variance-authority";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";
import { toggleVariants } from "./toggle";

type ToggleGroupSize = VariantProps<typeof toggleVariants>["size"];

const ToggleGroupContext = createContext<{
    size?: ToggleGroupSize;
    spacing?: number;
    orientation?: "horizontal" | "vertical";
}>({
    size: "default",
    spacing: 2,
    orientation: "horizontal",
});

function ToggleGroup({
    className,
    size,
    spacing = 2,
    orientation = "horizontal",
    children,
    ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root> & {
    size?: ToggleGroupSize;
    spacing?: number;
    orientation?: "horizontal" | "vertical";
}) {
    return (
        <ToggleGroupPrimitive.Root
            data-slot="toggle-group"
            data-size={size}
            data-spacing={spacing}
            data-orientation={orientation}
            style={{ "--gap": spacing } as CSSProperties}
            className={cn(
                "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] data-vertical:flex-col data-vertical:items-stretch",
                className,
            )}
            {...props}
        >
            <ToggleGroupContext.Provider value={{ size, spacing, orientation }}>
                {children}
            </ToggleGroupContext.Provider>
        </ToggleGroupPrimitive.Root>
    );
}

function ToggleGroupItem({
    className,
    children,
    size = "default",
    ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item> & {
    size?: ToggleGroupSize;
}) {
    const context = useContext(ToggleGroupContext);

    return (
        <ToggleGroupPrimitive.Item
            data-slot="toggle-group-item"
            data-size={context.size || size}
            data-spacing={context.spacing}
            className={cn(
                toggleVariants({ variant: "default", size: context.size || size }),
                "shrink-0 text-muted-foreground not-data-[state=on]:hover:bg-transparent hover:text-foreground focus:z-10 focus-visible:z-10 data-[state=on]:text-foreground",
                className,
            )}
            {...props}
        >
            {children}
        </ToggleGroupPrimitive.Item>
    );
}

export { ToggleGroup, ToggleGroupItem };
