import { useState } from "react";
import hermitLogo from "./assets/brand/hermit-logo.png?url";

const greetings = [
    "What should we build today?",
    "What are we making?",
    "Where should we start?",
    "What's on your mind?",
    "Ready when you are.",
    "What shall we work on?",
    "What's the plan?",
    "Got something to ship?",
] as const;

/**
 * The resting face of a conversation with nothing in it: the logo above one
 * line picked at random. The pick is made once per mount, so the line never
 * changes under someone who is reading it.
 */
export function ConversationEmptyGreeting() {
    const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);
    return (
        <div
            className="happy-conversation-greeting"
            data-happy-desktop-ui="conversation-empty-greeting"
        >
            <img alt="" className="happy-conversation-greeting__logo" src={hermitLogo} />
            <h2 className="happy-conversation-greeting__text">{greeting}</h2>
        </div>
    );
}
