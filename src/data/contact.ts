/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Style } from "./style";
import { Text } from "./text/text";
import { BasicArray } from "./basic";
import { CurvePoint, ShapeType } from "./baseclasses"
import { ContactForm, PathSegment } from "./baseclasses";
import { PathShape, Transform, ShapeSize } from "./shape";
import { RadiusType } from "./consts";
import { ContactShape as ContactShapeStatic } from "./baseclasses"

export class ContactShape extends PathShape implements ContactShapeStatic {
    typeId = 'contact-shape'
    isEdited: boolean
    mark: boolean
    text: Text

    from?: ContactForm
    to?: ContactForm
    constructor(
        crdtidx: number[],
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        pathsegs: BasicArray<PathSegment>,
        isEdited: boolean,
        text: Text,
        mark: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style,
            size,
            pathsegs
        )

        this.crdtidx = crdtidx;
        this.isEdited = isEdited; // 路径是否已被编辑
        this.text = text;
        this.mark = mark;
    }

    get points(): CurvePoint[] {
        return this.pathsegs[0].points
    }
    get isClosed() {
        return false;
    }
    get isPathIcon() {
        return false;
    }
    get radiusType() {
        return RadiusType.Fixed;
    }
}