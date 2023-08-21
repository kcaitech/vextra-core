import { Grid } from "../basic/grid";
import { ShapeFrame } from "./shape";
import { TableCell, TableShape } from "./table";

export type TableGridItem = { cell: TableCell | undefined, index: { row: number, col: number }, span: { row: number, col: number }, frame: ShapeFrame }

export type TableLayout = {
    grid: Grid<TableGridItem>,
    width: number,
    height: number,
    rowHeights: number[],
    colWidths: number[],
    cellIndexs: Map<string, { rowIdx: number, colIdx: number, visible: boolean }>
}

export function layoutTable(table: TableShape): TableLayout {
    const frame = table.frame;
    const grid: Grid<TableGridItem> = new Grid<TableGridItem>(table.rowHeights.length, table.colWidths.length);
    const cells = table.childs;

    const width = frame.width;
    const height = frame.height;
    const rowHeights = table.rowHeights;
    const rowHBase = rowHeights.reduce((sum, cur) => sum + cur, 0);
    const colWidths = table.colWidths;
    const colWBase = colWidths.reduce((sum, cur) => sum + cur, 0);
    const cellIndexs = new Map<string, { rowIdx: number, colIdx: number, visible: boolean }>();

    let celli = 0, cellLen = cells.length;

    for (let ri = 0, rowLen = rowHeights.length, rowY = 0; ri < rowLen && celli < cellLen; ++ri) {
        const rowHeight = rowHeights[ri] / rowHBase * height;

        for (let ci = 0, colLen = colWidths.length, colX = 0; ci < colLen && celli < cellLen; ++ci, ++celli) {
            const cell = cells[celli];
            const visible = !grid.get(ri, ci);
            if (cell) cellIndexs.set(cell.id, { rowIdx: ri, colIdx: ci, visible })

            const colWidth = colWidths[ci] / colWBase * width;
            if (!visible) {
                colX += colWidth;
                continue;
            }

            const d: TableGridItem = {
                cell,
                index: {
                    row: ri,
                    col: ci
                },
                span: {
                    row: 1,
                    col: 1
                },
                frame: new ShapeFrame(colX, rowY, 0, 0)
            }

            // fix span
            const rowSpan = Math.min(cell?.rowSpan || 1, rowLen - ri)
            let colSpan = Math.min(cell?.colSpan || 1, colLen - ci);
            // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
            for (; ;) {
                for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
                    if (grid.get(ri, _ci)) {
                        colSpan = _ci - ci;
                        break;
                    }
                }
                break;
            }
            d.span.row = rowSpan;
            d.span.col = colSpan;

            let dwidth = 0;
            let dheight = 0;
            // fill grid
            for (let _ri = ri, rend = ri + rowSpan; _ri < rend; ++_ri) {
                const rowHeight = rowHeights[_ri] / rowHBase * height;

                let _h = 0;
                for (let _ci = ci, cend = ci + colSpan; _ci < cend; ++_ci) {
                    grid.set(_ri, _ci, d)

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
        rowHeights: rowHeights.map((w) => w / rowHBase * height),
        colWidths: colWidths.map((w) => w / colWBase * width),
        cellIndexs
    }
}