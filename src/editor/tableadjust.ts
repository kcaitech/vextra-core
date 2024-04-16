import { TableView } from "../dataview";
import { Page } from "../data/page";
import { TableShape } from "../data/table";
import { Api } from "./coop/recordapi";

const MinCellSize = TableShape.MinCellSize;

/**
 * 
 * @param table 
 * @param fromIdx 
 * @param toIdx 
 * @param dx 
 * @param api 
 * @returns 
 */
export function adjColum(page: Page, table: TableView, fromIdx: number, toIdx: number, dx: number, api: Api) {
    if (dx === 0 || fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
        return;
    }
    const colWidths = table.colWidths;
    if (fromIdx >= colWidths.length || toIdx >= colWidths.length) {
        return;
    }
    const total = table.widthTotalWeights;
    const frame = table.frame;

    let fromWidth = colWidths[fromIdx].value / total * frame.width;
    let toWidth = colWidths[toIdx].value / total * frame.width;

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

    // to weight
    const fromWeight = fromWidth / frame.width * total;
    const toWeight = toWidth / frame.width * total;

    api.tableModifyColWidth(page, table.data, fromIdx, fromWeight);
    api.tableModifyColWidth(page, table.data, toIdx, toWeight);
}


export function adjRow(page: Page, table: TableView, fromIdx: number, toIdx: number, dx: number, api: Api) {
    if (dx === 0 || fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
        return;
    }

    const rowHeights = table.rowHeights;
    if (fromIdx >= rowHeights.length || toIdx >= rowHeights.length) {
        return;
    }
    const total = table.heightTotalWeights;
    const frame = table.frame;

    let fromHeight = rowHeights[fromIdx].value / total * frame.height;
    let toHeight = rowHeights[toIdx].value / total * frame.height;

    const totalWidth = fromHeight + toHeight;

    fromHeight -= dx;
    toHeight += dx;
    if (dx < 0) {
        if (toHeight < MinCellSize) {
            toHeight = Math.min(toHeight - dx, MinCellSize);
            fromHeight = totalWidth - toHeight;
        }
    }
    else {
        if (fromHeight < MinCellSize) {
            fromHeight = Math.min(fromHeight + dx, MinCellSize);
            toHeight = totalWidth - fromHeight;
        }
    }

    // to weight
    const fromWeight = fromHeight / frame.height * total;
    const toWeight = toHeight / frame.height * total;

    api.tableModifyRowHeight(page, table.data, fromIdx, fromWeight);
    api.tableModifyRowHeight(page, table.data, toIdx, toWeight);
}