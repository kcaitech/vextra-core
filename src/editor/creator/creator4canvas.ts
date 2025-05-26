/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ShapeSize } from "../../data";


function _checkNum(val: number) {
    if (Number.isNaN(val) || (!Number.isFinite(val))) throw new Error(String(val));
}

function _checkFrame(frame: ShapeSize) {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    _checkNum(frame.width);
    _checkNum(frame.height);
}
