/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    GroupShape,
    ImageShape,
    PathShape,
    RectShape,
    Shape,
    ShapeFrame,
    ShapeType,
    TextShape,
    CornerRadius,
    getPathOfRadius,
    Transform,
    ShapeSize,
} from "./shape";
import { Style } from "./style";
import * as classes from "./baseclasses";
import { BasicArray } from "./basic";
import { RadiusType } from "./consts";
import { Guide } from "./baseclasses";
import { Path } from "@kcaitech/path";
export {
    StackAlign,
    StackMode,
    StackSize,
    StackSizing,
    StackWrap,
    AutoLayout
} from "./baseclasses"
import { v4 } from "uuid";

export class Artboard extends GroupShape implements classes.Artboard {
    get frame(): ShapeFrame {
        return new ShapeFrame(0, 0, this.size.width, this.size.height);
    }

    hasSize(): boolean {
        return true;
    }

    typeId = 'artboard';
    // @ts-ignore
    size: ShapeSize
    cornerRadius?: CornerRadius
    haveEdit?: boolean | undefined;
    guides?: BasicArray<Guide>;
    autoLayout?: classes.AutoLayout;
    frameMaskDisabled?: boolean;

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>,
        size: ShapeSize,
        haveEdit?: boolean,
        guides?: BasicArray<Guide>,
        autoLayout?: classes.AutoLayout,
        frameMaskDisabled?: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            ShapeType.Artboard,
            transform,
            style,
            childs
        )
        this.size = size
        this.haveEdit = haveEdit;
        this.guides = guides;
        this.autoLayout = autoLayout;
        this.frameMaskDisabled = frameMaskDisabled;
    }

    getOpTarget(path: string[]) {
        const id0 = path[0];
        if (id0 === 'cornerRadius' && !this.cornerRadius) this.cornerRadius = new CornerRadius(v4(), 0, 0, 0, 0);
        if (id0 === "guides" && !this.guides) {
            this.guides = new BasicArray<Guide>();
        }
        return super.getOpTarget(path);
    }

    getPath(fixedRadius?: number): Path {
        return this.getPathOfSize(this.size, fixedRadius);
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number | undefined): Path {
        return getPathOfRadius(frame, this.cornerRadius, fixedRadius);
    }

    get isContainer() {
        return true;
    }

    get radiusType() {
        return RadiusType.Rect;
    }
}