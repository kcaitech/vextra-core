/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { RadiusType } from "../data/consts";
import { PolygonShape } from "../data/shape";
import { PathShapeView } from "./pathshape";

export class PolygonShapeView extends PathShapeView {
    get data(): PolygonShape {
        return this.m_data as PolygonShape;
    }
    get radiusType() {
        return RadiusType.Fixed;
    }

    get counts() {
        return this.data.counts;
    }
}