/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Color } from "../../../data";
import { IJSON } from "./basic";

export function importColor(color: IJSON, opacity: number = 1) {
    if (!color) color = {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
    };
    return new Color(color.a * opacity, Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255));
}
