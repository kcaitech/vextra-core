import { TableCell, TableShape } from "./classes";
import { Point2D } from "./typesdefine";

export interface ColumSegment {
    from: Point2D,
    to: Point2D,
    leftCells: TableCell[],
    rightCells: TableCell[]
}

export interface RowSegment {
    from: Point2D,
    to: Point2D,
    topCells: TableCell[],
    bottomCells: TableCell[]
}

function getIntersectColumnSge(segs: ColumSegment[], y1: number, y2: number): ColumSegment | undefined {
    for (let i = segs.length - 1; i >= 0; i--) {
        const s = segs[i];
        const sy1 = s.from.y;
        const sy2 = s.to.y;
        if (y1 <= sy2 && y2 >= sy1) return s;
    }
}

function getIntersectRowSge(segs: RowSegment[], x1: number, x2: number): RowSegment | undefined {
    for (let i = segs.length - 1; i >= 0; i--) {
        const s = segs[i];
        const sx1 = s.from.x;
        const sx2 = s.to.x;
        if (x1 <= sx2 && x2 >= sx1) return s;
    }
}

function getIntersectColumnSge2(segs: ColumSegment[], y1: number, y2: number, form: number): ColumSegment | undefined {
    for (let i = form, len = segs.length; i < len; i++) {
        const s = segs[i];
        const sy1 = s.from.y;
        const sy2 = s.to.y;
        if (y1 <= sy2 && y2 >= sy1) return s;
    }
}

function getIntersectRowSge2(segs: RowSegment[], x1: number, x2: number, form: number): RowSegment | undefined {
    for (let i = form, len = segs.length; i < len; i++) {
        const s = segs[i];
        const sx1 = s.from.x;
        const sx2 = s.to.x;
        if (x1 <= sx2 && x2 >= sx1) return s;
    }
}

function mergeIntersectColumnSegs(segs: ColumSegment[]): ColumSegment[] {
    const ret: ColumSegment[] = [];
    segs.forEach((v, i) => {
        const intersect = getIntersectColumnSge2(segs, v.from.y, v.to.y, i + 1);
        if (intersect) {
            // 将v 合入intersect
            v.leftCells.push(...intersect.leftCells);
            intersect.leftCells = v.leftCells;
            v.rightCells.push(...intersect.rightCells);
            intersect.rightCells = v.rightCells;
            if (v.from.y < intersect.from.y) intersect.from.y = v.from.y;
            if (v.to.y > intersect.to.y) intersect.to.y = v.to.y;
        }
        else {
            ret.push(v);
        }
    })
    return ret;
}

function mergeIntersectRowSegs(segs: RowSegment[]): RowSegment[] {
    const ret: RowSegment[] = [];
    segs.forEach((v, i) => {
        const intersect = getIntersectRowSge2(segs, v.from.x, v.to.x, i + 1);
        if (intersect) {
            // 将v 合入intersect
            v.topCells.push(...intersect.topCells);
            intersect.topCells = v.topCells;
            v.bottomCells.push(...intersect.bottomCells);
            intersect.bottomCells = v.bottomCells;
            if (v.from.x < intersect.from.x) intersect.from.x = v.from.x;
            if (v.to.x > intersect.to.x) intersect.to.x = v.to.x;
        }
        else {
            ret.push(v);
        }
    })
    return ret;
}

export function getColumnsInfo(table: TableShape): ColumSegment[][] {
    const segments = new Map<number, ColumSegment[]>();

    table.childs.forEach((cell) => {
        const x1 = Math.round(cell.frame.x);
        const x2 = Math.round(cell.frame.x + cell.frame.width);
        const y1 = Math.round(cell.frame.y);
        const y2 = Math.round(cell.frame.y + cell.frame.height);

        let x1segs = segments.get(x1);
        if (!x1segs) {
            x1segs = [];
            segments.set(x1, x1segs);
        }

        const x1s = getIntersectColumnSge(x1segs, y1, y2);
        if (x1s) {
            x1s.rightCells.push(cell);
            if (y1 < x1s.from.y) x1s.from.y = y1;
            if (y2 > x1s.to.y) x1s.to.y = y2;
        }
        else {
            x1segs.push({
                from: {
                    x: x1,
                    y: y1,
                },
                to: {
                    x: x1,
                    y: y2,
                },

                leftCells: [],
                rightCells: [cell]
            });
        }

        let x2segs = segments.get(x2);
        if (!x2segs) {
            x2segs = [];
            segments.set(x2, x2segs);
        }

        const x2s = getIntersectColumnSge(x2segs, y1, y2);
        if (x2s) {
            x2s.leftCells.push(cell);
            if (y1 < x2s.from.y) x2s.from.y = y1;
            if (y2 > x2s.to.y) x2s.to.y = y2;
        }
        else {
            x2segs.push({

                from: {
                    x: x2,
                    y: y1,
                },
                to: {
                    x: x2,
                    y: y2,

                },
                leftCells: [cell],
                rightCells: []
            });
        }
    })

    const ret: ColumSegment[][] = [];
    segments.forEach((v1) => {
        // merge
        v1 = mergeIntersectColumnSegs(v1);
        v1.sort((a, b) => a.from.y - b.from.y);
        ret.push(v1);
    });

    ret.sort((a, b) => a[0].from.x - b[0].from.x);
    return ret;
}

export function getRowsInfo(table: TableShape): RowSegment[][] {
    const segments = new Map<number, RowSegment[]>();

    table.childs.forEach((cell) => {
        const y1 = Math.round(cell.frame.y);
        const y2 = Math.round(cell.frame.y + cell.frame.height);
        const x1 = Math.round(cell.frame.x);
        const x2 = Math.round(cell.frame.x + cell.frame.width);

        let y1segs = segments.get(y1);
        if (!y1segs) {
            y1segs = [];
            segments.set(y1, y1segs);
        }

        const y1s = getIntersectRowSge(y1segs, x1, x2);
        if (y1s) {
            y1s.bottomCells.push(cell);
            if (x1 < y1s.from.x) y1s.from.x = x1;
            if (x2 > y1s.to.x) y1s.to.x = x2;
        }
        else {
            y1segs.push({
                from: {
                    x: x1,
                    y: y1,
                },
                to: {
                    x: x1,
                    y: y2,
                },

                topCells: [],
                bottomCells: [cell]
            });
        }

        let y2segs = segments.get(y2);
        if (!y2segs) {
            y2segs = [];
            segments.set(y2, y2segs);
        }

        const y2s = getIntersectRowSge(y2segs, x1, x2);
        if (y2s) {
            y2s.topCells.push(cell);
            if (x1 < y2s.from.x) y2s.from.x = x1;
            if (x2 > y2s.to.x) y2s.to.x = x2;
        }
        else {
            y2segs.push({

                from: {
                    x: x2,
                    y: y1,
                },
                to: {
                    x: x2,
                    y: y2,

                },
                topCells: [cell],
                bottomCells: []
            });
        }
    })

    const ret: RowSegment[][] = [];
    segments.forEach((v1) => {
        // merge
        v1 = mergeIntersectRowSegs(v1);
        v1.sort((a, b) => a.from.x - b.from.x);
        ret.push(v1);
    });

    ret.sort((a, b) => a[0].from.y - b[0].from.y);
    return ret;
}
