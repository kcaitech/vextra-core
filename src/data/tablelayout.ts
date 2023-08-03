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
    const colWidths = table.colWidths;

    let celli = 0, cellLen = cells.length;

    for (let ri = 0, rowLen = rowHeights.length, rowY = 0; ri < rowLen && celli < cellLen; ++ri) {
        if (!grid[ri]) grid[ri] = [];
        const grow = grid[ri];

        const rowHeight = rowHeights[ri] * height;

        for (let ci = 0, colLen = colWidths.length, colX = 0; ci < colLen && celli < cellLen; ++ci, ++celli) {

            const colWidth = colWidths[ci] * width;

            if (grow[ci]) {
                colX += colWidth;
                continue;
            }

            const cell = cells[celli];
            const rowSpan = cell.rowSpan || 1;
            const colSpan = cell.colSpan || 1;
            const d: TableGridItem = {
                cell,
                index: {
                    row: ri,
                    col: ci
                },
                frame: new ShapeFrame(colX, rowY, colWidth, rowHeight)
            }

            // fill grid
            for (let _ri = ri, rend = ri + rowSpan; _ri < rend; ++_ri) {
                if (!grid[_ri]) grid[_ri] = [];
                const _gr = grid[_ri];
                for (let _ci = ci, cend = ci + colSpan; _ci < cend; ++_ci) {
                    _gr[_ci] = d;
                }
            }

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