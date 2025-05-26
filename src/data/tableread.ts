/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { TableShape, TableCell, TableLayout } from "./table";
import { TableShape2 } from "./table2";
import { TableCellAttr } from "./typesdefine";
/**
 * 
 * @param table 
 * @param rowStart 
 * @param rowEnd [rowStart, rowEnd]
 * @param colStart 
 * @param colEnd 
 * @param visible 
 */
export function getTableCells<T>(table: TableShape | TableShape2,
    cellGetter: (ri: number, ci: number) => T | undefined,
    rowStart: number,
    rowEnd: number,
    colStart: number,
    colEnd: number): { cell: T | undefined, rowIdx: number, colIdx: number }[] {
    const rowHeights = table.rowHeights;
    const colWidths = table.colWidths;

    // const cells = table.cells;
    let celli = 0;

    const ret: { cell: T | undefined, rowIdx: number, colIdx: number }[] = [];
    celli += rowStart * colWidths.length;

    for (let ri = rowStart, rowLen = rowHeights.length; ri < rowLen && ri <= rowEnd; ++ri) {
        celli += colStart;
        for (let ci = colStart, colLen = colWidths.length; ci < colLen && ci <= colEnd; ++ci, ++celli) {
            // const cellid = rowHeights[ri].id + ',' + colWidths[ci].id;
            // const c = cells.get(cellid);
            const c = cellGetter(ri, ci);
            ret.push({
                cell: c,
                rowIdx: ri,
                colIdx: ci
            });
        }
        celli += colWidths.length - colEnd - 1;
    }

    return ret;
}

// 获取这些行列中可见的表格，用于选中行列等。
export function getTableNotCoveredCells(table: TableShape,
    cellGetter: (ri: number, ci: number) => TableCell | undefined,
    layout: TableLayout,
    rowStart: number,
    rowEnd: number,
    colStart: number,
    colEnd: number): { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] {

    const ret: { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] = [];
    const added: Set<string> = new Set();
    const grid = layout.grid;
    for (let ri = rowStart, rowLen = grid.rowCount; ri < rowLen && ri <= rowEnd; ++ri) {
        for (let ci = colStart, colLen = grid.colCount; ci < colLen && ci <= colEnd; ++ci) {
            const c = grid.get(ri, ci);
            if (c.index.row !== ri || c.index.col !== ci) {
                continue;
            }
            const cell = cellGetter(ri, ci);
            if (!cell) {
                ret.push({
                    cell: undefined,
                    rowIdx: ri,
                    colIdx: ci
                });
            }
            else {
                if (added.has(cell.id)) continue;
                ret.push({
                    cell,
                    rowIdx: ri,
                    colIdx: ci
                });
                added.add(cell.id);
            }
        }
    }
    return ret;
}

// 获取用户实际看见的单元格
export function getTableVisibleCells<T>(cellGetter: (ri: number, ci: number) => T | undefined,
    layout: TableLayout,
    rowStart: number,
    rowEnd: number,
    colStart: number,
    colEnd: number): {
        cell: T | undefined,
        rowIdx: number,
        colIdx: number
    }[] {
    const ret: {
        cell: T | undefined,
        rowIdx: number,
        colIdx: number
    }[] = [];
    const added: Set<string> = new Set();
    const grid = layout.grid;
    for (let ri = rowStart, rowLen = grid.rowCount; ri < rowLen && ri <= rowEnd; ++ri) {
        for (let ci = colStart, colLen = grid.colCount; ci < colLen && ci <= colEnd; ++ci) {
            const c = grid.get(ri, ci);
            const cell = cellGetter(c.index.row, c.index.col);
            if (!cell) {
                ret.push({
                    cell: undefined,
                    rowIdx: c.index.row,
                    colIdx: c.index.col
                });
            }
            else {
                const cid = '' + c.index.row + ',' + c.index.col
                if (added.has(cid)) continue;
                ret.push({
                    cell,
                    rowIdx: c.index.row,
                    colIdx: c.index.col
                });
                added.add(cid);
            }
        }
    }
    return ret;
}