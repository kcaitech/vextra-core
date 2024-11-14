import { ShapeView, SymbolRefView, GroupShapeView } from "../../dataview";

type Side = 'start' | 'end';
type Path = {
    start: string;
    end: string;
}
/**
 * @description 检查组件是否循环依赖、图层之间是否倒转父子元素关系
 */
export class CircleChecker {
    private static get_topology_map(shape: ShapeView) {
        const deps: Path[] = [];
        const children = (shape as GroupShapeView).childs;
        if (!children?.length) return [];
        for (const child of children) {
            const end = child instanceof SymbolRefView ? child.refId : child.id;
            deps.push({ start: shape.id, end });
            if ((child as GroupShapeView).childs?.length) deps.push(...this.get_topology_map(child));
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
     * @description alpha 包含 beta 即为 true 即产生了循环
     */
    static assert4view(alpha: ShapeView, beta: ShapeView): boolean {
        let deps: Path[] = [...this.get_topology_map(alpha), ...this.get_topology_map(beta)];
        const start = alpha instanceof SymbolRefView ? alpha.refId : alpha.id;
        const end = beta instanceof SymbolRefView ? beta.refId : beta.id;
        deps.push({ start, end });
        console.log(JSON.parse(JSON.stringify(deps)));
        while (deps.length && this.is_exist_single_stick(deps)) {
            deps = this.filter_deps(deps, 'start', 'end');
            deps = this.filter_deps(deps, 'end', 'start');
        }
        return !!deps.length;
    }
}