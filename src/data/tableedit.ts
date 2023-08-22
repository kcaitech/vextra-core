import { BasicArray } from "./basic";
import { Border, Fill, Style, Shadow } from "./style";
import { TableCell, TableShape } from "./table";

export function tableInsertRow(table: TableShape, idx: number, height: number, data: TableCell[]) {
    table.rowHeights.splice(idx, 0, height);
    const childs = table.childs as BasicArray<TableCell>;
    const row = [];
    for (let i = 0, count = table.colWidths.length; i < count; ++i) {
        const cell = data[i];
        if (!cell) throw new Error("cell is undefined")
        row.push(cell);
    }
    childs.splice(idx * table.colWidths.length, 0, ...row);
}

export function tableRemoveRow(table: TableShape, idx: number) {
    table.rowHeights.splice(idx, 1);
    const childs = table.childs as BasicArray<TableCell>;
    const colCount = table.colWidths.length;
    return childs.splice(idx * colCount, colCount);
}

export function tableInsertCol(table: TableShape, idx: number, width: number, data: TableCell[]) {
    table.colWidths.splice(idx, 0, width);
    const childs = table.childs as BasicArray<TableCell>;
    const colCount = table.colWidths.length;
    for (let i = 0, count = table.rowHeights.length; i < count; ++i) {
        const cell = data[i];
        if (!cell) throw new Error("cell is undefined")
        childs.splice(i * colCount + idx, 0, cell);
    }
}

export function tableRemoveCol(table: TableShape, idx: number) {
    table.colWidths.splice(idx, 1);
    const childs = table.childs as BasicArray<TableCell>;
    const colCount = table.colWidths.length;
    const removed = [];
    for (let i = 0, count = table.rowHeights.length; i < count; ++i) {
        removed.push(...childs.splice(i * colCount + idx - i, 1));
    }
    return removed;
}
