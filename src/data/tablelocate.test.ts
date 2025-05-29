/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import * as chai from 'chai'
import { BitGrid } from "../basic/grid";
const assert = chai.assert;

test("bit grid", () => {
    const grid = new BitGrid(3, 3);
    grid.set(2, 2, true);
    assert.isTrue(grid.get(2, 2));
    assert.isFalse(grid.get(2, 1));
    assert.isFalse(grid.get(2, 0));
    assert.isFalse(grid.get(1, 2));
    assert.isFalse(grid.get(1, 1));
    assert.isFalse(grid.get(1, 0));
    assert.isFalse(grid.get(0, 2));
    assert.isFalse(grid.get(0, 1));
    assert.isFalse(grid.get(0, 0));
})