/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { CutoutShape } from "../data";
import { PathShapeView } from "./pathshape";

export class CutoutShapeView extends PathShapeView {
    get data(): CutoutShape {
        return this.m_data as CutoutShape;
    }

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;

        if (!this.isVisible) {
            this.reset("g");
            return ++this.m_render_version;
        }

        const borders = this.renderBorders();

        let props = this.renderProps();
        let children = [...borders];


        this.reset("g", props, children);

        return ++this.m_render_version;
    }

    get isImageFill() {
        return false;
    }
}