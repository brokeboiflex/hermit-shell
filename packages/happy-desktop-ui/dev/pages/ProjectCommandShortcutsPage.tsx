import { ComponentPage, Specimen } from "../kit";
import { ProjectCommandShortcutsExample } from "./ProjectCommandShortcutsExample";

export const componentNumber = "C-349";

export function ProjectCommandShortcutsPage() {
    return (
        <ComponentPage
            number={componentNumber}
            title="Project command shortcuts"
            summary="User-defined commands pinned in the project summary. Add, edit and remove are interactive; this fixture never executes a command."
        >
            <Specimen
                number="01"
                label="Pinned commands"
                detail="Command rows with persistent edit/remove menus"
                stage="surface"
            >
                <div style={{ width: 296 }}>
                    <ProjectCommandShortcutsExample />
                </div>
            </Specimen>
            <Specimen
                number="02"
                label="No commands yet"
                detail="The add action is always available"
                stage="surface"
            >
                <div style={{ width: 296 }}>
                    <ProjectCommandShortcutsExample empty />
                </div>
            </Specimen>
            <Specimen
                number="03"
                label="Offline"
                detail="Editing stays available while execution is disabled"
                stage="surface"
            >
                <div style={{ width: 296 }}>
                    <ProjectCommandShortcutsExample unavailable="Reconnect to run shortcuts." />
                </div>
            </Specimen>
        </ComponentPage>
    );
}
