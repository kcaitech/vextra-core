/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { RectShape, SideType } from "../data";
import { PathShapeView } from "./pathshape";

export class RectShapeView extends PathShapeView {
    get data(): RectShape {
        return this.m_data as RectShape;
    }

    get isCustomBorder() {
        return !(this.getBorder().sideSetting.sideType === SideType.Normal || this.haveEdit);
    }
}