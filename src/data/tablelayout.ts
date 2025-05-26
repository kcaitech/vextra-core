/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Grid } from "../basic/grid";
import { ShapeFrame, ShapeSize } from "./shape";
import { TableCell, TableShape } from "./table";
import { TableCellAttr, TableShape2 } from "./typesdefine";

export type TableGridItem = { index: { row: number, col: number }, span: { row: number, col: number }, frame: ShapeFrame }

export type TableLayout = {
    grid: Grid<TableGridItem>,
    width: number,
    height: number,
    rowHeights: number[],
    colWidths: number[],
}

export function layoutTable(table: TableShape | TableShape2, frame: ShapeSize, cellGetter: (ri: number, ci: number) => TableCell | TableCellAttr | undefined): TableLayout {
    // const frame = table.frame;
    const grid: Grid<TableGridItem> = new Grid<TableGridItem>(table.rowHeights.length, table.colWidths.length);
    // const cells = table.cells;

    const width = frame.width;
    const height = frame.height;
    const rowHeights = table.rowHeights;
    const rowHBase = table.rowHeights.reduce((p, c) => p + c.value, 0);
    const colWidths = table.colWidths;
    const colWBase = table.colWidths.reduce((p, c) => p + c.value, 0);

    let celli = 0;

    for (let ri = 0, rowLen = rowHeights.length, rowY = 0; ri < rowLen; ++ri) {
        const rowHeight = rowHeights[ri].value / rowHBase * height;

        for (let ci = 0, colLen = colWidths.length, colX = 0; ci < colLen; ++ci, ++celli) {
            // const cellid = rowHeights[ri].id + ',' + colWidths[ci].id;
            const cell = cellGetter(ri, ci); // cells.get(cellid);
            const visible = !grid.get(ri, ci);

            const colWidth = colWidths[ci].value / colWBase * width;
            if (!visible) {
                colX += colWidth;
                continue;
            }

            const d: TableGridItem = {
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
                const rowHeight = rowHeights[_ri].value / rowHBase * height;

                let _h = 0;
                for (let _ci = ci, cend = ci + colSpan; _ci < cend; ++_ci) {
                    grid.set(_ri, _ci, d)

                    if (dwidth === 0) {
                        const colWidth = colWidths[_ci].value / colWBase * width;
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
        rowHeights: rowHeights.map((w) => w.value / rowHBase * height),
        colWidths: colWidths.map((w) => w.value / colWBase * width)
    }
}