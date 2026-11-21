import { Checkbox } from "../../src/Checkbox";
import { ComponentPage, DimensionRule, Specimen } from "../kit";

/** The component plan this page documents. The selector and the page header read the same value. */
export const componentNumber = "C-021";

export function CheckboxPage() {
    return (
        <ComponentPage
            number={componentNumber}
            summary="shadcn Checkbox (Radix) in a horizontal shadcn Field — 16px box, check glyph, symmetric indeterminate bar, primary fill, focus ring; the label is the control's own."
            title="Checkbox"
        >
            <div className="specimen-grid">
                <Specimen
                    detail="unchecked · checked · indeterminate · disabled"
                    label="States"
                    number="C-021a"
                    stage="surface"
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "16px",
                            padding: "28px",
                        }}
                    >
                        <Checkbox checked={false} label="Enable notifications" />
                        <Checkbox checked label="Enable notifications" />
                        <Checkbox checked={false} indeterminate label="Enable notifications" />
                        <Checkbox checked={false} disabled label="Enable notifications" />
                        <Checkbox checked disabled label="Enable notifications" />
                    </div>
                </Specimen>

                <Specimen
                    detail="16×16 box · 4px radius · 1px input border · primary fill"
                    label="Control box"
                    number="C-021b"
                    stage="surface"
                >
                    <div
                        style={{
                            display: "grid",
                            gap: "12px",
                            justifyItems: "center",
                            padding: "28px",
                        }}
                    >
                        <DimensionRule label="box 16 · gap 8" />
                        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                            <Checkbox aria-label="Unchecked" checked={false} />
                            <Checkbox aria-label="Checked" checked />
                            <Checkbox aria-label="Mixed" checked={false} indeterminate />
                        </div>
                    </div>
                </Specimen>
            </div>

            <div className="specimen-grid">
                <Specimen
                    detail="selection column — mirrors DataTable header + rows"
                    label="In context"
                    number="C-021c"
                    stage="surface"
                >
                    <div
                        style={{
                            display: "grid",
                            gap: "10px",
                            padding: "28px",
                            width: "320px",
                            justifyItems: "start",
                        }}
                    >
                        <Checkbox checked={false} indeterminate label="Select all (3 of 5)" />
                        <Checkbox checked label="ENG-482 · Deploy checklist" />
                        <Checkbox checked label="ENG-511 · Umbrella retrospective" />
                        <Checkbox checked={false} label="ENG-530 · Access review" />
                    </div>
                </Specimen>
            </div>
        </ComponentPage>
    );
}
