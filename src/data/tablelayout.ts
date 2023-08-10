import { BasicArray } from "./basic";
import { ShapeFrame } from "./shape";
import { TableCell, TableShape } from "./table";

export type TableGridItem = { cell: TableCell, index: { row: number, col: number }, frame: ShapeFrame }

export type TableLayout = {
    grid: TableGridItem[][],
    width: number,
    height: number,
    rowHeights: number[],
    colWidths: number[],
}

export function layoutTable(table: TableShape): TableLayout {
    const frame = table.frame;
    const grid: TableGridItem[][] = [];
    const cells: TableCell[] = table.childs as (BasicArray<TableCell>);

    const width = frame.width;
    const height = frame.height;
    const rowHeights = table.rowHeights;
    const rowHBase = rowHeights.reduce((sum, cur) => sum + cur, 0);
    const colWidths = table.colWidths;
    const colWBase = colWidths.reduce((sum, cur) => sum + cur, 0);

    let celli = 0, cellLen = cells.length;

    for (let ri = 0, rowLen = rowHeights.length, rowY = 0; ri < rowLen && celli < cellLen; ++ri) {
        if (!grid[ri]) grid[ri] = [];
        const grow = grid[ri];

        const rowHeight = rowHeights[ri] / rowHBase * height;

        for (let ci = 0, colLen = colWidths.length, colX = 0; ci < colLen && celli < cellLen; ++ci, ++celli) {

            const colWidth = colWidths[ci] / colWBase * width;

            if (grow[ci]) {
                colX += colWidth;
                continue;
            }

            const cell = cells[celli];

            const d: TableGridItem = {
                cell,
                index: {
                    row: ri,
                    col: ci
                },
                frame: new ShapeFrame(colX, rowY, 0, 0)
            }

            // fix span
            const rowSpan = cell.rowSpan || 1;
            let colSpan = cell.colSpan || 1;
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (;;) {
                if (!grid[ri]) break;
                const _gr = grid[ri];
                for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                    if (_gr[_ci]) {
                        colSpan = _ci - ci;
                        break;
                    }
                }
                break;
            }

            let dwidth = 0;
            let dheight = 0;
            // fill grid
            for (let _ri = ri, rend = ri + rowSpan; _ri < rend; ++_ri) {
                if (!grid[_ri]) grid[_ri] = [];
                const _gr = grid[_ri];
                const rowHeight = rowHeights[_ri] / rowHBase * height;

                let _h = 0;
                for (let _ci = ci, cend = ci + colSpan; _ci < cend; ++_ci) {
                    _gr[_ci] = d;
                    if (dwidth === 0) {
                        const colWidth = colWidths[_ci] / colWBase * width;
                        _h += colWidth;
                    }
                }
                if (dwidth === 0) dwidth = _h;
                dheight += rowHeight;
            }
            d.frame.width = dwidth;
            d.frame.height = dheight;

            colX += colWidth;
        }

        rowY += rowHeight;
    }

    return {
        grid,
        width,
        height,
        rowHeights: rowHeights.slice(0),
        colWidths: colWidths.slice(0)
    }
}