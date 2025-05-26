/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ShapeView } from "../../../dataview";
import { ViewCanvasRenderer } from "./view";

export class ContactCanvasRenderer extends ViewCanvasRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const ctx = this.view.canvasRenderingContext2D;
        ctx.save();
        if (this.props.opacity) ctx.globalAlpha = this.props.opacity;
        if (this.props.globalCompositeOperation) {
            ctx.globalCompositeOperation = this.props.globalCompositeOperation;
        }
        this.renderBorder();
        ctx.restore();
        return ++this.m_render_version;
    }
}