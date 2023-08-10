import { TableShape } from "./typesdefine";
import { BitGrid } from "../basic/bitgrid";
import { TableCell } from "./table";
import { BasicArray } from "./basic";
/**
 * 
 * @param table 
 * @param rowStart 
 * @param rowEnd [rowStart, rowEnd]
 * @param colStart 
 * @param colEnd 
 * @param visible 
 */
export function getTableCells(table: TableShape, rowStart: number, rowEnd: number, colStart: number, colEnd: number): TableCell[] {
    const rowHeights = table.rowHeights;
    const colWidths = table.colWidths;

    const cells: TableCell[] = table.childs as (BasicArray<TableCell>);
    const cellLen = cells.length;
    let celli = 0;

    const ret: TableCell[] = [];
    celli += rowStart * rowHeights.length;

    for (let ri = rowStart, rowLen = rowHeights.length; ri < rowLen && celli < cellLen && ri <= rowEnd; ++ri) {
        celli += colStart;
        for (let ci = colStart, colLen = colWidths.length; ci < colLen && celli < cellLen && ci <= colEnd; ++ci, ++celli) {
            const c = cells[celli];
            ret.push(c);
        }
        celli += colWidths.length - colEnd - 1;
    }

    return ret;
}

export function getTableVisibleCells(table: TableShape, rowStart: number, rowEnd: number, colStart: number, colEnd: number): TableCell[] {

    const rowHeights = table.rowHeights;
    const colWidths = table.colWidths;
    const grid: BitGrid = new BitGrid(rowHeights.length, colWidths.length);

    const cells: TableCell[] = table.childs as (BasicArray<TableCell>);
    const cellLen = cells.length;
    let celli = 0;

    const ret: TableCell[] = [];

    for (let ri = 0, rowLen = rowHeights.length; ri < rowLen && celli < cellLen && ri < rowStart; ++ri) {
        for (let ci = 0, colLen = colWidths.length; ci < colLen && celli < cellLen; ++ci, ++celli) {
            if (grid.isSet(ri, ci)) continue;
            const c = cells[celli];
            // fix span
            const rowSpan = c.rowSpan || 1;
            let colSpan = c.colSpan || 1;
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.isSet(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.setBit(ri + i, ci + j);
                }
            }
        }
    }
    for (let ri = rowStart, rowLen = rowHeights.length; ri < rowLen && celli < cellLen && ri <= rowEnd; ++ri) {
        for (let ci = 0, colLen = colWidths.length; ci < colLen && celli < cellLen && ci < colStart; ++ci, ++celli) {
            if (grid.isSet(ri, ci)) continue;
            const c = cells[celli];
            // fix span
            const rowSpan = c.rowSpan || 1;
            let colSpan = c.colSpan || 1;
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.isSet(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.setBit(ri + i, ci + j);
                }
            }
        }
        for (let ci = colStart, colLen = colWidths.length; ci < colLen && celli < cellLen && ci <= colEnd; ++ci, ++celli) {
            if (grid.isSet(ri, ci)) continue;
            const c = cells[celli];
            ret.push(c);
            // fix span
            const rowSpan = c.rowSpan || 1;
            let colSpan = c.colSpan || 1;
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.isSet(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.setBit(ri + i, ci + j);
                }
            }
        }
        for (let ci = colEnd + 1, colLen = colWidths.length; ci < colLen && celli < cellLen; ++ci, ++celli) {
            if (grid.isSet(ri, ci)) continue;
            const c = cells[celli];
            // fix span
            const rowSpan = c.rowSpan || 1;
            let colSpan = c.colSpan || 1;
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.isSet(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.setBit(ri + i, ci + j);
                }
            }
        }
    }

    return ret;
}