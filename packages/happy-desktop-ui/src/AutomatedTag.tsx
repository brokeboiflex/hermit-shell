import { Icon } from "./Icon";
import { cn } from "./lib/utils";
export type AutomatedTagProps = {
    className?: string;
    /**
     * Accessible sentence read in place of the visible caption. Defaults to a
     * plain description of automation attribution so a screen reader announces
     * the meaning rather than the bare word.
     */
    "aria-label"?: string;
};
/**
 * Restrained inline marker for a user-attributed message that was posted through
 * automation — a plugin or API acting on the author's behalf — rather than typed
 * by hand. It is deliberately quiet: a 12px glyph beside a muted "Automated"
 * caption in shadcn's small muted text, with no fill or border, so it reads as
 * author metadata, never as a loud status pill (a Badge) and never as the
 * separate agent/system identity treatment. It declares no outer margin; the
 * composing meta row owns the gap. It carries no product logic; the caller
 * decides when a message is automated and composes it beside the author.
 */
export function AutomatedTag(props: AutomatedTagProps) {
    return (
        <span
            aria-label={props["aria-label"] ?? "Posted automatically on the author’s behalf"}
            className={cn(
                "happy-automated-tag inline-flex h-4 shrink-0 items-center gap-1 text-xs font-medium whitespace-nowrap text-muted-foreground",
                props.className,
            )}
            data-happy-desktop-ui="automated-tag"
            role="note"
        >
            <span
                aria-hidden="true"
                className="happy-automated-tag__icon flex shrink-0 items-center justify-center"
                data-happy-desktop-ui="automated-tag-icon"
            >
                <Icon name="agents" size={12} />
            </span>
            <span
                aria-hidden="true"
                className="happy-automated-tag__label block leading-4"
                data-happy-desktop-ui="automated-tag-label"
            >
                Automated
            </span>
        </span>
    );
}
