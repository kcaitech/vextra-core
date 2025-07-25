/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { SymbolRefShape } from "../../data/symbolref";
import { Shape, GroupShape } from "../../data/shape";
import { ShapeType } from "../../data/typesdefine";

/**
 * @deprecated 这个函数不好用,难维护,请使用CircleChecker
 * @description 检查symbol与symbol2之间是否存在循环引用
 * symbol2将包含symbol，若用symbol建一棵树，这颗树上不可以存在一条以symbol2为形的枝叶，若存在则存在循环
 */
export function is_circular_ref2(symbol: Shape, symbol2: string): boolean {
    let deps: { shape: string, ref: string }[] = [
        ...get_topology_map(symbol),
        { shape: symbol2, ref: symbol.id }
    ];
    while (deps.length && is_exist_single_stick(deps)) { // 剪枝
        deps = filter_deps(deps, 'shape', 'ref');
        deps = filter_deps(deps, 'ref', 'shape');
    }
    return !!deps.length;
}

/**
 * @description 以shape为根的所有父子对
 * @param shape
 */
function get_topology_map(shape: Shape) {
    const deps: { shape: string, ref: string }[] = [];
    const childs = shape.type === ShapeType.SymbolRef ? shape.naviChilds : (shape as GroupShape).childs;
    if (!childs?.length) return [];
    for (let i = 0, len = childs.length; i < len; i++) {
        const item = childs[i];
        const is_ref = item.type === ShapeType.SymbolRef
        const c_childs = is_ref ? item.naviChilds : (item as GroupShape).childs;
        if (c_childs?.length || is_ref) {
            deps.push({
                shape: shape.type === ShapeType.SymbolRef ? (shape as SymbolRefShape).refId : shape.id,
                ref: is_ref ? (item as SymbolRefShape).refId : item.id
            });
        }
        if (!c_childs?.length) continue;
        deps.push(...get_topology_map(item));
    }
    return deps;
}

type Sides = 'shape' | 'ref';

function filter_deps(deps: { shape: string, ref: string }[], key1: Sides, key2: Sides) {
    const result: { shape: string, ref: string }[] = [];
    const _checked: Set<string> = new Set();
    const _checked_invalid: Set<string> = new Set();
    for (let i = 0, len = deps.length; i < len; i++) {
        const d = deps[i];
        if (_checked.has(d[key1])) {
            result.push(d);
            continue;
        }
        if (_checked_invalid.has(d[key1])) continue;
        let invalid: boolean = true;
        for (let j = 0, len = deps.length; j < len; j++) {
            if (deps[j][key2] === d[key1]) {
                result.push(d);
                _checked.add(d[key1]);
                invalid = false;
                break;
            }
        }
        if (invalid) _checked_invalid.add(d[key1]);
    }
    return result;
}

/**
 * @description 检查是否存在入度为0的枝
 * @param deps
 */
function is_exist_single_stick(deps: { shape: string, ref: string }[]) {
    const set1 = new Set<string>();
    const set2 = new Set<string>();
    let is_single = false;
    for (let i = 0, len = deps.length; i < len; i++) {
        const dep = deps[i];
        set1.add(dep.shape);
        set2.add(dep.ref);
    }
    set1.forEach(v => {
        if (!set2.has(v)) is_single = true;
    })
    if (is_single) return true;
    set2.forEach(v => {
        if (!set1.has(v)) is_single = true;
    })
    return is_single;
}