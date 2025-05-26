/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { float_accuracy } from "./consts";

interface Rect {
    x: number,
    y: number,
    width: number,
    height: number
}

function _is_intersect(frame0: Rect, frame1: Rect) {
    // 考虑float误差
    return !(frame0.x - (frame1.x + frame1.width) > float_accuracy ||
        frame0.x + frame0.width - frame1.x < -float_accuracy ||
        frame0.y - (frame1.y + frame1.height) > float_accuracy ||
        frame0.y + frame0.height - frame1.y < -float_accuracy);
}
function is_intersect(arr: Rect[], frame: Rect) {
    for (let i = 0; i < arr.length; i++) {
        if (_is_intersect(arr[i], frame)) return true;
    }
    return false;
}

export class FrameGrid {
    _cellWidth: number;
    _cellHeight: number;
    _cellRowsCount: number;
    _cellColsCount: number;
    _rows: Rect[][][] = [];
    _offsetx: number;
    _offsety: number;

    constructor(cellWidth: number, cellHeight: number, cellRowsCount: number, cellColsCount: number, offsetx: number, offsety: number) {
        this._cellWidth = cellWidth;
        this._cellHeight = cellHeight;
        this._cellRowsCount = cellRowsCount;
        this._cellColsCount = cellColsCount;
        this._offsetx = offsetx;
        this._offsety = offsety;
    }

    checkIntersectAndPush(frame: Rect): boolean {
        return this._checkIntersectAndPush(frame, false);
    }

    push(frame: Rect) {
        this._checkIntersectAndPush(frame, true);
    }

    private _checkIntersectAndPush(frame: Rect, preset: boolean): boolean {
        const xs = (frame.x) - this._offsetx;
        const xe = (frame.x + frame.width) - this._offsetx;
        const ys = (frame.y) - this._offsety;
        const ye = (frame.y + frame.height) - this._offsety;
                
        const is = Math.max(0, xs / this._cellWidth);
        const ie = Math.max(1, xe / this._cellWidth);
        
        for (let i = Math.floor(is); i <= ie && i <= this._cellColsCount; ++i) {
            const js = Math.max(0, ys / this._cellHeight);
            const je = Math.max(1, ye / this._cellHeight);
            let row = this._rows[i];
            if (!row) {
                row = [];
                this._rows[i] = row;
            }
            for (let j = Math.floor(js); j <= je && j <= this._cellRowsCount; ++j) {
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