import { useState } from "react";
import { Button } from "../../src/Button";
import { Icon } from "../../src/Icon";
import { LoadingSwap } from "../../src/LoadingSwap";
import { Switch } from "../../src/Switch";
import { Spinner, type SpinnerTone } from "../../src/Spinner";
import { ComponentPage, DimensionRule, Specimen } from "../kit";

/** The component plan this page documents. The selector and the page header read the same value. */
export const componentNumber = "C-160";

const column: Record<string, string> = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
};

const row: Record<string, string> = {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    flexWrap: "wrap",
};

const cell: Record<string, string> = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px",
};

const caption: Record<string, string> = {
    color: "var(--muted-foreground)",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
};

const card: Record<string, string> = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "20px 24px",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    background: "var(--background)",
};

const sizes = [12, 14, 16, 20, 24, 32, 48] as const;

const tones: SpinnerTone[] = ["default", "muted", "accent"];

/** Eight parked positions of one turn: `frame` 0–7 at the default eight per turn. */
const frames = [0, 1, 2, 3, 4, 5, 6, 7] as const;

/* Square edge paired with the largest Icon size that fits it. */
const swapSizes = [
    { box: 16, glyph: 12 },
    { box: 20, glyph: 16 },
    { box: 24, glyph: 18 },
    { box: 32, glyph: 20 },
] as const;

/*
 * The one interactive fixture on this page: LoadingSwap only proves its
 * contract when `loading` actually changes, so the specimen owns the flag and
 * hands it to every sample.
 */
function LoadingSwapSpecimen() {
    const [loading, setLoading] = useState(true);
    return (
        <div style={card}>
            <Switch
                checked={loading}
                label="loading"
                description="Toggle to cross-fade every square below; a square that mounts loading shows its spinner instantly."
                onChange={setLoading}
            />
            <div style={row}>
                {swapSizes.map(({ box, glyph }) => (
                    <div key={box} style={cell}>
                        <LoadingSwap loading={loading} size={box} tone="accent">
                            <Icon name="check-circle" size={glyph} />
                        </LoadingSwap>
                        <span style={caption}>{box} px square</span>
                    </div>
                ))}
                <div style={cell}>
                    <LoadingSwap loading={loading} tone="muted" />
                    <span style={caption}>no content</span>
                </div>
            </div>
            <DimensionRule label="Square box · both states centred · 160 ms cross-fade" />
        </div>
    );
}

export function SpinnerPage() {
    return (
        <ComponentPage
            number={componentNumber}
            summary="shadcn/ui's Spinner: the curated `loading` font glyph turning in place of Lucide's loader. It inherits the ink around it, parks on a known angle for fixtures, and turns more slowly under reduced motion."
            title="Spinner"
        >
            <Specimen
                detail="square glyph box · 16 px by default (shadcn size-4) · live animation"
                label="Size scale"
                number="01"
                stage="surface"
            >
                <div style={card}>
                    <div style={row}>
                        {sizes.map((size) => (
                            <div key={size} style={cell}>
                                <Spinner size={size} />
                                <span style={caption}>{size} px</span>
                            </div>
                        ))}
                    </div>
                    <DimensionRule label="width = height = size" />
                </div>
            </Specimen>

            <Specimen
                detail="frame prop holds the glyph k/8 of a turn — deterministic for screenshots"
                label="Parked frames"
                number="02"
                stage="app"
            >
                <div style={card}>
                    <div style={row}>
                        {frames.map((frame) => (
                            <div key={frame} style={cell}>
                                <Spinner frame={frame} size={20} />
                                <span style={caption}>{frame}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Specimen>

            <Specimen
                detail="default inherits the surrounding ink · muted · accent (primary)"
                label="Tones"
                number="03"
                stage="surface"
            >
                <div style={card}>
                    {tones.map((tone) => (
                        <div key={tone} style={row}>
                            <Spinner tone={tone} />
                            <Spinner frame={2} tone={tone} />
                            <span style={caption}>{tone}</span>
                        </div>
                    ))}
                </div>
            </Specimen>

            <Specimen
                detail="Inverse tone on the primary surface"
                label="On a dark surface"
                number="04"
                stage="chrome"
            >
                <div
                    style={{
                        ...row,
                        background: "var(--primary)",
                        borderRadius: "var(--radius)",
                        padding: "16px 20px",
                    }}
                >
                    <Spinner tone="inverse" />
                    <Spinner size={20} tone="inverse" />
                </div>
            </Specimen>

            <Specimen
                detail="A button's own work (loading) and work it leads to (working) put the spinner where its icon was"
                label="In a button"
                number="05"
                stage="app"
            >
                <div style={row}>
                    <Button loading size="small" variant="secondary">
                        Saving
                    </Button>
                    <Button loading variant="primary">
                        Publishing
                    </Button>
                    <Button icon="chat" size="small" variant="ghost" working>
                        Chat
                    </Button>
                </div>
            </Specimen>

            <Specimen
                detail="One square, two states · CSS transition, so a square that mounts loading is instant"
                label="LoadingSwap — toggle"
                number="06"
                stage="surface"
            >
                <LoadingSwapSpecimen />
            </Specimen>

            <Specimen
                detail="16px spinner beside 14px UI text, both muted"
                label="Inline with text"
                number="07"
                stage="surface"
            >
                <div style={column}>
                    <div style={{ ...row, gap: "8px" }}>
                        <Spinner tone="muted" />
                        <span
                            style={{
                                color: "var(--muted-foreground)",
                                fontFamily: "var(--font-sans)",
                                fontSize: "14px",
                            }}
                        >
                            Building workspace…
                        </span>
                    </div>
                </div>
            </Specimen>
        </ComponentPage>
    );
}
