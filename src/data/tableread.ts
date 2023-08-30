import { TableShape, TableCell, TableLayout } from "./table";
/**
 * 
 * @param table 
 * @param rowStart 
 * @param rowEnd [rowStart, rowEnd]
 * @param colStart 
 * @param colEnd 
 * @param visible 
 */
export function getTableCells(table: TableShape, rowStart: number, rowEnd: number, colStart: number, colEnd: number): { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] {
    const rowHeights = table.rowHeights;
    const colWidths = table.colWidths;

    const cells = table.childs;
    let celli = 0;

    const ret: { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] = [];
    celli += rowStart * colWidths.length;

    for (let ri = rowStart, rowLen = rowHeights.length; ri < rowLen && ri <= rowEnd; ++ri) {
        celli += colStart;
        for (let ci = colStart, colLen = colWidths.length; ci < colLen && ci <= colEnd; ++ci, ++celli) {
            const c = cells[celli];
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
export function getTableNotCoveredCells(table: TableShape, layout: TableLayout, rowStart: number, rowEnd: number, colStart: number, colEnd: number): { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] {

    const ret: { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] = [];
    const added: Set<string> = new Set();
    const grid = layout.grid;
    for (let ri = rowStart, rowLen = grid.rowCount; ri < rowLen && ri <= rowEnd; ++ri) {
        for (let ci = colStart, colLen = grid.colCount; ci < colLen && ci <= colEnd; ++ci) {
            const c = grid.get(ri, ci);
            if (c.index.row !== ri || c.index.col !== ci) {
                continue;
            }
            const cell = table.getCellAt(ri, ci);
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
export function getTableVisibleCells(table: TableShape,
    layout: TableLayout,
    rowStart: number,
    rowEnd: number,
    colStart: number,
    colEnd: number): {
        cell: TableCell | undefined,
        rowIdx: number,
        colIdx: number
    }[] {
    const ret: {
        cell: TableCell | undefined,
        rowIdx: number,
        colIdx: number
    }[] = [];
    const added: Set<string> = new Set();
    const grid = layout.grid;
    for (let ri = rowStart, rowLen = grid.rowCount; ri < rowLen && ri <= rowEnd; ++ri) {
        for (let ci = colStart, colLen = grid.colCount; ci < colLen && ci <= colEnd; ++ci) {
            const c = grid.get(ri, ci);
            const cell = table.getCellAt(c.index.row, c.index.col);
            if (!cell) {
                ret.push({
                    cell: undefined,
                    rowIdx: c.index.row,
                    colIdx: c.index.col
                });
            }
            else {
                if (added.has(cell.id)) continue;
                ret.push({
                    cell,
                    rowIdx: c.index.row,
                    colIdx: c.index.col
                });
                added.add(cell.id);
            }
        }
    }
    return ret;
}