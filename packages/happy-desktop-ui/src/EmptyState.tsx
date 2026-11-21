import { partitionComponentProps } from "./componentProps";
import { type CSSProperties } from "react";
import { Button } from "./components/ui/button";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "./components/ui/empty";
import { Icon, type IconName } from "./Icon";
import { cn } from "./lib/utils";
import { LottieScene, type LottieSceneName, type LottieScenePlay } from "./LottieScene";
import { EmptyStateVideo } from "./emptyState/EmptyStateVideo";
import chiefOfStaffVideo from "./assets/animations/chief-of-staff.mp4?url";
import chiefOfStaffPoster from "./assets/animations/chief-of-staff.png?url";
import { thumbHashToDataURL } from "thumbhash";

// Generated from the bundled chief-of-staff.png poster at 100 × 100 RGBA.
const chiefOfStaffPreview = thumbHashToDataURL(
    new Uint8Array([
        28, 8, 6, 95, 16, 85, 106, 230, 144, 72, 166, 86, 152, 217, 138, 22, 104, 102, 134, 48, 40,
        9, 131, 2,
    ]),
);
export type EmptyStateSize = "panel" | "inline";
export type EmptyStateAction = {
    label: string;
    icon?: IconName;
    onClick: () => void;
};
export type EmptyStateProps = {
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    icon: IconName;
    title: string;
    description?: string;
    action?: EmptyStateAction;
    size?: EmptyStateSize;
    /** Larger, higher-contrast copy for an introduction that deserves attention. */
    emphasis?: "standard" | "prominent";
    /**
     * Replaces the icon medallion with a large animated scene: its own
     * transparent region above the words, with no card, medallion, or fill
     * behind it. Reserved for states a reader actually sits in — a screen
     * waiting to be started, something being read, a settled absence — and
     * chosen for what it says, not for decoration. See `LottieScene` for what
     * each name means.
     *
     * The Chief of Staff scene uses a rounded silent MP4 with a still poster.
     * Other scenes use Lottie. The glyph stays required and is drawn until Lottie
     * paints: it is what the reader sees while the runtime loads, and what they
     * keep if it cannot load at all.
     */
    animation?: LottieSceneName | "chief-of-staff";
    /**
     * When the animated scene takes its one play. Defaults to `on-appear`.
     * Fixtures that must photograph identically every time pass `on-demand`,
     * which holds a still frame from the start (the poster for MP4 scenes).
     * The video scene has no hover-only form, so neither does an empty state.
     */
    animationPlay?: Exclude<LottieScenePlay, "on-hover">;
};
/* The medallion is shadcn's icon tile (`EmptyMedia variant="icon"`): 32px with
 * shadcn's 16px glyph inline, and one step up, 40px with a 20px glyph, under a
 * panel. Both land the glyph box on an integer inset (8 and 10), so the composed
 * icon stays optically centered without a bespoke nudge. */
const mediaIconSize: Record<EmptyStateSize, 16 | 20> = {
    panel: 20,
    inline: 16,
};
const mediaSize: Record<EmptyStateSize, string> = {
    panel: "size-10",
    inline: "size-8",
};
/* The scene's own region, on the 16px layout rhythm: 128 under a panel, 96 in
 * the tighter inline block. Large enough that the artwork is the first thing
 * read, small enough that a panel with a description and an action still fits
 * the 720x640 Electron minimum without clipping. The glyph held inside it until
 * the artwork paints is the medallion's glyph at the medallion's size: it is a
 * placeholder, not a second illustration, and growing it to fill a 128px box
 * would only make the swap louder. */
const sceneSize: Record<EmptyStateSize, 96 | 128> = { panel: 128, inline: 96 };
const sceneBox: Record<EmptyStateSize, string> = {
    panel: "size-32",
    inline: "size-24",
};
const actionSize: Record<EmptyStateSize, "default" | "sm"> = {
    panel: "default",
    inline: "sm",
};
/**
 * C-024 EmptyState — shadcn's Empty: a centered icon medallion (or animated
 * scene), title, optional description, and optional action. Props-only,
 * desktop-only; the `panel` size fills and vertically centers inside its host
 * region, `inline` is a compact content-sized block. Both keep Empty's 24px
 * padding on every side and draw no frame of their own.
 *
 * An animated state swaps the medallion for a transparent region and drops the
 * medallion's extra 8px under it, because the artwork brings its own margin.
 * A prominent introduction keeps one 12px rhythm between its parts, a wider
 * 440px measure, and larger, full-contrast copy.
 */
export function EmptyState(props: EmptyStateProps) {
    const [local] = partitionComponentProps(props, [
        "action",
        "animation",
        "animationPlay",
        "className",
        "data-testid",
        "description",
        "emphasis",
        "icon",
        "size",
        "style",
        "title",
    ]);
    const size = local.size ?? "panel";
    const prominent = local.emphasis === "prominent";
    return (
        <Empty
            className={cn(
                "happy-empty-state font-sans",
                size === "panel" ? "h-full" : "flex-none",
                prominent && "gap-3",
                prominent && size === "panel" && "h-auto min-h-full flex-[1_0_auto]",
                local.className,
            )}
            data-animated={local.animation === undefined ? undefined : ""}
            data-emphasis={local.emphasis}
            data-happy-desktop-ui="empty-state"
            data-size={size}
            data-testid={local["data-testid"]}
            style={local.style}
        >
            <EmptyHeader className={cn(prominent && "max-w-110 gap-3")}>
                {local.animation === "chief-of-staff" ? (
                    <EmptyStateVideo
                        play={local.animationPlay ?? "on-appear"}
                        poster={chiefOfStaffPoster}
                        preview={chiefOfStaffPreview}
                        size={sceneSize[size]}
                        src={chiefOfStaffVideo}
                    />
                ) : local.animation === undefined ? (
                    <EmptyMedia
                        className={cn("happy-empty-state__media", mediaSize[size])}
                        data-happy-desktop-ui="empty-state-media"
                        variant="icon"
                    >
                        <Icon name={local.icon} size={mediaIconSize[size]} />
                    </EmptyMedia>
                ) : (
                    <EmptyMedia
                        className={cn(
                            "happy-empty-state__scene group/scene relative mb-0 text-muted-foreground",
                            sceneBox[size],
                        )}
                        data-happy-desktop-ui="empty-state-scene"
                    >
                        {/* The glyph steps aside once the artwork is really
                            painting, rather than showing through it. */}
                        <Icon
                            className="group-has-[[data-painted=true]]/scene:opacity-0"
                            name={local.icon}
                            size={mediaIconSize[size]}
                        />
                        {/* Absolute: the canvas and the placeholder glyph occupy
                            one box and swap there, which flexbox cannot express —
                            it can only place them side by side. The region is
                            sized before anything paints, so the words below never
                            move when the scene arrives. */}
                        <LottieScene
                            className="happy-empty-state__art absolute top-1/2 left-1/2 -translate-1/2 opacity-0 data-[painted=true]:opacity-100"
                            name={local.animation}
                            {...(local.animationPlay ? { play: local.animationPlay } : {})}
                            replayLabel="Play the illustration again"
                            size={sceneSize[size]}
                        />
                    </EmptyMedia>
                )}
                <EmptyTitle
                    aria-level={2}
                    className={cn("happy-empty-state__title", prominent && "max-w-110 text-2xl/8")}
                    data-happy-desktop-ui="empty-state-title"
                    role="heading"
                >
                    {local.title}
                </EmptyTitle>
                {local.description ? (
                    <EmptyDescription
                        className={cn(
                            "happy-empty-state__description",
                            prominent && "max-w-110 text-base/6 font-medium text-foreground",
                        )}
                        data-happy-desktop-ui="empty-state-description"
                    >
                        {local.description}
                    </EmptyDescription>
                ) : null}
            </EmptyHeader>
            {local.action
                ? ((action) => (
                      <EmptyContent
                          className="happy-empty-state__actions"
                          data-happy-desktop-ui="empty-state-actions"
                      >
                          <Button
                              onClick={action.onClick}
                              size={actionSize[size]}
                              type="button"
                              variant="outline"
                          >
                              {action.icon ? (
                                  <Icon
                                      data-icon="inline-start"
                                      name={action.icon}
                                      size={size === "panel" ? 16 : 14}
                                  />
                              ) : null}
                              {action.label}
                          </Button>
                      </EmptyContent>
                  ))(local.action)
                : null}
        </Empty>
    );
}
