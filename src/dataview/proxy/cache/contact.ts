/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ContactLineView } from "../../contactline";
import { parsePath } from "../../../data";
import { ViewCache } from "./view";

export class ContactLineViewCache extends ViewCache {
    constructor(protected view: ContactLineView) {
        super(view);
    }

    get path() {
        return this.m_path ?? (this.m_path = parsePath(this.view.getPoints(), false, 1, 1, this.view.fixedRadius));
    }
}
