import { TableShape } from "./typesdefine";
import { BitGrid, Grid } from "../basic/grid";
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

// 获取这些行列中可见的表格，用于选中行列等。
export function getTableNotCoveredCells(table: TableShape, rowStart: number, rowEnd: number, colStart: number, colEnd: number): TableCell[] {

    const rowHeights = table.rowHeights;
    const colWidths = table.colWidths;
    const grid: BitGrid = new BitGrid(rowHeights.length, colWidths.length);

    const cells: TableCell[] = table.childs as (BasicArray<TableCell>);
    const cellLen = cells.length;
    let celli = 0;

    const ret: TableCell[] = [];

    for (let ri = 0, rowLen = rowHeights.length; ri < rowLen && celli < cellLen && ri < rowStart; ++ri) {
        for (let ci = 0, colLen = colWidths.length; ci < colLen && celli < cellLen; ++ci, ++celli) {
            if (grid.get(ri, ci)) continue;
            const c = cells[celli];
            // fix span
            const rowSpan = Math.min(c.rowSpan || 1, rowLen - ri)
            let colSpan = Math.min(c.colSpan || 1, colLen - ci);
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.get(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.set(ri + i, ci + j, true);
                }
            }
        }
    }
    for (let ri = rowStart, rowLen = rowHeights.length; ri < rowLen && celli < cellLen && ri <= rowEnd; ++ri) {
        for (let ci = 0, colLen = colWidths.length; ci < colLen && celli < cellLen && ci < colStart; ++ci, ++celli) {
            if (grid.get(ri, ci)) continue;
            const c = cells[celli];
            // fix span
            const rowSpan = Math.min(c.rowSpan || 1, rowLen - ri)
            let colSpan = Math.min(c.colSpan || 1, colLen - ci);
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.get(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.set(ri + i, ci + j, true);
                }
            }
        }
        for (let ci = colStart, colLen = colWidths.length; ci < colLen && celli < cellLen && ci <= colEnd; ++ci, ++celli) {
            if (grid.get(ri, ci)) continue;
            const c = cells[celli];
            ret.push(c);
            // fix span
            const rowSpan = Math.min(c.rowSpan || 1, rowLen - ri)
            let colSpan = Math.min(c.colSpan || 1, colLen - ci);
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.get(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.set(ri + i, ci + j, true);
                }
            }
        }
        for (let ci = colEnd + 1, colLen = colWidths.length; ci < colLen && celli < cellLen; ++ci, ++celli) {
            if (grid.get(ri, ci)) continue;
            const c = cells[celli];
            // fix span
            const rowSpan = Math.min(c.rowSpan || 1, rowLen - ri)
            let colSpan = Math.min(c.colSpan || 1, colLen - ci);
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.get(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.set(ri + i, ci + j, true);
                }
            }
        }
    }

    return ret;
}

// 获取用户实际看见的单元格
export function getTableVisibleCells(table: TableShape, rowStart: number, rowEnd: number, colStart: number, colEnd: number): TableCell[] {

    const rowHeights = table.rowHeights;
    const colWidths = table.colWidths;
    const grid: Grid<TableCell> = new Grid<TableCell>(rowHeights.length, colWidths.length);

    const cells: TableCell[] = table.childs as (BasicArray<TableCell>);
    const cellLen = cells.length;
    let celli = 0;

    for (let ri = 0, rowLen = rowHeights.length; ri < rowLen && celli < cellLen && ri < rowStart; ++ri) {
        for (let ci = 0, colLen = colWidths.length; ci < colLen && celli < cellLen; ++ci, ++celli) {
            if (grid.get(ri, ci)) continue;
            const c = cells[celli];
            // fix span
            const rowSpan = Math.min(c.rowSpan || 1, rowLen - ri)
            let colSpan = Math.min(c.colSpan || 1, colLen - ci);
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.get(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.set(ri + i, ci + j, c);
                }
            }
        }
    }
    for (let ri = rowStart, rowLen = rowHeights.length; ri < rowLen && celli < cellLen && ri <= rowEnd; ++ri) {
        for (let ci = 0, colLen = colWidths.length; ci < colLen && celli < cellLen && ci < colStart; ++ci, ++celli) {
            if (grid.get(ri, ci)) continue;
            const c = cells[celli];
            // fix span
            const rowSpan = Math.min(c.rowSpan || 1, rowLen - ri)
            let colSpan = Math.min(c.colSpan || 1, colLen - ci);
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.get(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.set(ri + i, ci + j, c);
                }
            }
        }
        for (let ci = colStart, colLen = colWidths.length; ci < colLen && celli < cellLen && ci <= colEnd; ++ci, ++celli) {
            if (grid.get(ri, ci)) continue;
            const c = cells[celli];
            // ret.push(c);
            // fix span
            const rowSpan = Math.min(c.rowSpan || 1, rowLen - ri)
            let colSpan = Math.min(c.colSpan || 1, colLen - ci);
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.get(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.set(ri + i, ci + j, c);
                }
            }
        }
        for (let ci = colEnd + 1, colLen = colWidths.length; ci < colLen && celli < cellLen; ++ci, ++celli) {
            if (grid.get(ri, ci)) continue;
            const c = cells[celli];
            // fix span
            const rowSpan = Math.min(c.rowSpan || 1, rowLen - ri)
            let colSpan = Math.min(c.colSpan || 1, colLen - ci);
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                if (grid.get(ri, _ci)) {
                    colSpan = _ci - ci;
                    break;
                }
            }
            for (let i = 0; i < rowSpan; ++i) {
                for (let j = 0; j < colSpan; ++j) {
                    grid.set(ri + i, ci + j, c);
                }
            }
        }
    }

    const ret: TableCell[] = [];
    const added: Set<string> = new Set();
    for (let ri = rowStart, rowLen = rowHeights.length; ri < rowLen && ri <= rowEnd; ++ri) {
        for (let ci = colStart, colLen = colWidths.length; ci < colLen && ci <= colEnd; ++ci) {
            const c: TableCell = grid.get(ri, ci);
            if (added.has(c.id)) continue;
            ret.push(c);
            added.add(c.id);
        }
    }
    return ret;
}