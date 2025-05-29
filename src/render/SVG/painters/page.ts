/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ShapeView } from "../../../dataview";
import { ViewSVGRenderer } from "./view";

export class PageSVGRenderer extends ViewSVGRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const version = super.render();
        if (version) {
            this.view.eltag = "svg";
        }
        return version;
    }

    asyncRender() {
        return this.render();
    }
}