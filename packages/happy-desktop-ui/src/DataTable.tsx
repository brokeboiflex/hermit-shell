import { partitionComponentProps } from "./componentProps";
import { type CSSProperties, type ReactNode } from "react";
import { Checkbox } from "./components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./components/ui/table";
import { cn } from "./lib/utils";
export type DataTableAlign = "start" | "end" | "center";
export type DataTableColumn = {
    id: string;
    header: string;
    align?: DataTableAlign;
    width?: number | string;
};
export type DataTableRow = {
    id: string;
    cells: Record<string, ReactNode | string>;
    selected?: boolean;
    onClick?: () => void;
};
export type DataTableProps = {
    className?: string;
    "data-testid"?: string;
    style?: CSSProperties;
    columns: DataTableColumn[];
    rows: DataTableRow[];
    selectable?: boolean;
    onToggleRow?: (id: string, checked: boolean) => void;
    onToggleAll?: (checked: boolean) => void;
    rowActions?: (row: DataTableRow) => ReactNode;
    empty?: ReactNode;
    dense?: boolean;
    /** Fixed pixel width of the trailing row-actions column. Defaults to 96. */
    actionsWidth?: number;
    /** Accessible label for the selection checkboxes. */
    selectLabel?: string;
};
function colWidth(width?: number | string) {
    if (width === undefined) return undefined;
    return typeof width === "number" ? `${width}px` : width;
}
const alignClass: Record<DataTableAlign, string> = {
    start: "text-left",
    center: "text-center",
    end: "text-right",
};
/*
 * Selection control: shadcn's Checkbox. Its own indicator draws the tick for
 * both checked and mixed, so a mixed box hides that tick and draws a bar in
 * its place (the icon set has no minus), and fills the way a checked one does.
 * A press never reaches the row's own click.
 */
function TableCheckbox(props: {
    checked: boolean;
    indeterminate?: boolean;
    label: string;
    testid: string;
    onChange: (checked: boolean) => void;
}) {
    return (
        <Checkbox
            aria-label={props.label}
            checked={props.indeterminate ? "indeterminate" : props.checked}
            className="happy-data-table__check mx-auto data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:before:h-0.5 data-[state=indeterminate]:before:w-2 data-[state=indeterminate]:before:rounded-full data-[state=indeterminate]:before:bg-current data-[state=indeterminate]:before:content-[''] data-[state=indeterminate]:[&_[data-slot=icon]]:hidden"
            data-happy-desktop-ui={props.testid}
            onCheckedChange={(checked) => props.onChange(checked === true)}
            onClick={(event) => event.stopPropagation()}
        />
    );
}
/**
 * C-030 DataTable — Happy admin table, on shadcn's Table. Column headers with
 * alignment, body rows with optional selection checkboxes, a trailing
 * row-actions slot, dense mode, and an empty slot. Renders a real <table>
 * (tabular data, the genuine two-dimensional case) with fixed column widths,
 * so alignment and truncation resolve to exact geometry. Header and body rows
 * have explicit heights (40/48, 36 dense), and the 16px cell inset matches the
 * text's distance from the frame's top edge.
 */
export function DataTable(props: DataTableProps) {
    const [local] = partitionComponentProps(props, [
        "className",
        "data-testid",
        "style",
        "columns",
        "rows",
        "selectable",
        "onToggleRow",
        "onToggleAll",
        "rowActions",
        "empty",
        "dense",
        "actionsWidth",
        "selectLabel",
    ]);
    const columnCount = () =>
        local.columns.length + (local.selectable ? 1 : 0) + (local.rowActions ? 1 : 0);
    const allSelected = () => local.rows.length > 0 && local.rows.every((row) => row.selected);
    const someSelected = () => local.rows.some((row) => row.selected);
    const headHeight = local.dense ? "h-9" : "h-10";
    const cellHeight = local.dense ? "h-9" : "h-12";
    return (
        <div
            className={cn(
                "happy-data-table overflow-hidden rounded-lg border bg-card font-sans text-card-foreground",
                local.className,
            )}
            data-dense={local.dense ? "" : undefined}
            data-happy-desktop-ui="data-table"
            data-testid={local["data-testid"]}
            style={local.style}
        >
            <Table
                className="happy-data-table__table table-fixed"
                data-happy-desktop-ui="data-table-table"
            >
                <colgroup>
                    {local.selectable ? <col style={{ width: "44px" }} /> : null}
                    {local.columns.map((column) => {
                        const width = colWidth(column.width);
                        return (
                            <col
                                key={column.id}
                                style={width === undefined ? undefined : { width }}
                            />
                        );
                    })}
                    {local.rowActions ? (
                        <col style={{ width: `${local.actionsWidth ?? 96}px` }} />
                    ) : null}
                </colgroup>
                <TableHeader
                    className="happy-data-table__head"
                    data-happy-desktop-ui="data-table-head"
                >
                    <TableRow
                        className="happy-data-table__head-row hover:bg-transparent"
                        data-happy-desktop-ui="data-table-head-row"
                    >
                        {local.selectable ? (
                            <TableHead
                                className={cn(
                                    "happy-data-table__th happy-data-table__th--select px-0 text-center",
                                    headHeight,
                                )}
                                data-align="center"
                                scope="col"
                            >
                                <TableCheckbox
                                    checked={allSelected()}
                                    indeterminate={!allSelected() && someSelected()}
                                    label={local.selectLabel ?? "Select all rows"}
                                    onChange={(checked) => local.onToggleAll?.(checked)}
                                    testid="data-table-select-all"
                                />
                            </TableHead>
                        ) : null}
                        {local.columns.map((column) => (
                            <TableHead
                                className={cn(
                                    "happy-data-table__th px-4",
                                    headHeight,
                                    alignClass[column.align ?? "start"],
                                )}
                                key={column.id}
                                data-align={column.align ?? "start"}
                                data-column-id={column.id}
                                scope="col"
                            >
                                <span
                                    className="happy-data-table__head-label block max-w-full truncate"
                                    data-happy-desktop-ui="data-table-header"
                                >
                                    {column.header}
                                </span>
                            </TableHead>
                        ))}
                        {local.rowActions ? (
                            <TableHead
                                className={cn(
                                    "happy-data-table__th happy-data-table__th--actions px-4 text-right",
                                    headHeight,
                                )}
                                data-align="end"
                                scope="col"
                            >
                                <span
                                    className="happy-data-table__sr sr-only"
                                    data-happy-desktop-ui="data-table-actions-header"
                                >
                                    Actions
                                </span>
                            </TableHead>
                        ) : null}
                    </TableRow>
                </TableHeader>
                <TableBody
                    className="happy-data-table__body"
                    data-happy-desktop-ui="data-table-body"
                >
                    {local.rows.length > 0 ? (
                        local.rows.map((row) => (
                            <TableRow
                                className={cn(
                                    "happy-data-table__row",
                                    row.onClick && "cursor-pointer",
                                )}
                                key={row.id}
                                data-clickable={row.onClick ? "" : undefined}
                                data-happy-desktop-ui="data-table-row"
                                data-row-id={row.id}
                                data-selected={row.selected ? "" : undefined}
                                data-state={row.selected ? "selected" : undefined}
                                onClick={() => row.onClick?.()}
                            >
                                {local.selectable ? (
                                    <TableCell
                                        className={cn(
                                            "happy-data-table__td happy-data-table__td--select px-0 py-0 text-center",
                                            cellHeight,
                                        )}
                                        data-align="center"
                                    >
                                        <TableCheckbox
                                            checked={row.selected ?? false}
                                            label={local.selectLabel ?? "Select row"}
                                            onChange={(checked) =>
                                                local.onToggleRow?.(row.id, checked)
                                            }
                                            testid="data-table-select-row"
                                        />
                                    </TableCell>
                                ) : null}
                                {local.columns.map((column) => (
                                    <TableCell
                                        className={cn(
                                            "happy-data-table__td px-4 py-0",
                                            cellHeight,
                                            alignClass[column.align ?? "start"],
                                        )}
                                        key={column.id}
                                        data-align={column.align ?? "start"}
                                        data-column-id={column.id}
                                    >
                                        <span
                                            className="happy-data-table__cell block max-w-full truncate"
                                            data-happy-desktop-ui="data-table-cell"
                                        >
                                            {row.cells[column.id]}
                                        </span>
                                    </TableCell>
                                ))}
                                {local.rowActions ? (
                                    <TableCell
                                        className={cn(
                                            "happy-data-table__td happy-data-table__td--actions px-4 py-0 text-right",
                                            cellHeight,
                                        )}
                                        data-align="end"
                                    >
                                        <span
                                            className="happy-data-table__actions inline-flex items-center justify-end gap-1 align-middle"
                                            data-happy-desktop-ui="data-table-actions"
                                        >
                                            {local.rowActions!(row)}
                                        </span>
                                    </TableCell>
                                ) : null}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow className="happy-data-table__empty-row hover:bg-transparent">
                            <TableCell
                                className="happy-data-table__empty-cell px-4 py-8 text-center whitespace-normal text-muted-foreground"
                                colSpan={columnCount()}
                                data-happy-desktop-ui="data-table-empty"
                            >
                                {local.empty}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
