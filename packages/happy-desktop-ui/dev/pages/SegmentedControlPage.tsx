import { SegmentedControl } from "../../src/SegmentedControl";
import { ComponentPage, DimensionRule, Specimen } from "../kit";

/** The component plan this page documents. The selector and the page header read the same value. */
export const componentNumber = "C-022";

const RANGE = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
];

const VIEW = [
    { value: "board", label: "Board", icon: "tasks" as const },
    { value: "list", label: "List", icon: "inbox" as const },
    { value: "timeline", label: "Timeline", icon: "clock" as const },
];

const AVAILABILITY = [
    { value: "auto", label: "Auto" },
    { value: "online", label: "Online" },
    { value: "away", label: "Away" },
    { value: "dnd", label: "Do not disturb" },
];

const SCOPE = [
    { value: "everyone", label: "Everyone" },
    { value: "team", label: "Team" },
];

const ENGINE = [
    { value: "stable", label: "Stable" },
    { value: "next", label: "Next", badge: "Experimental" },
    { value: "legacy", label: "Legacy", disabled: true, title: "No longer offered" },
];

const CONNECTION = [
    { value: "direct", label: "Direct connection", tag: { label: "New" } },
    { value: "relay", label: "Relay connection", tag: { label: "Older clients" } },
];

export function SegmentedControlPage() {
    return (
        <ComponentPage
            number={componentNumber}
            summary="Inline exclusive choice group (2–5 segments) on a single shadcn ToggleGroup: no track, inactive choices sit directly on the surface, and only the selected choice carries the quiet muted fill."
            title="Segmented control"
        >
            <div className="specimen-grid specimen-grid--sizes">
                <Specimen
                    detail="24px high · subheader radio"
                    label="Compact"
                    number="SC-00"
                    stage="app"
                >
                    <div style={{ display: "grid", gap: "8px" }}>
                        <DimensionRule label="height 24" />
                        <SegmentedControl segments={RANGE} size="compact" value="week" />
                    </div>
                </Specimen>
                <Specimen
                    detail="28px high · 12.8px label"
                    label="Small"
                    number="SC-01"
                    stage="app"
                >
                    <div style={{ display: "grid", gap: "8px" }}>
                        <DimensionRule label="height 28" />
                        <SegmentedControl segments={RANGE} size="small" value="week" />
                    </div>
                </Specimen>
                <Specimen detail="32px high · 14px label" label="Medium" number="SC-02" stage="app">
                    <div style={{ display: "grid", gap: "8px" }}>
                        <DimensionRule label="height 32" />
                        <SegmentedControl segments={RANGE} size="medium" value="week" />
                    </div>
                </Specimen>
                <Specimen detail="36px high · 14px label" label="Large" number="SC-03" stage="app">
                    <div style={{ display: "grid", gap: "8px" }}>
                        <DimensionRule label="height 36" />
                        <SegmentedControl segments={RANGE} size="large" value="week" />
                    </div>
                </Specimen>
            </div>

            <div className="specimen-grid">
                <Specimen
                    detail="2 · 3 · 4 segments, equal column widths"
                    label="Segment counts"
                    number="SC-04"
                    stage="surface"
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "16px",
                            padding: "28px",
                        }}
                    >
                        <SegmentedControl segments={SCOPE} value="team" />
                        <SegmentedControl segments={RANGE} value="week" />
                        <SegmentedControl segments={AVAILABILITY} value="online" />
                    </div>
                </Specimen>
            </div>

            <div className="specimen-grid">
                <Specimen
                    detail="leading icon 14/16/16 by size"
                    label="Icon + label"
                    number="SC-05"
                    stage="app"
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "28px",
                        }}
                    >
                        <SegmentedControl segments={VIEW} size="small" value="board" />
                        <SegmentedControl segments={VIEW} size="medium" value="list" />
                        <SegmentedControl segments={VIEW} size="large" value="timeline" />
                    </div>
                </Specimen>
            </div>

            <div className="specimen-grid">
                <Specimen
                    detail="only the selected choice carries the shared selection fill"
                    label="Selection sweep"
                    number="SC-06"
                    stage="surface"
                >
                    <div
                        style={{
                            display: "grid",
                            gap: "12px",
                            padding: "28px",
                            justifyItems: "start",
                        }}
                    >
                        <SegmentedControl segments={AVAILABILITY} value="auto" />
                        <SegmentedControl segments={AVAILABILITY} value="online" />
                        <SegmentedControl segments={AVAILABILITY} value="away" />
                        <SegmentedControl segments={AVAILABILITY} value="dnd" />
                    </div>
                </Specimen>
            </div>

            <div className="specimen-grid">
                <Specimen
                    detail="fullWidth fills the container · disabled 0.5"
                    label="Full width and disabled"
                    number="SC-07"
                    stage="surface"
                >
                    <div style={{ display: "grid", width: "360px", gap: "16px", padding: "28px" }}>
                        <div style={{ display: "grid", gap: "8px" }}>
                            <DimensionRule label="fullWidth — 360px container" />
                            <SegmentedControl fullWidth segments={RANGE} value="week" />
                        </div>
                        <SegmentedControl disabled fullWidth segments={SCOPE} value="everyone" />
                    </div>
                </Specimen>
            </div>

            <div className="specimen-grid">
                <Specimen
                    detail="16px badge overlapping the segment's top-right corner · height unchanged"
                    label="Tags"
                    number="SC-08"
                    stage="surface"
                >
                    <div style={{ display: "grid", gap: "16px", padding: "28px" }}>
                        <DimensionRule label="height 28" />
                        <SegmentedControl segments={CONNECTION} size="small" value="direct" />
                        <SegmentedControl segments={CONNECTION} size="small" value="relay" />
                    </div>
                </Specimen>
            </div>

            <div className="specimen-grid">
                <Specimen
                    detail="inline badge after a label · one disabled segment with a title"
                    label="Badges and disabled segments"
                    number="SC-09"
                    stage="surface"
                >
                    <div style={{ display: "grid", gap: "16px", padding: "28px" }}>
                        <SegmentedControl segments={ENGINE} size="small" value="stable" />
                        <SegmentedControl segments={ENGINE} value="next" />
                    </div>
                </Specimen>
            </div>
        </ComponentPage>
    );
}
