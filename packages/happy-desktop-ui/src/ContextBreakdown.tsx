import type { CSSProperties } from "react";
import {
    contextCompactFraction,
    contextCompactTokens,
    contextTokensFormat,
    contextWindowTone,
} from "./contextWindowTone";

export interface ContextBreakdownProps {
    readonly className?: string;
    readonly "data-testid"?: string;
    readonly style?: CSSProperties;
    /** Tokens already spent in the window. */
    readonly usedTokens: number;
    /** The whole context window. */
    readonly totalTokens: number;
    /**
     * Tokens at which the daemon compacts the conversation on its own. The window past this
     * point is what it holds back to compact in, drawn as a part of its own; without it the
     * window is only spent and free.
     */
    readonly compactTokens?: number;
    /** True when the underlying count is estimated rather than reported. */
    readonly approximate?: boolean;
    /** False while the model window is known but no provider measurement exists yet. */
    readonly measured?: boolean;
    /** The model whose window this is. */
    readonly model?: string;
}

interface ContextBreakdownPart {
    readonly id: "used" | "free" | "buffer";
    readonly label: string;
    readonly tokens: number;
    /** False for a count that follows from a measurement nobody has made yet. */
    readonly known: boolean;
    /** True for a count that follows from an estimated measurement. */
    readonly approximate: boolean;
}

const TOKENS = new Intl.NumberFormat("en-US");

function shareFormat(tokens: number, total: number, approximate: boolean): string {
    if (total === 0 || tokens === 0) return "0%";
    const percent = (tokens / total) * 100;
    if (percent < 1) return "<1%";
    return `${approximate ? "~" : ""}${String(Math.round(percent))}%`;
}

/**
 * ContextBreakdown — where the model's context window has gone: what the
 * conversation has spent, what is still free, and what the daemon holds back
 * so that it has room to compact.
 *
 * It is the long form of `ContextMeter`. The meter answers "does one more
 * message fit" from the composer; this answers "where did the window go" in a
 * side panel, as one stacked bar with a row per part beneath it. Both read the
 * same measurement and take colour at the same points.
 *
 * The parts are the ones the daemon reports. It measures the conversation as
 * one number, so the spent share is one part rather than a guess at what is
 * inside it.
 *
 * A content block rather than a card: the panel that carries it frames it.
 */
export function ContextBreakdown(props: ContextBreakdownProps) {
    const total = Math.max(0, props.totalTokens);
    const measured = props.measured !== false;
    const approximate = props.approximate === true;
    const used = measured ? Math.max(0, Math.min(props.usedTokens, total)) : 0;
    const compact = contextCompactTokens(total, props.compactTokens);
    // Past its compaction point the conversation is spending what was held
    // back, so that part shrinks and nothing is free; before it, it is whole.
    const buffer = compact === undefined ? 0 : total - Math.max(used, compact);
    const free = total - used - buffer;
    const fraction = total === 0 ? 0 : used / total;
    const tone = contextWindowTone(fraction, contextCompactFraction(total, props.compactTokens));
    const parts: readonly ContextBreakdownPart[] = [
        { id: "used", label: "Used", tokens: used, known: measured, approximate },
        {
            id: "free",
            label: "Free space",
            tokens: free,
            known: measured,
            // Nothing free is exact however the count was reached: it is what
            // the compaction point leaves, not a remainder of the estimate.
            approximate: approximate && free > 0,
        },
        ...(compact === undefined
            ? []
            : [
                  {
                      id: "buffer",
                      label: "Auto-compact buffer",
                      tokens: buffer,
                      known: true,
                      // Whole until the conversation runs into it; after that it is
                      // what the measurement leaves, and as exact as that is.
                      approximate: approximate && used > compact,
                  } satisfies ContextBreakdownPart,
              ]),
    ];
    const count = (tokens: number, estimated: boolean) =>
        `${estimated ? "~" : ""}${contextTokensFormat(tokens)}`;
    return (
        <section
            aria-label="Context window"
            className={["happy-context-breakdown", props.className].filter(Boolean).join(" ")}
            data-happy-desktop-ui="context-breakdown"
            data-testid={props["data-testid"]}
            data-tone={tone}
            style={props.style}
        >
            <div className="happy-context-breakdown__heading">
                <div className="happy-context-breakdown__header">
                    <span className="happy-context-breakdown__title">Context window</span>
                    <span
                        className="happy-context-breakdown__percent"
                        data-happy-desktop-ui="context-breakdown-percent"
                    >
                        {measured ? `${shareFormat(used, total, approximate)} used` : "—"}
                    </span>
                </div>
                <p className="happy-context-breakdown__caption">
                    {measured
                        ? `${count(used, approximate)} of ${contextTokensFormat(total)} tokens`
                        : `${contextTokensFormat(total)} tokens`}
                    {props.model === undefined ? "" : ` on ${props.model}`}
                    {measured ? "" : ", not measured yet"}
                </p>
            </div>
            {/* The rows below say everything the bar shows, in words. */}
            <div
                aria-hidden="true"
                className="happy-context-breakdown__bar"
                data-happy-desktop-ui="context-breakdown-bar"
            >
                {parts.map((part) =>
                    part.tokens > 0 ? (
                        <span
                            className="happy-context-breakdown__segment"
                            data-happy-desktop-ui="context-breakdown-segment"
                            data-part={part.id}
                            key={part.id}
                            style={{ flexGrow: part.tokens }}
                        />
                    ) : null,
                )}
            </div>
            <ul className="happy-context-breakdown__legend">
                {parts.map((part) => (
                    <li
                        className="happy-context-breakdown__row"
                        data-happy-desktop-ui="context-breakdown-row"
                        data-part={part.id}
                        key={part.id}
                    >
                        <span
                            aria-hidden="true"
                            className="happy-context-breakdown__swatch"
                            data-part={part.id}
                        />
                        <span className="happy-context-breakdown__label">{part.label}</span>
                        <span
                            className="happy-context-breakdown__tokens"
                            title={part.known ? `${TOKENS.format(part.tokens)} tokens` : undefined}
                        >
                            {part.known ? count(part.tokens, part.approximate) : "—"}
                        </span>
                        <span className="happy-context-breakdown__share">
                            {part.known ? shareFormat(part.tokens, total, part.approximate) : "—"}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
