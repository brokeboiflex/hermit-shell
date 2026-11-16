import { HappyAgentApiError } from "@slopus/happy-agent-client";
import { describe, expect, it } from "vitest";
import { happyAgentInstructionsStoreCreate } from "./happyAgentInstructionsStore.js";

type Answer = { readonly status: number; readonly instructions?: string };

/** One Happy Agent: the instructions route's answers, in order. */
function server(answers: Answer[]) {
    const sent: string[] = [];
    let last: Answer = { status: 200, instructions: "" };
    const client = {
        async getInstructions() {
            sent.push("GET v0/config/instructions");
            last = answers.shift() ?? last;
            if (last.status !== 200)
                throw new HappyAgentApiError(
                    last.status,
                    `Refused with ${last.status}.`,
                    null,
                    null,
                );
            return { instructions: last.instructions ?? "" };
        },
        async putInstructions(instructions: string) {
            sent.push("PUT v0/config/instructions");
            return { instructions };
        },
    };
    return { client, sent };
}

describe("global instructions on a local Happy Agent", () => {
    it("edits without asking for permissions", async () => {
        const fake = server([{ status: 200, instructions: "Be kind." }]);
        const store = happyAgentInstructionsStoreCreate({ client: fake.client as never });
        const unsubscribe = store.subscribe(() => undefined);
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(store.get().stored).toEqual({ type: "ready", value: "Be kind." });
        expect(fake.sent).toEqual(["GET v0/config/instructions"]);
        unsubscribe();
        store[Symbol.dispose]();
    });
});
