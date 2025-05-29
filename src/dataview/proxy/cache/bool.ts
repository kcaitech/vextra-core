/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BoolShapeView, render2path } from "../../boolshape";
import { ViewCache } from "./view";

export class BoolShapeViewCache extends ViewCache {
    constructor(protected view: BoolShapeView) {
        super(view);
    }

    get path() {
        if (this.m_path) return this.m_path;
        this.m_path = render2path(this.view);
        this.m_path.freeze();
        return this.m_path;
    }
}
