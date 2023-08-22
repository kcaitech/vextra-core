import { TableLayout, TableCell, TableShape } from "./table";
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

// export function locateCellByCell(table: TableShape, layout: TableLayout, cell: TableCell): TableGridItem | undefined {
//     const grid = layout.grid;
//     for (let ri = 0, rlen = grid.rowCount; ri < rlen; ++ri) {
//         for (let ci = 0, clen = grid.colCount; ci < clen; ++ci) {
//             const cl = grid.get(ri, ci);
//             const c = table.getCellAt(ri, ci);
//             if (c && c.id === cell.id) {
//                 return cl;
//             }
//         }
//     }
// }

// export function indexOfCell(table: TableShape, cell: TableCell): { rowIdx: number, colIdx: number, visible: boolean } | undefined {
//     const rowHeights = table.rowHeights;
//     const colWidths = table.colWidths;
//     const grid: BitGrid = new BitGrid(colWidths.length, rowHeights.length);

//     const cells: TableCell[] = table.childs as (BasicArray<TableCell>);
//     const cellLen = cells.length;
//     let celli = 0;

//     for (let ri = 0, rowLen = rowHeights.length; ri < rowLen && celli < cellLen; ++ri) { // y
//         for (let ci = 0, colLen = colWidths.length; ci < colLen && celli < cellLen; ++ci, ++celli) {
//             const c = cells[celli];
//             if (c.id === cell.id) {
//                 return {
//                     rowIdx: ri,
//                     colIdx: ci,
//                     visible: !grid.get(ci, ri)
//                 }
//             }
//             else if (!grid.get(ci, ri)) {
//                 // fix span
//                 const rowSpan = Math.min(c.rowSpan || 1, rowLen - ri)
//                 let colSpan = Math.min(c.colSpan || 1, colLen - ci);
//                 // 取最小可用span空间？// 只有colSpan有可能被阻挡 // 只要判断第一行就行
//                 for (let _ci = ci + 1, cend = ci + colSpan; _ci < cend; ++_ci) {
//                     if (grid.get(_ci, ri)) {
//                         colSpan = _ci - ci;
//                         break;
//                     }
//                 }

//                 for (let i = 0; i < rowSpan; ++i) {
//                     for (let j = 0; j < colSpan; ++j) {
//                         grid.set(ci + j, ri + i, true);
//                     }
//                 }
//             }
//         }
//     }
// }