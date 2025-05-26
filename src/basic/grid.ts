/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


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
