/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Border, BorderPosition, BorderStyle, Fill, FillType } from "../../data/style";
import { crdtArrayInsert, crdtArrayMove, crdtArrayRemove, crdtSetAttr } from "./basic";
import { BasicArray } from "../../data/basic";
import { ArrayMoveOpRecord } from "../basic/crdt";
// 边框
// export function setBorderColor(
//     border: Border,
//     color: Color
// ) {
//     return crdtSetAttr(border, "color", color);
// }
// export function setBorderEnable(
//     border: Border,
//     isEnabled: boolean,
// ) {
//     return crdtSetAttr(border, "isEnabled", isEnabled);
// }

export function setBorderPosition(border: Border, position: BorderPosition) {
    return crdtSetAttr(border, "position", position);
}
export function setBorderStyle(border: Border, borderStyle: BorderStyle) {
    return crdtSetAttr(border, "borderStyle", borderStyle);
}


export function deleteStrokePaintAt(strokePaints: BasicArray<Fill>, idx: number) {
    return crdtArrayRemove(strokePaints, idx);
}

/**
 * @param idx 开始删的位置
 * @param strength 删除的个数
 * @returns 被删除的元素
 */
export function deleteStrokePaints(strokePaints: BasicArray<Fill>, idx: number, strength: number) {
    const ops: ArrayMoveOpRecord[] = [];
    for (let i = idx + strength - 1; i >= idx; i--) {
        const op = crdtArrayRemove(strokePaints, i);
        if (op) ops.push(op);
    }
    return ops;
}

export function addStrokePaint(strokePaints: BasicArray<Fill>, strokePaint: Fill, index: number) {
    return crdtArrayInsert(strokePaints, index, strokePaint);
}
export function moveStrokePaint(strokePaints: BasicArray<Fill>, idx: number, idx2: number) {
    return crdtArrayMove(strokePaints, idx, idx2);
}