/**
 * How a context window is spoken about, shared by every surface that shows
 * one. The composer's meter and the side panel's breakdown read the same
 * measurement from the same daemon, so where compaction is marked, when the
 * window starts saying so in colour, and how a token count is spelled have to
 * be one decision rather than two that drift.
 */
export type ContextWindowTone = "ample" | "compact" | "critical";

/** Where compaction is marked when the model publishes no threshold of its own. */
const DEFAULT_COMPACT_FRACTION = 0.75;
/**
 * A window takes its warning colour once the fill is within this share of the compaction point,
 * so it turns yellow while there is still room to finish a thought, and its error colour at the
 * point itself, when the next turn compacts.
 */
const WARNING_MARGIN = 0.2;

/** The model's own compaction point, when it publishes one inside the window. */
export function contextCompactTokens(
    totalTokens: number,
    compactTokens?: number,
): number | undefined {
    return compactTokens !== undefined && compactTokens > 0 && compactTokens < totalTokens
        ? compactTokens
        : undefined;
}

/** The share of the window at which compaction is marked. */
export function contextCompactFraction(totalTokens: number, compactTokens?: number): number {
    const published = contextCompactTokens(totalTokens, compactTokens);
    return published === undefined ? DEFAULT_COMPACT_FRACTION : published / totalTokens;
}

export function contextWindowTone(fraction: number, compactFraction: number): ContextWindowTone {
    if (fraction >= compactFraction) return "critical";
    if (fraction >= compactFraction * (1 - WARNING_MARGIN)) return "compact";
    return "ample";
}

export function contextTokensFormat(tokens: number): string {
    if (tokens < 1000) return String(Math.max(0, Math.round(tokens)));
    const thousands = tokens / 1000;
    if (thousands < 1000)
        return `${thousands < 100 ? thousands.toFixed(1).replace(/\.0$/, "") : String(Math.round(thousands))}k`;
    const millions = thousands / 1000;
    return `${millions.toFixed(1).replace(/\.0$/, "")}M`;
}
