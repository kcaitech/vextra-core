/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Fill, FillType } from "../data/style";
import { Color } from "../data/color";
import { BasicArray } from "../data/basic";
import { BasicOp } from "./basicop";

// 填充

export class FillOp {
    constructor(private _basicop: BasicOp) { }

    addFillAt(fills: BasicArray<Fill>, fill: Fill, index: number) {
        return this._basicop.crdtArrayInsert(fills, index, fill);
    }
    deleteFillAt(fills: BasicArray<Fill>, idx: number) {
        return this._basicop.crdtArrayRemove(fills, idx);
    }
    /**
     * @param idx 开始删的位置
     * @param strength 删除的个数
     * @returns 被删除的元素
     */
    deleteFills(fills: BasicArray<Fill>, idx: number, strength: number) {
        for (let i = idx + strength - 1; i >= idx; i--) {
            this._basicop.crdtArrayRemove(fills, i);
        }
    }
    moveFill(fills: BasicArray<Fill>, idx: number, idx2: number) {
        return this._basicop.crdtArrayMove(fills, idx, idx2);
    }
    
    setFillColor(fill: Fill, color: Color) {
        return fill && this._basicop.crdtSetAttr(fill, "color", color);
    }
    
    setFillEnable(fill: Fill, enable: boolean) {
        return fill && this._basicop.crdtSetAttr(fill, "isEnabled", enable);
    }
    setFillType(fill: Fill, fillType: FillType) {
        return fill && this._basicop.crdtSetAttr(fill, "fillType", fillType);
    }
}
