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

class BitGrid {
    private grid: Int8Array[] = [];
    constructor(width: number, height: number) {
        for (let i = 0; i < height; i++) {
            this.grid.push(new Int8Array(Math.ceil(width / 8)))
        }
    }
    setBit(x: number, y: number) {
        const arr = this.grid[y];
        const i = Math.floor(x / 8);
        const offset = x % 8;
        const val = arr[i];
        arr[i] = val | (1 << offset);
    }
    isSet(x: number, y: number) {
        const arr = this.grid[y];
        const i = Math.floor(x / 8);
        const offset = x % 8;
        const val = arr[i];
        return !!(val & (1 << offset));
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
            else {
                const rowSpan = c.rowSpan || 1;
                const colSpan = c.colSpan || 1;
                for (let i = 0; i < rowSpan; ++i) {
                    for (let j = 0; j < colSpan; ++j) {
                        grid.setBit(ri + i, ci + j);
                    }
                }
            }
        }
    }

}