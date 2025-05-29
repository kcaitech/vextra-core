/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ShapeView, SymbolRefView, GroupShapeView } from "../../../dataview";
import { Shape } from "../../../data";

type Side = 'start' | 'end';
type Path = {
    start: string;
    end: string;
}
/**
 * @description 检查组件是否循环依赖、图层之间是否倒转父子元素关系
 */
export class CircleChecker {
    private static getId(shape: ShapeView) {
        return shape instanceof SymbolRefView ? shape.refId : shape.id;
    }

    private static getChildren(shape: ShapeView | Shape) {
        return shape instanceof SymbolRefView ? shape.naviChilds : shape instanceof GroupShapeView ? shape.childs : undefined;
    }

    private static get_topology_map(shape: ShapeView) {
        const deps: Path[] = [];
        const children = this.getChildren(shape);
        if (!children?.length) return [];
        for (const child of children) {
            deps.push({ start: this.getId(shape), end: this.getId(child) });
            const cc = this.getChildren(child);
            cc?.length && deps.push(...this.get_topology_map(child));
        }
        return deps;
    }

    private static filter_deps(deps: Path[], key1: Side, key2: Side) {
        const result: Path[] = [];
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

    private static is_exist_single_stick(deps: Path[]) {
        const set1 = new Set<string>();
        const set2 = new Set<string>();
        let is_single = false;
        for (let i = 0, len = deps.length; i < len; i++) {
            const dep = deps[i];
            set1.add(dep.start);
            set2.add(dep.end);
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

    /**
     * @description 若结果为true,则存在循环,则root不能接受leaf
     */
    static assert4view(root: ShapeView, leaf: ShapeView): boolean {
        let deps: Path[] = [...this.get_topology_map(root), ...this.get_topology_map(leaf)];
        deps.push({ start: this.getId(root), end: this.getId(leaf) });
        while (deps.length && this.is_exist_single_stick(deps)) {
            deps = this.filter_deps(deps, 'start', 'end');
            deps = this.filter_deps(deps, 'end', 'start');
        }
        return !!deps.length;
    }
}