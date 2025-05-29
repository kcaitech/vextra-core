/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { AutoLayout, ShapeFrame, ShapeSize } from "../../../data";
import { SymbolView } from "../../symbol";
import { updateAutoLayout } from "../../../editor";
import { GroupLayout } from "./group";

export class SymbolLayout extends GroupLayout {
    constructor(protected view: SymbolView) {
        super(view);
    }

    private _autoLayout(autoLayout: AutoLayout, layoutSize: ShapeSize) {
        const view = this.view;
        const childs = view.childs.filter(c => c.isVisible);
        const layout = updateAutoLayout(childs, autoLayout, layoutSize);
        let hidden = 0;
        for (let i = 0, len = view.childs.length; i < len; i++) {
            const cc = view.childs[i];
            const newTransform = cc.transform.clone();
            const index = Math.min(i - hidden, layout.length - 1);
            newTransform.translateX = layout[index].x;
            newTransform.translateY = layout[index].y;
            if (!cc.isVisible) {
                hidden += 1;
            }
            cc.m_ctx.setDirty(cc);
            cc.layoutProxy.updateLayoutArgs(newTransform, cc.frame);
            cc.layoutProxy.updateFrames();
        }
        const selfframe = new ShapeFrame(0, 0, layoutSize.width, layoutSize.height);
        this.updateLayoutArgs(view.transform, selfframe);
        this.updateFrames();
    }

    measure(parentFrame: ShapeSize | undefined, scale: { x: number, y: number } | undefined) {
        const view = this.view;
        if (view.autoLayout) {
            super.measure(parentFrame, scale);
            const childs = view.childs.filter(c => c.isVisible);
            if (childs.length) {
                const size = new ShapeSize(view.frame.width, view.frame.height);
                this._autoLayout(view.autoLayout, size);
            }
        } else {
            super.measure(parentFrame, scale);
        }
    }
}