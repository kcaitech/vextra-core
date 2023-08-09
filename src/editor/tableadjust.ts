
import { TableCell, TableShape } from "../data/table";
import { Api } from "./command/recordapi";

export const MinCellSize = TableCell.MinCellSize;

export function adjColum(table: TableShape, fromIdx: number, toIdx: number, dx: number, api: Api) {
    if (dx === 0 || fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
        return;
    }

    const colWidths = table.colWidths;
    if (fromIdx >= colWidths.length || toIdx >= colWidths.length) {
        return;
    }

    const frame = table.frame;

    let fromWidth = colWidths[fromIdx] * frame.width;
    let toWidth = colWidths[toIdx] * frame.width;

    const totalWidth = fromWidth + toWidth;

    fromWidth -= dx;
    toWidth += dx;
    if (dx < 0) {
        if (toWidth < MinCellSize) {
            toWidth = Math.min(toWidth - dx, MinCellSize);
            fromWidth = totalWidth - toWidth;
        }
    }
    else {
        if (fromWidth < MinCellSize) {
            fromWidth = Math.min(fromWidth + dx, MinCellSize);
            toWidth = totalWidth - fromWidth;
        }
    }

    // todo
    colWidths[fromIdx] = fromWidth / frame.width;
    colWidths[toIdx] = toWidth / frame.width;
}


export function adjRow(table: TableShape, fromIdx: number, toIdx: number, dx: number, api: Api) {
    if (dx === 0 || fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
        return;
    }

    const rowHeights = table.rowHeights;
    if (fromIdx >= rowHeights.length || toIdx >= rowHeights.length) {
        return;
    }

    const frame = table.frame;

    let fromWidth = rowHeights[fromIdx] * frame.height;
    let toWidth = rowHeights[toIdx] * frame.height;

    const totalWidth = fromWidth + toWidth;

    fromWidth -= dx;
    toWidth += dx;
    if (dx < 0) {
        if (toWidth < MinCellSize) {
            toWidth = Math.min(toWidth - dx, MinCellSize);
            fromWidth = totalWidth - toWidth;
        }
    }
    else {
        if (fromWidth < MinCellSize) {
            fromWidth = Math.min(fromWidth + dx, MinCellSize);
            toWidth = totalWidth - fromWidth;
        }
    }

    // todo
    rowHeights[fromIdx] = fromWidth / frame.height;
    rowHeights[toIdx] = toWidth / frame.height;
}