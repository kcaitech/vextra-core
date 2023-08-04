import { TableLayout } from "./table";
import { TableGridItem } from "./tablelayout";

export function locateCell(layout: TableLayout, x: number, y: number): {
    item: TableGridItem,
    rowIdx: number,
    colIdx: number
} | undefined {

    const grid = layout.grid;
    for (let ri = 0, rlen = grid.length; ri < rlen; ++ri) {
        const row = grid[ri];
        const frame = row[0].frame;
        if (x > frame.x + frame.width) continue;

        for (let ci = 0, clen = row.length; ci < clen; ++ci) {
            const cl = row[ci];
            const frame = cl.frame;
            if (y > frame.y + frame.height) continue;

            return {
                item: cl,
                rowIdx: ri,
                colIdx: ci
            };
        }
        break;
    }
}