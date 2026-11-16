import { CHAT_WALLPAPERS, type ChatWallpaper } from "happy-desktop-state";
import { type CSSProperties, type KeyboardEvent, useRef } from "react";
import { chatWallpaperUrls } from "./assets";
import { Button } from "./Button";

export type ChatWallpaperPickerProps = {
    /** What the swatches choose, for anyone who cannot see them. */
    "aria-label"?: string;
    className?: string;
    "data-testid"?: string;
    disabled?: boolean;
    value: ChatWallpaper;
    /** The person's own picture, as an image URL; its swatch is offered only once it exists. */
    image?: string;
    onChange: (wallpaper: ChatWallpaper) => void;
    /**
     * A picture file the person chose to make their own wallpaper. Absent where
     * the host keeps no picture, which offers no way to choose one.
     */
    onImageChoose?: (file: File) => void;
};

const labels: Record<ChatWallpaper, string> = {
    none: "None",
    braces: "Braces",
    tags: "Tags",
    prompt: "Prompt",
    lambda: "Lambda",
    custom: "Your picture",
};

/**
 * C-350 ChatWallpaperPicker — chooses the picture behind every chat: a row of
 * swatches, each a small chat surface painted as `ThemeScope` paints the chat,
 * then a way to bring a picture of one's own. The row is one radio group: Tab
 * reaches the chosen swatch, and the arrow keys move the choice along it.
 */
export function ChatWallpaperPicker(props: ChatWallpaperPickerProps) {
    const file = useRef<HTMLInputElement>(null);
    const choices = CHAT_WALLPAPERS.filter(
        (wallpaper) => wallpaper !== "custom" || props.image !== undefined,
    );
    const choose = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        const step =
            event.key === "ArrowRight" || event.key === "ArrowDown"
                ? 1
                : event.key === "ArrowLeft" || event.key === "ArrowUp"
                  ? -1
                  : 0;
        if (step === 0) return;
        event.preventDefault();
        const next = (index + step + choices.length) % choices.length;
        const wallpaper = choices[next];
        if (wallpaper === undefined) return;
        const sibling = event.currentTarget.parentElement?.children[next];
        if (sibling instanceof HTMLElement) sibling.focus();
        props.onChange(wallpaper);
    };
    return (
        <div
            className={["happy-chat-wallpaper-picker", props.className].filter(Boolean).join(" ")}
            data-happy-desktop-ui="chat-wallpaper-picker"
            data-testid={props["data-testid"]}
        >
            <div
                aria-label={props["aria-label"]}
                className="happy-chat-wallpaper-picker__choices"
                role="radiogroup"
            >
                {choices.map((wallpaper, index) => {
                    const checked = wallpaper === props.value;
                    const url =
                        wallpaper === "none"
                            ? undefined
                            : wallpaper === "custom"
                              ? props.image
                              : chatWallpaperUrls[wallpaper];
                    return (
                        <button
                            aria-checked={checked}
                            className="happy-chat-wallpaper-picker__choice"
                            data-happy-desktop-ui="chat-wallpaper-choice"
                            data-value={wallpaper}
                            disabled={props.disabled}
                            key={wallpaper}
                            onClick={() => props.onChange(wallpaper)}
                            onKeyDown={(event) => choose(event, index)}
                            role="radio"
                            tabIndex={checked ? 0 : -1}
                            type="button"
                        >
                            <span
                                aria-hidden="true"
                                className="happy-chat-wallpaper-picker__swatch"
                                data-happy-desktop-ui="chat-wallpaper-swatch"
                                data-wallpaper={url === undefined ? undefined : wallpaper}
                                style={
                                    url === undefined
                                        ? undefined
                                        : ({
                                              "--happy-chat-wallpaper-image": `url("${url}")`,
                                          } as CSSProperties)
                                }
                            />
                            <span className="happy-chat-wallpaper-picker__label">
                                {labels[wallpaper]}
                            </span>
                        </button>
                    );
                })}
            </div>
            {props.onImageChoose ? (
                <>
                    <Button
                        disabled={props.disabled}
                        icon="image"
                        onClick={() => file.current?.click()}
                        size="small"
                        variant="secondary"
                    >
                        Choose picture…
                    </Button>
                    <input
                        accept="image/*"
                        className="happy-chat-wallpaper-picker__file"
                        onChange={(event) => {
                            const chosen = event.currentTarget.files?.[0];
                            // Cleared so choosing the same file again still reports it.
                            event.currentTarget.value = "";
                            if (chosen) props.onImageChoose?.(chosen);
                        }}
                        ref={file}
                        tabIndex={-1}
                        type="file"
                    />
                </>
            ) : null}
        </div>
    );
}
