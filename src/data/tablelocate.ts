import { BitGrid } from "../basic/bitgrid";
import { BasicArray } from "./basic";
import { TableLayout, TableShape } from "./table";
import { TableGridItem } from "./tablelayout";
import { TableCell } from "./typesdefine";

export function locateCell(layout: TableLayout, x: number, y: number): TableGridItem | undefined {

    const grid = layout.grid;
    for (let ri = 0, rlen = grid.length; ri < rlen; ++ri) {
        const row = grid[ri];
        const frame = row[0].frame;
        if (y > frame.y + frame.height) continue;

        for (let ci = 0, clen = row.length; ci < clen; ++ci) {
            const cl = row[ci];
            const frame = cl.frame;
            if (x > frame.x + frame.width) continue;

            return cl;
        }
        break;
    }
}

export function locateCellByCell(layout: TableLayout, cell: TableCell): TableGridItem | undefined {
    const grid = layout.grid;
    for (let ri = 0, rlen = grid.length; ri < rlen; ++ri) {
        const row = grid[ri];
        for (let ci = 0, clen = row.length; ci < clen; ++ci) {
            const cl = row[ci];
            if (cl.cell.id === cell.id) {
                return cl;
            }
        }
        break;
    }
}

export function indexOfCell(table: TableShape, cell: TableCell): { rowIdx: number, colIdx: number, visible: boolean } | undefined {
    const rowHeights = table.rowHeights;
    const colWidths = table.colWidths;
    const grid: BitGrid = new BitGrid(rowHeights.length, colWidths.length);

    const cells: TableCell[] = table.childs as (BasicArray<TableCell>);
    const cellLen = cells.length;
    let celli = 0;

    for (let ri = 0, rowLen = rowHeights.length; ri < rowLen && celli < cellLen; ++ri) {
        for (let ci = 0, colLen = colWidths.length; ci < colLen && celli < cellLen; ++ci, ++celli) {
            const c = cells[celli];
            if (c.id === cell.id) {
                return {
                    rowIdx: ri,
                    colIdx: ci,
                    visible: !grid.isSet(ri, ci)
                }
            }
            else if (!grid.isSet(ri, ci)) {
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
    }

}