import {SymbolRefShape} from "../../data/symbolref";
import {GroupShape, Shape, ShapeType, SymbolShape} from "../../data/shape";
import {is_symbol_but_not_union} from "./other";
import {is_circular_ref2} from "./ref_check";
import {Api} from "../command/recordapi";
import {Page} from "../../data/page";

/**
 * @description 检查是否满足迁移条件
 * @param target 计划迁移到的目标
 * @param wander 迁移对象
 * @returns 0 满足迁移条件
 *          1 不满足：只有组件可以迁移到union里
 *          2 target、wonder都为组件且target不为union
 *          3 无法通过循环引用检查
 *          4 是实例组成部分
 *          5 不被允许的图形类型
 *          999 其他
 */
export function unable_to_migrate(target: Shape, wander: Shape): number {
    if (target.type === ShapeType.Symbol) {
        if (wander.type === ShapeType.Table || wander.type === ShapeType.Contact) return 5;
        const children = wander.naviChilds || wander.childs;
        if (children?.length) {
            const tree = wander instanceof SymbolRefShape ? wander.getRootData() : wander;
            if (!tree) return 999;
            if (is_circular_ref2(tree, target.id)) return 3;
        }
        if ((target as SymbolShape).isUnionSymbolShape && !is_symbol_but_not_union(wander)) return 1;
        if (wander.type === ShapeType.Symbol) return 2;
    } else {
        if (target.isVirtualShape) return 4;
    }
    return 0;
}

export function after_migrate(page: Page, api: Api, origin: Shape) {
    if (origin.type === ShapeType.Symbol && (origin as SymbolShape).isUnionSymbolShape && !origin.childs?.length) {
        const origin_parent = origin.parent;
        if (!origin_parent) return;
        const delete_index = (origin_parent as GroupShape).indexOfChild(origin);
        if (delete_index < 0) return;
        api.shapeDelete(page, origin_parent as GroupShape, delete_index);
    }
}