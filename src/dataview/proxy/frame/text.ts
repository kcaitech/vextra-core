/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { FrameProxy } from "./view";
import { TextShapeView } from "../../textshape";
import { ShapeSize } from "../../../data";

export class TextFrameProxy extends FrameProxy {
    __origin_frame: ShapeSize;

    constructor(protected view: TextShapeView) {
        super(view);
        this.__origin_frame = new ShapeSize(view.data.size.width, view.data.size.height);
    }


    forceUpdateOriginFrame() {
        const frame = this.view.data.size;
        this.__origin_frame.width = frame.width;
        this.__origin_frame.height = frame.height;
    }
}