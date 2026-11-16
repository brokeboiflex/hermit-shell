import type { HappyAgentContextGauge, HappyAgentSessionUsage } from "happy-desktop-state";
import { HappyAgentUsagePanel } from "../../src/HappyAgentUsagePanel";
import { ComponentPage, Specimen } from "../kit";

/** The component plan this page documents. The selector and the page header read the same value. */
export const componentNumber = "C-156";

// Fixed reset time keeps the blueprint deterministic and screenshot-safe.
const RESET = Date.UTC(2026, 6, 25, 17, 0, 0);

const usage: HappyAgentSessionUsage = {
    currentProviderId: "openai",
    groups: [
        {
            modelId: "gpt-5.6-sol",
            providerId: "openai",
            inputTokens: 128_400,
            outputTokens: 24_100,
            cacheReadTokens: 96_000,
            cacheWriteTokens: 12_000,
            totalTokens: 260_500,
            reasoningTokens: 8_200,
            cost: 1.42,
        },
        {
            modelId: "sonnet-5",
            providerId: "anthropic",
            inputTokens: 32_000,
            outputTokens: 9_800,
            cacheReadTokens: 4_000,
            cacheWriteTokens: 1_200,
            totalTokens: 47_000,
            cost: 0.31,
        },
    ],
    totalTokens: 307_500,
    totalCost: 1.73,
    context: {
        modelId: "gpt-5.6-sol",
        providerId: "openai",
        totalTokens: 184_200,
        approximate: true,
    },
    quotas: [
        {
            providerId: "openai",
            windows: [
                { kind: "fiveHour", usedPercent: 42, resetsAt: RESET },
                { kind: "weekly", usedPercent: 93, resetsAt: RESET },
            ],
        },
    ],
};

const contextGauge: HappyAgentContextGauge = {
    usedTokens: 184_200,
    remainingTokens: 215_800,
    totalTokens: 400_000,
    remainingFraction: 0.5395,
    compactTokens: 272_000,
    approximate: true,
};

export function HappyAgentUsagePanelPage() {
    return (
        <ComponentPage
            number={componentNumber}
            summary="Happy Agent session usage (`/usage`): where the context window has gone, session totals, per-model token/cost table, and provider rate-limit windows."
            title="HappyAgentUsagePanel"
        >
            <Specimen
                detail="a session with two models, the context window broken down above the accounting, and quota windows"
                label="Populated"
                number="01"
                stage="surface"
            >
                <div style={{ width: "560px" }}>
                    <HappyAgentUsagePanel contextGauge={contextGauge} usage={usage} />
                </div>
            </Specimen>

            <Specimen
                detail="the closeable right-sidebar tab at its narrow working width, with compact model totals and wrapped reset times"
                label="Side panel"
                number="02"
                stage="surface"
            >
                <div style={{ display: "flex", height: "520px", width: "280px" }}>
                    <HappyAgentUsagePanel
                        contextGauge={contextGauge}
                        placement="panel"
                        usage={usage}
                    />
                </div>
            </Specimen>

            <Specimen
                detail="first load in flight, no snapshot yet · the window is already known, so it is drawn"
                label="Loading"
                number="03"
                stage="surface"
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "32px",
                        width: "560px",
                    }}
                >
                    <HappyAgentUsagePanel loading />
                    <HappyAgentUsagePanel
                        contextGauge={{
                            usedTokens: 0,
                            remainingTokens: 400_000,
                            totalTokens: 400_000,
                            remainingFraction: 1,
                            compactTokens: 272_000,
                            approximate: false,
                            measured: false,
                        }}
                        loading
                    />
                </div>
            </Specimen>

            <Specimen detail="load failed" label="Error" number="04" stage="surface">
                <div style={{ width: "560px" }}>
                    <HappyAgentUsagePanel error="Usage is unavailable for this session." />
                </div>
            </Specimen>

            <Specimen
                detail="a model that declares no window has nothing to break down, so its occupancy is one line under the table"
                label="No declared window"
                number="05"
                stage="surface"
            >
                <div style={{ width: "560px" }}>
                    <HappyAgentUsagePanel usage={usage} />
                </div>
            </Specimen>
        </ComponentPage>
    );
}
