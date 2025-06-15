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
const {
    equal, strictEqual, deepEqual, throws,
    isFalse, isTrue, isUndefined, isNaN, isOk,
    fail,
} = chai.assert

// local cmdlist
// remote cmdlist
// undo
// redo
// posted

// 组合情况枚举
// 1. 正常还没有posted, undo, 直接undo cmd
// 2. posted, undo, 生成个新cmd进行应用
// 3. 新cmd, 又区分posted与未posted, 进行redo

// 4. 未posted, redo, redo cmd
// 5. posted, redo, 生成新cmd进行应用 （仅是undo时生成的新cmd有可能）

// 考虑节点内部
// arr,shape,idset,text


test("CmdMgr", () => {

})