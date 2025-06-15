/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Fill, FillType } from "../../data/style";
import { Color } from "../../data/color";
import { crdtArrayInsert, crdtArrayMove, crdtArrayRemove, crdtSetAttr } from "./basic";
import { BasicArray } from "../../data/basic";
import { ArrayMoveOpRecord } from "../basic/crdt";

// 填充

export function addFillAt(fills: BasicArray<Fill>, fill: Fill, index: number) {
    return crdtArrayInsert(fills, index, fill);
}
export function deleteFillAt(fills: BasicArray<Fill>, idx: number) {
    return crdtArrayRemove(fills, idx);
}
/**
 * @param idx 开始删的位置
 * @param strength 删除的个数
 * @returns 被删除的元素
 */
export function deleteFills(fills: BasicArray<Fill>, idx: number, strength: number) {
    const ops: ArrayMoveOpRecord[] = [];
    for (let i = idx + strength - 1; i >= idx; i--) {
        const op = crdtArrayRemove(fills, i);
        if (op) ops.push(op);
    }
    return ops;
}
export function moveFill(fills: BasicArray<Fill>, idx: number, idx2: number) {
    return crdtArrayMove(fills, idx, idx2);
}

export function setFillColor(fill: Fill, color: Color) {
    return fill && crdtSetAttr(fill, "color", color);
}

export function setFillEnable(fill: Fill, enable: boolean) {
    return fill && crdtSetAttr(fill, "isEnabled", enable);
}
export function setFillType(fill: Fill, fillType: FillType) {
    return fill && crdtSetAttr(fill, "fillType", fillType);
}
