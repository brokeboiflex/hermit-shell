import { partitionComponentProps } from "./componentProps";
import { type CSSProperties, type ReactNode } from "react";
import { cva } from "class-variance-authority";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Button as ShadcnButton } from "./components/ui/button";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { cn } from "./lib/utils";
export type BannerTone = "info" | "success" | "warning" | "danger" | "neutral";
export type BannerAction = {
    label: string;
    onClick: () => void;
};
export type BannerProps = {
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    tone: BannerTone;
    title?: string;
    children: ReactNode;
    icon?: IconName;
    action?: BannerAction;
    onDismiss?: () => void;
};
/* The tone is carried the way shadcn's Alert carries it: every banner is the
   same card with the same hairline, and the leading glyph wears the tone.
   Danger is Alert's destructive variant, so its words take the colour too. */
const bannerIconVariants = cva(
    "happy-banner__icon flex size-4.5 flex-none items-center justify-center",
    {
        variants: {
            tone: {
                info: "text-info",
                success: "text-success",
                warning: "text-warning",
                danger: "text-destructive",
                neutral: "text-muted-foreground",
            },
        },
    },
);
/**
 * C-023 Banner — inline alert, on shadcn's Alert. Icon, text block, optional
 * action Button, and a dismiss control share one vertically centered row (the
 * icon rides the center of the whole text block, so a two-line title+message
 * stays balanced). Props-only, desktop-only.
 *
 * Its geometry is a contract, not a look: `conversationRowHeight.ts` lays out a
 * question's failed-answer banner from these exact numbers before it paints, so
 * the transcript holds still when one appears — 13px type on an 18px line, a
 * 600-weight title 4px above the message, 12px block and 14px inline padding
 * inside a 1px border, a 12px gap before the action, a 44px floor, and the
 * product's small Button for the action. Change one here and change it there.
 * The banner sets no width, margin, flex basis, or text wrapping of its own,
 * because ReviewStream, ProfilePhotoCropDialog, and the question card place it
 * with those from their own (legacy) sheets. The dismiss control is shadcn's
 * ghost icon button held to the 18px line, so dismissing never makes a
 * one-line banner taller than its 44px floor.
 */
export function Banner(props: BannerProps) {
    const [local] = partitionComponentProps(props, [
        "className",
        "data-testid",
        "style",
        "tone",
        "title",
        "children",
        "icon",
        "action",
        "onDismiss",
    ]);
    const hasActions = () => Boolean(local.action || local.onDismiss);
    // Danger interrupts assistive tech; the softer tones announce politely.
    const role = () => (local.tone === "danger" ? "alert" : "status");
    return (
        <Alert
            className={cn(
                "happy-banner flex min-h-11 w-auto shrink-0 items-center gap-3 px-3.5 py-3 font-sans text-[13px]/[18px]",
                local.className,
            )}
            data-happy-desktop-ui="banner"
            data-testid={local["data-testid"]}
            data-tone={local.tone}
            role={role()}
            style={local.style}
            variant={local.tone === "danger" ? "destructive" : "default"}
        >
            {local.icon
                ? ((name) => (
                      <span
                          className={bannerIconVariants({ tone: local.tone })}
                          data-happy-desktop-ui="banner-icon"
                      >
                          <Icon name={name} size={16} />
                      </span>
                  ))(local.icon)
                : null}
            <div
                className="happy-banner__content flex min-w-0 grow flex-col gap-1"
                data-happy-desktop-ui="banner-content"
            >
                {local.title ? (
                    <AlertTitle
                        className="happy-banner__title block font-semibold"
                        data-happy-desktop-ui="banner-title"
                    >
                        {local.title}
                    </AlertTitle>
                ) : null}
                <AlertDescription
                    className={cn(
                        "happy-banner__message block text-[13px]/[18px] text-wrap",
                        local.tone === "danger" && "text-destructive/90",
                    )}
                    data-happy-desktop-ui="banner-message"
                >
                    {local.children}
                </AlertDescription>
            </div>
            {hasActions() ? (
                <div
                    className="happy-banner__actions ml-auto flex flex-none items-center gap-2"
                    data-happy-desktop-ui="banner-actions"
                >
                    {local.action
                        ? ((action) => (
                              <Button
                                  className="happy-banner__action"
                                  onClick={() => action.onClick()}
                                  size="small"
                                  variant="secondary"
                              >
                                  {action.label}
                              </Button>
                          ))(local.action)
                        : null}
                    {local.onDismiss ? (
                        <ShadcnButton
                            aria-label="Dismiss"
                            className="happy-banner__dismiss size-4.5 text-muted-foreground"
                            data-happy-desktop-ui="banner-dismiss"
                            onClick={() => local.onDismiss?.()}
                            size="icon-xs"
                            type="button"
                            variant="ghost"
                        >
                            <Icon name="close" size={12} />
                        </ShadcnButton>
                    ) : null}
                </div>
            ) : null}
        </Alert>
    );
}
