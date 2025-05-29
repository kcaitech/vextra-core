/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


// 数据版本号
// 格式a.b.c
// 主版本号ａ变更，表示数据结构有变化，前后版本无法兼容
// 副版本号ｂ变更，表示局部结构变更，强行读写会丢失对象数据
// 修订版本号ｃ变更，表示数据有微小变化，强行读写仅丢失极小数据
export const FMT_VER_transfrom = "1"; // 同1.0.0
export const FMT_VER_border = "1.0.1"

export const FMT_VER_latest = FMT_VER_border;

export function destruct(version: string) {
    const splits = version.toString().split('.') // toString是因为历史版本记录了number
    const main = Number.parseInt(splits[0] ?? 0)
    const second = Number.parseInt(splits[1] ?? 0)
    const third = Number.parseInt(splits[2] ?? 0)
    return { main, second, third }
}
export function compare(v0: string, v1: string) {
    // return v0 > v1 ? 1 : (v0 < v1 ? -1 : 0); // '1' === '1.0.0'
    if (v0 === v1) return 0;
    const dv0 = destruct(v0)
    const dv1 = destruct(v1)
    if (dv0.main !== dv1.main) return dv0.main - dv1.main;
    if (dv0.second !== dv1.second) return dv0.second - dv1.second;
    if (dv0.third !== dv1.third) return dv0.third - dv1.third;
    return 0;
}
export function lessThan(v0: string, v1: string) {
    return compare(v0, v1) < 0
}
export function greatThan(v0: string, v1: string) {
    return compare(v0, v1) > 0
}
export function equals(v0: string, v1: string) {
    return compare(v0, v1) === 0
}