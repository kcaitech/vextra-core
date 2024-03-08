import { Grid } from "../basic/grid";
import { ShapeFrame } from "./shape";
import { TableCell, TableShape } from "./table";

export type TableGridItem = { index: { row: number, col: number }, span: { row: number, col: number }, frame: ShapeFrame }

export type TableLayout = {
    grid: Grid<TableGridItem>,
    width: number,
    height: number,
    rowHeights: number[],
    colWidths: number[],
}

// export class LayoutItem {
//     layout: TableLayout | undefined;

//     width: number = 0;
//     height: number = 0;
//     tatalWidth: number = 0;
//     totalHeight: number = 0;

//     update(table: TableShape) {
//         const frame = table.frame;
//         table.updateTotalWeights();
//         if (frame.width !== this.width || frame.height !== this.height) {
//             this.layout = undefined;
//         } else if (table.widthTotalWeights !== this.tatalWidth || table.heightTotalWeights !== this.totalHeight) {
//             this.layout = undefined;
//         }
//         this.width = frame.width;
//         this.height = frame.height;
//         this.tatalWidth = table.widthTotalWeights;
//         this.totalHeight = table.heightTotalWeights;
//     }
// }

export function layoutTable(table: TableShape, cellGetter: (ri: number, ci: number) => TableCell | undefined): TableLayout {
    const frame = table.frame;
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