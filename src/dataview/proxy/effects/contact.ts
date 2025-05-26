/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ContactLineView } from "../../contactline";
import { ViewModifyEffect } from "./view";

export class ContactModifyEffect extends ViewModifyEffect {
    constructor(protected view: ContactLineView) {
        super(view);
    }

    emit(taskIds: string[]) {
        super.emit(taskIds);
        this.view.updateApex();
    }
}