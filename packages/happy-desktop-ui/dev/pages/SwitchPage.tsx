import { Switch } from "../../src/Switch";
import { ComponentPage, DimensionRule, Specimen } from "../kit";

/** The component plan this page documents. The selector and the page header read the same value. */
export const componentNumber = "C-020";

export function SwitchPage() {
    return (
        <ComponentPage
            number={componentNumber}
            summary="shadcn Switch (Radix) in a horizontal shadcn Field — two sizes, on/off with primary vs input track, optional label and muted description, disabled state."
            title="Switch"
        >
            <div className="specimen-grid specimen-grid--sizes">
                <Specimen
                    detail="track 32×18.4 · thumb 16"
                    label="Medium"
                    number="S-01"
                    stage="surface"
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "14px",
                            padding: "28px",
                        }}
                    >
                        <div style={{ width: "120px" }}>
                            <DimensionRule label="track 32 × 18.4" />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                            <Switch aria-label="Off" checked={false} size="medium" />
                            <Switch aria-label="On" checked size="medium" />
                        </div>
                    </div>
                </Specimen>
                <Specimen
                    detail="track 24×14 · thumb 12"
                    label="Small"
                    number="S-02"
                    stage="surface"
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "14px",
                            padding: "28px",
                        }}
                    >
                        <div style={{ width: "120px" }}>
                            <DimensionRule label="track 24 × 14" />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                            <Switch aria-label="Off" checked={false} size="small" />
                            <Switch aria-label="On" checked size="small" />
                        </div>
                    </div>
                </Specimen>
                <Specimen
                    detail="opacity 0.5 · not-allowed"
                    label="Disabled"
                    number="S-03"
                    stage="surface"
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "18px",
                            padding: "28px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                            <Switch aria-label="Off disabled" checked={false} disabled />
                            <Switch aria-label="On disabled" checked disabled />
                        </div>
                    </div>
                </Specimen>
            </div>

            <div className="specimen-grid">
                <Specimen
                    detail="label 14 · track on the label line · 8px gap"
                    label="With label"
                    number="S-04"
                    stage="app"
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            padding: "28px",
                        }}
                    >
                        <Switch checked label="Enable notifications" />
                        <Switch checked={false} label="Play join sound" />
                        <Switch checked disabled label="Read receipts (locked)" />
                    </div>
                </Specimen>
                <Specimen
                    detail="description 14 muted below the label"
                    label="Label and description"
                    number="S-05"
                    stage="surface"
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "18px",
                            padding: "28px",
                        }}
                    >
                        <Switch
                            checked
                            description="Push alerts to this device"
                            label="Notifications"
                        />
                        <Switch
                            checked={false}
                            description="Show a denser message layout"
                            label="Compact mode"
                            size="small"
                        />
                    </div>
                </Specimen>
            </div>
        </ComponentPage>
    );
}
