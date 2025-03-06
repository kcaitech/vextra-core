/*
 * Copyright (c) 2023-2024 vextra.io. All rights reserved.
 *
 * This file is part of the vextra.io project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { render as renderBorders } from "../render/line_borders"
import { EL, elh } from "./el";
import { PathShapeView } from "./pathshape";
export class LineView extends PathShapeView {
    // protected isNoSupportDiamondScale(): boolean {
    //     return this.m_data.isNoSupportDiamondScale;
    // }

    protected renderFills(): EL[] {
        return [];
    }

    protected renderBorders(): EL[] {
        const border = this.m_data.style.borders;
        if (border && border.strokePaints.some(p => p.isEnabled)) {
            return renderBorders(elh, this.m_data.style, this.getBorders(), this.startMarkerType, this.endMarkerType, this.getPathStr(), this.m_data);
        } else {
            // const props: any = {};
            // props.stroke = '#000000';
            // props['stroke-width'] = 1;
            // props.d = this.getPathStr();
            // props.fill = "none"
            // return [elh('path', props)];
            return [];
        }
    }
}