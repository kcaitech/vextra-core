/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

export const EPSILON = 1e-7 // 浮点计算误差最大允许值

export function isEqual(a: number, b: number) { // 判断是否相等，差值小于EPSILON视为相等
    return a === b || Math.abs(a - b) < EPSILON
}

export function isZero(value: number) { // 判断是否为0，小于EPSILON的值视为0
    return isEqual(value, 0)
}

export function isOne(value: number) { // 判断是否为1，差值小于EPSILON视为1
    return isEqual(value, 1)
}
