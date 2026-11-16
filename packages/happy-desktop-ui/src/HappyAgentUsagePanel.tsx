import type { CSSProperties } from "react";
import {
    happyAgentProviderServiceName,
    type HappyAgentContextGauge,
    type HappyAgentSessionUsage,
    type HappyAgentUsageGroup,
    type HappyAgentUsageQuota,
    type HappyAgentUsageQuotaWindow,
} from "happy-desktop-state";
import { ContextBreakdown } from "./ContextBreakdown";
import { USAGE_CRITICAL_PERCENT, usagePercentClamp, usageWindowTone } from "./usageTone";

export type HappyAgentUsagePanelProps = {
    /** The projected usage snapshot; omit while the first load is in flight. */
    usage?: HappyAgentSessionUsage;
    /**
     * The conversation's context window, drawn above the accounting as a breakdown of where
     * it has gone. It exists before the first usage reading does, so it is drawn whatever
     * the usage load is doing.
     */
    contextGauge?: HappyAgentContextGauge;
    /** True while a load/poll is in flight (shows a subtle loading affordance). */
    loading?: boolean;
    /** Displayable error from a failed load; replaces the body when set. */
    error?: string;
    /** `panel` fills and scrolls a side-panel tab; the default is inline content. */
    placement?: "content" | "panel";
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
};

const TOKENS = new Intl.NumberFormat("en-US");
const TOKENS_COMPACT = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
});
const COST = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function formatTokens(value: number, compact = false): string {
    return (compact ? TOKENS_COMPACT : TOKENS).format(value);
}

function formatCost(value: number): string {
    // Sub-cent costs still read meaningfully at four decimals; larger ones use two.
    return value > 0 && value < 0.01 ? `$${value.toFixed(4)}` : COST.format(value);
}

const QUOTA_LABELS: Record<HappyAgentUsageQuotaWindow["kind"], string> = {
    fiveHour: "5 hours",
    weekly: "Week",
};

/** Formats an epoch-millis reset time as a short local day/time. */
function formatReset(resetsAt: number): string {
    return new Date(resetsAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function GroupRow(props: { compact: boolean; group: HappyAgentUsageGroup }) {
    const { group } = props;
    const cacheTokens = group.cacheReadTokens + group.cacheWriteTokens;
    const number = (value: number) => formatTokens(value, props.compact);
    const exactTitle = (value: number) => (props.compact ? formatTokens(value) : undefined);
    return (
        <tr className="happy-agent-usage__row" data-happy-desktop-ui="happy-agent-usage-group">
            <th className="happy-agent-usage__model" scope="row" title={group.modelId}>
                {group.modelId}
            </th>
            <td className="happy-agent-usage__num" title={exactTitle(group.inputTokens)}>
                {number(group.inputTokens)}
            </td>
            <td className="happy-agent-usage__num" title={exactTitle(group.outputTokens)}>
                {number(group.outputTokens)}
            </td>
            <td className="happy-agent-usage__num" title={exactTitle(cacheTokens)}>
                {number(cacheTokens)}
            </td>
            <td className="happy-agent-usage__num" title={exactTitle(group.totalTokens)}>
                {number(group.totalTokens)}
            </td>
            <td className="happy-agent-usage__num">{formatCost(group.cost)}</td>
        </tr>
    );
}

function QuotaRow(props: { quota: HappyAgentUsageQuota }) {
    const { quota } = props;
    const name = quota.providerName ?? quota.providerId;
    const service = quota.providerType
        ? happyAgentProviderServiceName(quota.providerType, name)
        : undefined;
    return (
        <div className="happy-agent-usage__quota" data-happy-desktop-ui="happy-agent-usage-quota">
            <span className="happy-agent-usage__quota-provider">
                {service ? `${service} · ${name}` : name}
            </span>
            {quota.windows.length === 0 ? (
                <span className="happy-agent-usage__quota-empty">No limits reported</span>
            ) : (
                quota.windows.map((window) => {
                    const percent = usagePercentClamp(window.usedPercent);
                    return (
                        <span
                            className="happy-agent-usage__quota-window"
                            data-happy-desktop-ui="happy-agent-usage-quota-window"
                            data-tone={usageWindowTone(percent)}
                            key={window.kind}
                        >
                            <span className="happy-agent-usage__quota-label">
                                {QUOTA_LABELS[window.kind]}
                            </span>
                            <span className="happy-agent-usage__quota-bar" aria-hidden="true">
                                <span
                                    className="happy-agent-usage__quota-fill"
                                    data-full={percent >= USAGE_CRITICAL_PERCENT ? "" : undefined}
                                    style={{ width: `${String(percent)}%` }}
                                />
                            </span>
                            <span
                                aria-label={`${String(Math.round(percent))}% of ${QUOTA_LABELS[window.kind]} used`}
                                className="happy-agent-usage__quota-percent"
                                role="img"
                            >
                                {Math.round(percent)}%
                            </span>
                            <span className="happy-agent-usage__quota-reset">
                                resets {formatReset(window.resetsAt)}
                            </span>
                        </span>
                    );
                })
            )}
        </div>
    );
}

/**
 * HappyAgentUsagePanel — presentational token/cost accounting for a session (`/usage`).
 * Renders where the context window has gone, per-model token+cost groups, a
 * session total, and any provider rate-limit windows. Purely
 * driven by a `HappyAgentSessionUsage` snapshot plus loading/error flags, so the owning
 * surface fetches (and polls while visible) and passes the result down. Holds no
 * state and starts no work of its own.
 *
 * The context window is a `ContextBreakdown` when the surface knows the window
 * (`contextGauge`). A model that declares no window has nothing to break down,
 * so its occupancy stays the one line under the table.
 *
 * It is a content block rather than a card: the reading is named and framed by
 * the side-panel tab or other surface that carries it, so it neither repeats
 * that title nor draws a second border inside the first one.
 *
 * A rate-limit window is drawn with the same grammar the provider-usage page
 * uses — name, measure, share, reset, in fixed columns, and monochrome until
 * the share is worth colouring — so the same limit read here and read there is
 * recognisably the same reading rather than two unrelated charts.
 */
export function HappyAgentUsagePanel(props: HappyAgentUsagePanelProps) {
    const { contextGauge, usage } = props;
    const panel = props.placement === "panel";
    const content = (
        <section
            className={["happy-agent-usage", props.className].filter(Boolean).join(" ")}
            data-happy-desktop-ui="happy-agent-usage-panel"
            data-loading={props.loading ? "" : undefined}
            data-placement={panel ? "panel" : undefined}
            data-testid={props["data-testid"]}
            style={props.style}
        >
            {contextGauge ? (
                <ContextBreakdown
                    approximate={contextGauge.approximate}
                    className="happy-agent-usage__context-breakdown"
                    compactTokens={contextGauge.compactTokens}
                    measured={contextGauge.measured}
                    model={usage?.context?.modelId}
                    totalTokens={contextGauge.totalTokens}
                    usedTokens={contextGauge.usedTokens}
                />
            ) : null}
            {props.error !== undefined ? (
                <p
                    className="happy-agent-usage__error"
                    data-happy-desktop-ui="happy-agent-usage-error"
                >
                    {props.error}
                </p>
            ) : usage === undefined ? (
                <p
                    className="happy-agent-usage__empty"
                    data-happy-desktop-ui="happy-agent-usage-empty"
                >
                    Loading usage…
                </p>
            ) : (
                <>
                    <div
                        className="happy-agent-usage__totals"
                        data-happy-desktop-ui="happy-agent-usage-totals"
                    >
                        <span className="happy-agent-usage__total">
                            <span className="happy-agent-usage__total-value">
                                {formatTokens(usage.totalTokens)}
                            </span>
                            <span className="happy-agent-usage__total-label">tokens</span>
                        </span>
                        <span className="happy-agent-usage__total">
                            <span className="happy-agent-usage__total-value">
                                {formatCost(usage.totalCost)}
                            </span>
                            <span className="happy-agent-usage__total-label">cost</span>
                        </span>
                    </div>

                    {usage.groups.length > 0 ? (
                        <table
                            className="happy-agent-usage__table"
                            data-happy-desktop-ui="happy-agent-usage-table"
                        >
                            <thead>
                                <tr>
                                    <th scope="col">Model</th>
                                    <th scope="col">In</th>
                                    <th scope="col">Out</th>
                                    <th scope="col">Cache</th>
                                    <th scope="col">Total</th>
                                    <th scope="col">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usage.groups.map((group) => (
                                    <GroupRow
                                        compact={panel}
                                        group={group}
                                        key={`${group.providerId}:${group.modelId}`}
                                    />
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="happy-agent-usage__empty">No model usage yet.</p>
                    )}

                    {usage.context && contextGauge === undefined ? (
                        <p
                            className="happy-agent-usage__context"
                            data-happy-desktop-ui="happy-agent-usage-context"
                        >
                            Context: {formatTokens(usage.context.totalTokens)} tokens
                            {usage.context.approximate ? " (approximate)" : ""} on{" "}
                            {usage.context.modelId}
                        </p>
                    ) : null}

                    {usage.quotas.length > 0 ? (
                        <div
                            className="happy-agent-usage__quotas"
                            data-happy-desktop-ui="happy-agent-usage-quotas"
                        >
                            {usage.quotas.map((quota) => (
                                <QuotaRow key={quota.providerId} quota={quota} />
                            ))}
                        </div>
                    ) : null}
                </>
            )}
        </section>
    );
    return panel ? (
        <div
            className="happy-agent-usage-panel-scroll"
            data-happy-desktop-ui="happy-agent-usage-panel-scroll"
        >
            <div className="happy-agent-usage-panel-scroll__content">{content}</div>
        </div>
    ) : (
        content
    );
}
