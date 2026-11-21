import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * shadcn/ui's class combiner: `clsx` joins conditional class values and
 * `tailwind-merge` drops the earlier of two conflicting Tailwind utilities, so
 * a caller's `className` overrides a component's own utility of the same kind.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
