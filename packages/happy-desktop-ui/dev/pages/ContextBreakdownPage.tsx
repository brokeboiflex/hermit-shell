import { ContextBreakdown } from "../../src/ContextBreakdown";
import { ComponentPage, Specimen } from "../kit";

/** The component plan this page documents. The selector and the page header read the same value. */
export const componentNumber = "C-351";

/** The side panel's content width at its 280px minimum, and at its default. */
const NARROW = "264px";
const WIDE = "324px";

export function ContextBreakdownPage() {
    return (
        <ComponentPage
            number={componentNumber}
            summary="Where the model's context window has gone, as one stacked bar with a row per part: what the conversation has spent, what is free, and what the daemon holds back to compact in. The long form of the context meter, for a side panel. The daemon measures the conversation as one number, so spent is one part."
            title="Context breakdown"
        >
            <Specimen
                detail="8px bar · 2px gaps · parts grow by their token count · 8px marks · 56px count and 40px share columns · spent is the ink of the text while there is room"
                label="Ample"
                number="01"
                stage="surface"
            >
                <div style={{ display: "flex", gap: "48px" }}>
                    <div style={{ display: "flex", width: NARROW }}>
                        <ContextBreakdown
                            compactTokens={400_000}
                            model="claude-fable-5"
                            totalTokens={1_000_000}
                            usedTokens={120_000}
                        />
                    </div>
                    <div style={{ display: "flex", width: WIDE }}>
                        <ContextBreakdown
                            compactTokens={160_000}
                            model="gpt-5.6-sol"
                            totalTokens={200_000}
                            usedTokens={45_210}
                        />
                    </div>
                </div>
            </Specimen>

            <Specimen
                detail="a model that publishes no compaction point has nothing held back, so the window is only spent and free"
                label="No compaction point"
                number="02"
                stage="surface"
            >
                <div style={{ display: "flex", width: NARROW }}>
                    <ContextBreakdown
                        model="qwen-3-coder"
                        totalTokens={256_000}
                        usedTokens={61_400}
                    />
                </div>
            </Specimen>

            <Specimen
                detail="warning colour within a fifth of the compaction point · error colour at the point itself, where free space is gone and the conversation is spending what was held back · an estimated count is marked ~"
                label="Compaction due"
                number="03"
                stage="surface"
            >
                <div style={{ display: "flex", gap: "48px" }}>
                    <div style={{ display: "flex", width: NARROW }}>
                        <ContextBreakdown
                            compactTokens={400_000}
                            model="claude-fable-5"
                            totalTokens={1_000_000}
                            usedTokens={330_000}
                        />
                    </div>
                    <div style={{ display: "flex", width: NARROW }}>
                        <ContextBreakdown
                            approximate
                            compactTokens={400_000}
                            model="claude-fable-5"
                            totalTokens={1_000_000}
                            usedTokens={405_000}
                        />
                    </div>
                </div>
            </Specimen>

            <Specimen
                detail="the window is known from the model before the provider has measured the conversation · a long model name wraps"
                label="Not measured yet"
                number="04"
                stage="surface"
            >
                <div style={{ display: "flex", width: NARROW }}>
                    <ContextBreakdown
                        compactTokens={160_000}
                        measured={false}
                        model="accounts/fireworks/models/qwen-3-coder-480b-instruct"
                        totalTokens={200_000}
                        usedTokens={0}
                    />
                </div>
            </Specimen>
        </ComponentPage>
    );
}
