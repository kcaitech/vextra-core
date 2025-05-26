/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ViewLayout } from "./view";
import { ShapeSize } from "../../../data";
import { PathShapeView } from "../../pathshape";

export class PathLayout extends ViewLayout {
    constructor(protected view: PathShapeView) {
        super(view);
    }

     measure(
        parentFrame: ShapeSize | undefined,
        scale: { x: number, y: number } | undefined,
    ): void {
        super.measure(parentFrame, scale);
        this.view.m_pathsegs = undefined;
    }
}