import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "../lib/utils";
import { reducedMotionGet, reducedMotionSubscribe } from "../lottie/dotLottieRuntime";

/* Both images fill the frame and stay hidden until they can be shown. */
const imageClassName =
    "size-full min-w-0 rounded-[calc(var(--radius)*1.4-1px)] object-cover opacity-0";

/**
 * A silent, rounded illustration with the same play-once/replay behavior as
 * Lottie scenes. The frame is shadcn's: a hairline, the muted fill under the
 * thumbhash preview, and the XL corner, with the images inside rounded one
 * pixel tighter so the curves stay parallel.
 */
export function EmptyStateVideo(props: {
    src: string;
    poster: string;
    preview: string;
    size: number;
    play: "on-appear" | "on-demand";
}) {
    const video = useRef<HTMLVideoElement>(null);
    const replay = useRef<() => void>(() => {});
    const [ready, setReady] = useState(false);
    const [posterReady, setPosterReady] = useState(false);
    const [failed, setFailed] = useState(false);
    const reducedMotion = useSyncExternalStore(
        reducedMotionSubscribe,
        reducedMotionGet,
        () => true,
    );

    // eslint-disable-next-line happy-react/no-layout-effect -- The video player, intersection observer, and document visibility listener share one imperative lifetime with complete cleanup.
    useLayoutEffect(() => {
        const element = video.current;
        if (!element || reducedMotion || failed) return;
        const document = element.ownerDocument;
        const view = document.defaultView;
        if (!view) return;
        let visible = false;
        let owed = props.play === "on-appear";
        let disposed = false;

        const settle = () => {
            const playing = owed && visible && !document.hidden;
            element.dataset.state = owed ? (playing ? "playing" : "waiting") : "rested";
            if (playing) {
                void element.play().catch((error: unknown) => {
                    if (error instanceof DOMException && error.name === "AbortError") return;
                    // Autoplay can be refused; a deliberate replay remains available.
                    if (!disposed && visible && !document.hidden) {
                        owed = false;
                        element.dataset.state = "rested";
                    }
                });
            } else {
                element.pause();
            }
        };
        const ended = () => {
            owed = false;
            settle();
        };
        replay.current = () => {
            if (owed) return;
            element.currentTime = 0;
            owed = true;
            settle();
        };
        const observer = new view.IntersectionObserver((entries) => {
            visible = entries.some((entry) => entry.isIntersecting);
            settle();
        });
        observer.observe(element);
        document.addEventListener("visibilitychange", settle);
        element.addEventListener("ended", ended);
        return () => {
            disposed = true;
            replay.current = () => {};
            observer.disconnect();
            document.removeEventListener("visibilitychange", settle);
            element.removeEventListener("ended", ended);
            element.pause();
        };
    }, [props.play, props.src, reducedMotion, failed]);

    return (
        <button
            aria-label="Play the illustration again"
            className="happy-empty-state-video group/video relative flex flex-none cursor-pointer overflow-hidden rounded-xl border bg-muted bg-cover bg-center p-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
            data-happy-desktop-ui="empty-state-video"
            data-motion={reducedMotion ? "reduced" : "full"}
            data-playing-image={
                ready && !failed && !reducedMotion ? "video" : posterReady ? "poster" : "thumbhash"
            }
            data-poster-ready={posterReady ? "true" : "false"}
            disabled={reducedMotion || failed}
            onClick={() => replay.current()}
            onPointerEnter={() => replay.current()}
            style={{
                width: props.size,
                height: props.size,
                backgroundImage: `url(${props.preview})`,
            }}
            type="button"
        >
            <img
                alt=""
                className={cn(
                    imageClassName,
                    "happy-empty-state-video__poster group-data-[poster-ready=true]/video:opacity-100",
                )}
                onError={() => setPosterReady(false)}
                onLoad={() => setPosterReady(true)}
                src={props.poster}
            />
            <video
                aria-hidden="true"
                className={cn(
                    imageClassName,
                    /* The video overlays its always-available poster in the same
                       border box; flexbox cannot place both images in one slot. */
                    "happy-empty-state-video__clip pointer-events-none absolute inset-0 group-data-[playing-image=video]/video:opacity-100",
                )}
                disablePictureInPicture
                loop={false}
                muted
                onCanPlay={() => setReady(true)}
                onError={() => setFailed(true)}
                playsInline
                poster={props.poster}
                preload="none"
                ref={video}
                src={reducedMotion || failed ? undefined : props.src}
                tabIndex={-1}
            />
        </button>
    );
}
