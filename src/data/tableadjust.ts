import { TableCell, TableShape } from "./typesdefine";

const MinCellSize = 10;

export function adjColum(table: TableShape, x: number, dx: number) {
    x = Math.round(x);
    dx = Math.round(dx);
    if (dx === 0) return;

    let leftCells: TableCell[] = [];
    let rightCells: TableCell[] = [];
    const cells = table.childs;

    for (let i = 0, len = cells.length; i < len; ++i) {
        const cell = cells[i];
        if (cell.frame.x < x) leftCells.push(cell);
        else rightCells.push(cell);
    }

    if (leftCells.length === 0 || rightCells.length === 0) return;
    if (dx < 0) {
        const tmp = leftCells;
        leftCells = rightCells;
        rightCells = tmp;
        dx = -dx;
    }

    // 左变大 右缩小 中间的不动
    const curMinSize = rightCells.reduce((size, cell) => Math.min(size, cell.frame.width), rightCells[0].frame.width)
    const saveDx = dx;
    dx = Math.min(curMinSize - MinCellSize, dx);
    if (dx > 0) {

    }
}