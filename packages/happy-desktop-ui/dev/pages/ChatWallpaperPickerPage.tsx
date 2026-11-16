import {
    agentAuthor,
    CHAT_WALLPAPERS,
    happyAgentOwnerAuthor,
    type ChatWallpaper,
    type ComposerSnapshot,
} from "happy-desktop-state";
import { ChatWallpaperPicker } from "../../src/ChatWallpaperPicker";
import { ConversationDock } from "../../src/ConversationDock";
import { ConversationView } from "../../src/ConversationView";
import { ThemeScope } from "../../src/ThemeScope";
import { ComponentPage, FullScreenSpecimen, Specimen } from "../kit";
import { conversationEntries } from "./happyAgentChatFixtures";

/** The component plan this page documents. The selector and the page header read the same value. */
export const componentNumber = "C-350";

const noop = () => undefined;
/** Stands in for a picture of the person's own, as the photo crop page does. */
const photoUrl = new URL("../assets/crop-landscape.webp", import.meta.url).href;
const modes = ["light", "dark"] as const;
const windowSize = { width: 960, height: 640 } as const;

const COMPOSER: ComposerSnapshot = {
    agentUserIds: [],
    attachments: [],
    capabilities: { commands: [], mentions: false, shellMode: false },
    focused: false,
    mentionCandidates: [],
    revision: 0,
    scopeId: "chat-wallpaper",
    submission: { status: "idle" },
    text: "",
};

function WallpaperWindow(props: {
    readonly mode: (typeof modes)[number];
    readonly wallpaper: ChatWallpaper;
}) {
    return (
        <ThemeScope chatWallpaper={props.wallpaper} chatWallpaperImage={photoUrl} mode={props.mode}>
            <div style={{ display: "flex", height: "100%", width: "100%" }}>
                <ConversationView
                    agentAuthor={agentAuthor}
                    dock={
                        <ConversationDock
                            composer={COMPOSER}
                            composerPlaceholder="Message Happy…"
                            onComposerSend={noop}
                            onComposerValueChange={noop}
                            running={false}
                        />
                    }
                    conversationId={`chat-wallpaper-${props.wallpaper}-${props.mode}`}
                    entries={conversationEntries}
                    onToolMediaOpen={noop}
                    running={false}
                    style={{ flex: "1 1 auto", minWidth: 0 }}
                    viewerId={happyAgentOwnerAuthor.id}
                />
            </div>
        </ThemeScope>
    );
}

export function ChatWallpaperPickerPage() {
    return (
        <ComponentPage
            contract="Props only"
            number={componentNumber}
            title="Chat wallpaper"
            summary="The picture behind every chat: the swatches Settings → General offers, and the same conversation under each coding-monogram pattern and a picture of the person's own, in light and dark."
        >
            <Specimen
                number="01"
                label="Picker · none chosen"
                detail="Before any picture of one's own"
                stage="surface"
            >
                <ChatWallpaperPicker
                    aria-label="Chat wallpaper"
                    onChange={noop}
                    onImageChoose={noop}
                    value="none"
                />
            </Specimen>
            <Specimen
                number="02"
                label="Picker · pattern chosen"
                detail="72 × 48 swatches · 12px gap"
                stage="surface"
            >
                <ChatWallpaperPicker
                    aria-label="Chat wallpaper"
                    image={photoUrl}
                    onChange={noop}
                    onImageChoose={noop}
                    value="braces"
                />
            </Specimen>
            <Specimen
                number="03"
                label="Picker · own picture chosen"
                detail="Under the surface veil"
                stage="surface"
            >
                <ChatWallpaperPicker
                    aria-label="Chat wallpaper"
                    image={photoUrl}
                    onChange={noop}
                    onImageChoose={noop}
                    value="custom"
                />
            </Specimen>
            <Specimen number="04" label="Picker · disabled" detail="0.48 opacity" stage="surface">
                <ChatWallpaperPicker
                    aria-label="Chat wallpaper"
                    disabled
                    image={photoUrl}
                    onChange={noop}
                    onImageChoose={noop}
                    value="tags"
                />
            </Specimen>
            {CHAT_WALLPAPERS.filter((wallpaper) => wallpaper !== "none").flatMap(
                (wallpaper, index) =>
                    modes.map((mode, modeIndex) => (
                        <FullScreenSpecimen
                            key={`${wallpaper}-${mode}`}
                            number={String(5 + index * modes.length + modeIndex).padStart(2, "0")}
                            label={`Conversation · ${wallpaper} · ${mode}`}
                            detail={`${String(windowSize.width)} × ${String(windowSize.height)}`}
                            screen={`chat-wallpaper-${wallpaper}-${mode}`}
                            window={windowSize}
                        >
                            <WallpaperWindow mode={mode} wallpaper={wallpaper} />
                        </FullScreenSpecimen>
                    )),
            )}
        </ComponentPage>
    );
}
