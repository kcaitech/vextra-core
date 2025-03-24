/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseCreator } from "./base"
import * as shapeCreator from "../../../editor/creator/creator"
import { PathShape, ShapeFrame } from "../../../data"

export class RectCreator extends BaseCreator {
    createShape() {
        const x = this.attributes.x || 0
        const y = this.attributes.y || 0
        const width = this.attributes.width || 0
        const height = this.attributes.height || 0
        this.shape = shapeCreator.newRectShape("矩形", new ShapeFrame(x, y, width, height), this.context.styleMgr)
        let rx = this.attributes.rx
        let ry = this.attributes.ry
        if (rx === undefined) rx = ry;
        if (ry === undefined) ry = rx;
        const r = ((rx || 0) + (ry || 0)) / 2
        if (r > 0) for (let i = 0; i < 4; i++) (this.shape as PathShape).pathsegs[0].points[i].radius = r;
    }
}
