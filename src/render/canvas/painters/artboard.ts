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

export class ArtboardCanvasRenderer extends ViewCanvasRenderer {
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
        const blurEnd = this.renderBlur();
        const shadowEnd = this.renderShadows();
        this.renderFills();
        const clipEnd = this.clip();
        if (clipEnd) { // 裁剪容器中的边框需要在内容的上层
            this.renderContents();
            clipEnd();
            this.renderBorder();
        } else {
            this.renderBorder();
            this.renderContents();
        }
        shadowEnd && shadowEnd();
        blurEnd && blurEnd();
        ctx.restore();
        return ++this.m_render_version;
    }
}