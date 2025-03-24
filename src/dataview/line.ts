/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { render as renderBorder } from "../render/SVG/effects/line_borders"
import { EL, elh } from "./el";
import { PathShapeView } from "./pathshape";
export class LineView extends PathShapeView {
    protected renderFills(): EL[] {
        return [];
    }

    protected renderBorder(): EL[] {
        const border = this.m_data.style.borders;
        if (border && border.strokePaints.some(p => p.isEnabled)) {
            return renderBorder(elh, this.m_data.style, this.getBorder(), this.startMarkerType, this.endMarkerType, this.getPathStr(), this.m_data);
        } else {
            return [];
        }
    }
}