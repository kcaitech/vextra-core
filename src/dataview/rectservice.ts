import { ShapeFrame } from "../data/baseclasses";

function _is_intersect(frame0: ShapeFrame, frame1: ShapeFrame) {
    return !(frame0.x > frame1.x + frame1.width ||
        frame0.x + frame0.width < frame1.x ||
        frame0.y > frame1.y + frame1.height ||
        frame0.y + frame0.height < frame1.y);
}
function is_intersect(arr: ShapeFrame[], frame: ShapeFrame) {
    for (let i = 0; i < arr.length; i++) {
        if (_is_intersect(arr[i], frame)) return true;
    }
    return false;
}

class FrameGrid {
    _cellWidth: number;
    _cellHeight: number;
    _cellRowsCount: number;
    _cellColsCount: number;
    _rows: ShapeFrame[][][] = [];

    constructor(cellWidth: number, cellHeight: number, cellRowsCount: number, cellColsCount: number) {
        this._cellWidth = cellWidth;
        this._cellHeight = cellHeight;
        this._cellRowsCount = cellRowsCount;
        this._cellColsCount = cellColsCount;
    }

    checkIntersectAndPush(frame: ShapeFrame): boolean {
        return this._checkIntersectAndPush(frame, false);
    }

    push(frame: ShapeFrame) {
        this._checkIntersectAndPush(frame, true);
    }

    private _checkIntersectAndPush(frame: ShapeFrame, preset: boolean): boolean {
        const xs = (frame.x);
        const xe = (frame.x + frame.width);
        const ys = (frame.y);
        const ye = (frame.y + frame.height);

        const is = Math.max(0, xs / this._cellWidth);
        const ie = Math.max(1, xe / this._cellWidth);

        for (let i = Math.floor(is); i < ie && i < this._cellColsCount; ++i) {
            const js = Math.max(0, ys / this._cellHeight);
            const je = Math.max(1, ye / this._cellHeight);
            let row = this._rows[i];
            if (!row) {
                row = [];
                this._rows[i] = row;
            }
            for (let j = Math.floor(js); j < je && j < this._cellRowsCount; ++j) {
                let cell = row[j];
                if (!preset && cell) preset = is_intersect(cell, frame);
                if (!cell) {
                    cell = [];
                    row[j] = cell;
                }
                cell.push(frame);
            }
        }
        return preset;
    }
}


export class RectService {
    // shape定义大小，不包含被裁剪的自身及、对象、外边框，通过size算出
    m_frame: ShapeFrame = new ShapeFrame(); // 相对于parent的坐标
    // shape实际显示大小含外边框，不包含被裁剪的自身及、对象，
    m_frameWithBorder: ShapeFrame = new ShapeFrame(); // 相对于parent的坐标
    // shape实际大小，含被裁剪的自身、子对象、外边框
    m_realFrame: ShapeFrame = new ShapeFrame(); // 相对于parent的坐标
    // realGrid，仅在子对象比较多时创建，子对象的realFrame变化时需要更新
    // m_realGrid // page // rect service // 相对于page

    // hitTest(x: number, y: number, deep: boolean = false): {shape: ShapeView, x: number, y: number}[]
    // hitTestWithBorder(x: number, y: number, deep: boolean = false): {shape: ShapeView, x: number, y: number}[]
    // hitTestOnReal(x: number, y: number, deep: boolean = false): {shape: ShapeView, x: number, y: number}[]
    // rectTest(x: number, y: number, deep: boolean = false): {shape: ShapeView, x: number, y: number}[] // level
    // rectTestWithBorder(x: number, y: number, deep: boolean = false): {shape: ShapeView, x: number, y: number}[]
    // rectTestOnReal(x: number, y: number, deep: boolean = false): {shape: ShapeView, x: number, y: number}[]

}