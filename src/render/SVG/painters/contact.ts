/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ContactLineView, ShapeView } from "../../../dataview";
import { ViewSVGRenderer } from "./view";

export class ContactSVGRenderer extends ViewSVGRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const view = this.view as ContactLineView;
        if (!this.checkAndResetDirty()) return this.m_render_version;
        if (!view.isVisible) {
            view.reset("g");
            return ++this.m_render_version;
        }
        const borders = this.renderBorder();
        let props = this.getProps();
        let children = [...borders];
        view.reset("g", props, children);
        return ++this.m_render_version;
    }

    asyncRender() {
        return this.render();
    }
}