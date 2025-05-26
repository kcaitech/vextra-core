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

export class PageCanvasRenderer extends ViewCanvasRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const s = Date.now();
        const dpr = this.view.m_ctx.dpr;
        this.ctx.save();
        this.ctx.scale(dpr, dpr);
        const ver = super.render();
        this.ctx.restore();
        const t = Date.now() - s;
        const fps = Math.floor(1000 / t);
        console.log(`单帧绘制用时${t}, fps: ${fps}`);
        return ver;
    }
}