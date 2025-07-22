/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { StyleMangerMember, StyleSheet } from "../data";
import { BasicOp } from "./basicop";

export class StyleLibOp {
    constructor(private _basicop: BasicOp) { }

    addStyle(libs: StyleSheet, style: StyleMangerMember) {
        return this._basicop.crdtArrayInsert(libs.variables, libs.variables.length, style);
    }
}
