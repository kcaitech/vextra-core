/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { BaseCreator } from "./base"
import * as shapeCreator from "../../../editor/creator/creator"
import { ShapeFrame } from "../../../data"
export class EllipseCreator extends BaseCreator {
    createShape() {
        const x = this.attributes.x || 0
        const y = this.attributes.y || 0

        let width = 0
        if (this.attributes.rx) width = this.attributes.rx * 2;
        else if (this.attributes.width) width = this.attributes.width;

        let height = 0
        if (this.attributes.ry) height = this.attributes.ry * 2;
        else if (this.attributes.height) height = this.attributes.height;

        this.shape = shapeCreator.newOvalShape("圆形", new ShapeFrame(x, y, width, height), this.context.styleMgr)
    }
}
