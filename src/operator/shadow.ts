/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Shadow } from "../data/style";
import { Color } from "../data/color";
import { BasicArray } from "../data/basic";
import { BasicOp } from "./basicop";
// 阴影


export class ShadowOp {
    constructor(private _basicop: BasicOp) { }

    deleteShadowAt(shadows: BasicArray<Shadow>, idx: number) {
        return this._basicop.crdtArrayRemove(shadows, idx);
    }

    addShadow(shadows: BasicArray<Shadow>, shadow: Shadow, index: number) {
        return this._basicop.crdtArrayInsert(shadows, index, shadow);
    }

    setShadowColor(shadows: BasicArray<Shadow>, idx: number, color: Color) {
        const shadow: Shadow = shadows[idx];
        if (shadow) return this._basicop.crdtSetAttr(shadow, "color", color); // shadow.color = color;
    }

    setShadowOffsetX(shadows: BasicArray<Shadow>, idx: number, offsetX: number) {
        const shadow: Shadow = shadows[idx];
        if (shadow) return this._basicop.crdtSetAttr(shadow, "offsetX", offsetX); // shadow.offsetX = offsetX;
    }

    setShadowOffsetY(shadows: BasicArray<Shadow>, idx: number, offsetY: number) {
        const shadow: Shadow = shadows[idx];
        if (shadow) return this._basicop.crdtSetAttr(shadow, "offsetY", offsetY); // shadow.offsetY = offsetY;
    }

    setShadowBlur(shadows: BasicArray<Shadow>, idx: number, blur: number) {
        const shadow: Shadow = shadows[idx];
        if (shadow) return this._basicop.crdtSetAttr(shadow, "blurRadius", blur); // shadow.blurRadius = blur;
    }

    setShadowSpread(shadows: BasicArray<Shadow>, idx: number, spread: number) {
        const shadow: Shadow = shadows[idx];
        if (shadow) return this._basicop.crdtSetAttr(shadow, "spread", spread); // shadow.spread = spread;
    }

    deleteShadows(shadows: BasicArray<Shadow>, idx: number, strength: number) {
        for (let i = idx + strength - 1; i >= idx; i--) {
            this._basicop.crdtArrayRemove(shadows, i);
        }
    }
}