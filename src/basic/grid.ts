
export class BitGrid {
    private grid: Int8Array[] = [];
    private _rowCount: number;
    private _colCount: number;
    constructor(rowCount: number, colCount: number) {
        for (let i = 0; i < rowCount; i++) {
            this.grid.push(new Int8Array(Math.ceil(colCount / 8)))
        }
        this._rowCount = rowCount;
        this._colCount = colCount;
    }
    get rowCount() {
        return this._rowCount;
    }
    get colCount() {
        return this._colCount;
    }
    set(rowIdx: number, colIdx: number, v: boolean) {
        const arr = this.grid[rowIdx];
        const i = Math.floor(colIdx / 8);
        const offset = colIdx % 8;
        const val = arr[i];
        if (v) arr[i] = val | (1 << offset);
        else arr[i] = val & (~(1 << offset));
    }
    get(rowIdx: number, colIdx: number) {
        const arr = this.grid[rowIdx];
        const i = Math.floor(colIdx / 8);
        const offset = colIdx % 8;
        const val = arr[i];
        return !!(val & (1 << offset));
    }
}

export class Grid<T> {
    private grid: T[][] = [];
    private _rowCount: number;
    private _colCount: number;
    constructor(rowCount: number, colCount: number) {
        for (let i = 0; i < rowCount; i++) {
            this.grid.push([])
        }
        this._rowCount = rowCount;
        this._colCount = colCount;
    }
    get rowCount() {
        return this._rowCount;
    }
    get colCount() {
        return this._colCount;
    }
    set(rowIdx: number, colIdx: number, object: T) {
        const arr = this.grid[rowIdx];
        arr[colIdx] = object;
    }
    get(rowIdx: number, colIdx: number) {
        const arr = this.grid[rowIdx];
        return arr[colIdx];
    }
}
