import { Shape, ShapeType, GroupShape, SymbolRefShape } from "../../data";

export class CircleChecker {
    private static get_topology_map(shape: Shape) {
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
            deps.push(...this.get_topology_map(item));
        }
        return deps;
    }

    private static filter_deps(deps: { shape: string, ref: string }[], key1: 'shape' | 'ref', key2: 'shape' | 'ref') {
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

    private static is_exist_single_stick(deps: { shape: string, ref: string }[]) {
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

    static assert(symbol: Shape, symbol2: string): boolean {
        let deps: { shape: string, ref: string }[] = [
            ...this.get_topology_map(symbol),
            { shape: symbol2, ref: symbol.id }
        ];
        while (deps.length && this.is_exist_single_stick(deps)) { // 剪枝
            deps = this.filter_deps(deps, 'shape', 'ref');
            deps = this.filter_deps(deps, 'ref', 'shape');
        }
        return !!deps.length;
    }
}