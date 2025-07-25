/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Border, BorderPosition, BorderStyle, Fill } from "../data/style";
import { BasicArray } from "../data/basic";
import { BasicOp } from "./basicop";

export class BorderOp {
    constructor(private _basicop: BasicOp) { }

    setBorderPosition(border: Border, position: BorderPosition) {
        return this._basicop.crdtSetAttr(border, "position", position);
    }
    setBorderStyle(border: Border, borderStyle: BorderStyle) {
        return this._basicop.crdtSetAttr(border, "borderStyle", borderStyle);
    }


    deleteStrokePaintAt(strokePaints: BasicArray<Fill>, idx: number) {
        return this._basicop.crdtArrayRemove(strokePaints, idx);
    }

    /**
     * @param idx 开始删的位置
     * @param strength 删除的个数
     * @returns 被删除的元素
     */
    deleteStrokePaints(strokePaints: BasicArray<Fill>, idx: number, strength: number) {
        for (let i = idx + strength - 1; i >= idx; i--) {
            this._basicop.crdtArrayRemove(strokePaints, i);
        }
    }

    addStrokePaint(strokePaints: BasicArray<Fill>, strokePaint: Fill, index: number) {
        return this._basicop.crdtArrayInsert(strokePaints, index, strokePaint);
    }
    moveStrokePaint(strokePaints: BasicArray<Fill>, idx: number, idx2: number) {
        return this._basicop.crdtArrayMove(strokePaints, idx, idx2);
    }
}