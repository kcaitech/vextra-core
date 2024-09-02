import { SymbolRefShape, Document, Page, GroupShape, Shape, ShapeType, SymbolUnionShape } from "../../data";
import { is_circular_ref2 } from "./ref_check";
import { Api } from "../coop/recordapi";
import { is_exist_invalid_shape2 } from "../symbol";

/**
 * @description 图层迁移是一个危险程度很高的行为，很有可能造成父子循环或引用循环，从而导致应用卡死！因此函数务必要非常可靠，同时还要确保入口尽量单一，便于维护。
 */
export function unable_to_migrate(targetEnv: Shape, wander: Shape) {
    if (targetEnv.isVirtualShape) {
        return 1;
    }

    if (targetEnv.type === ShapeType.SymbolUnion) {
        return 2;
    }

    let p: Shape | undefined = targetEnv;
    while (p && p.type !== ShapeType.Symbol) {
        p = p.parent;
    }

    if (p) {
        if (is_exist_invalid_shape2([wander])) {
            return 3;
        }

        const children = wander.naviChilds || (wander as any).childs;
        if (children?.length) {
            const tree = wander instanceof SymbolRefShape ? wander.symData : wander;
            if (!tree) {
                return 4;
            }
            if (is_circular_ref2(tree, p.id)) {
                return 5;
            }
        }
    }

    return 0;
}

export function after_migrate(document: Document, page: Page, api: Api, origin: Shape) {
    if (origin instanceof SymbolUnionShape && !origin.childs?.length) {
        const origin_parent = origin.parent;
        if (!origin_parent) return;
        const delete_index = (origin_parent as GroupShape).indexOfChild(origin);
        if (delete_index < 0) return;
        api.shapeDelete(document, page, origin_parent as GroupShape, delete_index);
    }
}