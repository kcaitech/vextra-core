/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Shadow } from "../../data/style";
import { Color } from "../../data/color";
import { BasicArray } from "../../data/basic";
import { crdtArrayInsert, crdtArrayRemove, crdtSetAttr } from "./basic";
import { ArrayMoveOpRecord } from "../basic/crdt";
// 阴影
export function deleteShadowAt(shadows: BasicArray<Shadow>, idx: number) {
    return crdtArrayRemove(shadows, idx);
}

export function addShadow(shadows: BasicArray<Shadow>, shadow: Shadow, index: number) {
    return crdtArrayInsert(shadows, index, shadow);
}

export function setShadowColor(shadows: BasicArray<Shadow>, idx: number, color: Color) {
    const shadow: Shadow = shadows[idx];
    if (shadow) return crdtSetAttr(shadow, "color", color); // shadow.color = color;
}

export function setShadowOffsetX(shadows: BasicArray<Shadow>, idx: number, offsetX: number) {
    const shadow: Shadow = shadows[idx];
    if (shadow) return crdtSetAttr(shadow, "offsetX", offsetX); // shadow.offsetX = offsetX;
}

export function setShadowOffsetY(shadows: BasicArray<Shadow>, idx: number, offsetY: number) {
    const shadow: Shadow = shadows[idx];
    if (shadow) return crdtSetAttr(shadow, "offsetY", offsetY); // shadow.offsetY = offsetY;
}

export function setShadowBlur(shadows: BasicArray<Shadow>, idx: number, blur: number) {
    const shadow: Shadow = shadows[idx];
    if (shadow) return crdtSetAttr(shadow, "blurRadius", blur); // shadow.blurRadius = blur;
}

export function setShadowSpread(shadows: BasicArray<Shadow>, idx: number, spread: number) {
    const shadow: Shadow = shadows[idx];
    if (shadow) return crdtSetAttr(shadow, "spread", spread); // shadow.spread = spread;
}

export function deleteShadows(shadows: BasicArray<Shadow>, idx: number, strength: number) {
    const ops: ArrayMoveOpRecord[] = [];
    for (let i = idx + strength - 1; i >= idx; i--) {
        const op = crdtArrayRemove(shadows, i);
        if (op) ops.push(op);
    }
    return ops;
}