import { TableLayout } from "./table";
import { TableGridItem } from "./tablelayout";

export function locateCell(layout: TableLayout, x: number, y: number): TableGridItem | undefined {

    let curY = 0;
    for (let ri = 0, rlen = layout.rowHeights.length; ri < rlen; ++ri) {

        const rowHeight = layout.rowHeights[ri];
        curY += rowHeight;
        if (y > curY) continue;

        let curX = 0;
        for (let ci = 0, clen = layout.colWidths.length; ci < clen; ++ci) {

            const colWidth = layout.colWidths[ci];
            curX += colWidth;
            if (x > curX) continue;

            return layout.grid.get(ri, ci);
        }

        break;
    }
}

export function locateCellIndex(layout: TableLayout, x: number, y: number): { row: number, col: number } | undefined {

    let curY = 0;
    for (let ri = 0, rlen = layout.rowHeights.length; ri < rlen; ++ri) {

        const rowHeight = layout.rowHeights[ri];
        curY += rowHeight;
        if (y > curY) continue;

        let curX = 0;
        for (let ci = 0, clen = layout.colWidths.length; ci < clen; ++ci) {

            const colWidth = layout.colWidths[ci];
            curX += colWidth;
            if (x > curX) continue;

            return { row: ri, col: ci }
        }

        break;
    }
}
