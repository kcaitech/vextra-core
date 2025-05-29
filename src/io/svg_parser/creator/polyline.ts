/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
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
import { Path } from "@kcdesign/path";
import { ColVector3D } from "../../../basic/matrix2";
import { Transform } from "../../../basic/transform";

export class Polyline extends BaseCreator {
    createShape() {
        const pointsToPathD = this.attributes.pointsToPathD
        if (!pointsToPathD) return;
        const x = this.attributes.polylineX || 0
        const y = this.attributes.polylineY || 0
        const width = this.attributes.width || 0
        const height = this.attributes.height || 0
        const path = new Path(pointsToPathD)
        path.translate(-x, -y)
        this.transform.addPreTransform(new Transform().translate(new ColVector3D([x + (this.attributes.x || 0), y + (this.attributes.y || 0), 0])));
        this.shape = shapeCreator.newPathShape(this.htmlElement?.tagName || "polyline", new ShapeFrame(x, y, width, height), path, this.context.styleMgr, this.style)
    }
}
