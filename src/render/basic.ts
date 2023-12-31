
// export class EL {
//     private m_tag: string;
//     private m_attr: any;
//     private m_childs: EL[];
//     constructor(tag: string, attr?: any, childs?: EL | EL[]) {
//         this.m_tag = tag;
//         this.m_attr = attr || {};
//         this.m_childs = childs? (Array.isArray(childs)? childs : [childs]) : [];
//     }
//     get tag() {
//         return this.m_tag;
//     }
//     set tag(tag: string) {
//         this.m_tag = tag;
//     }
//     get attr() {
//         return this.m_attr;
//     }
//     set attr(attr: any) {
//         this.m_attr = attr || {};
//     }
//     get childs() {
//         return this.m_childs;
//     }
// }
// export class ELArray extends Array<EL> {}
// export function h(tag: string, attr?: any, childs?: EL | EL[]): EL {
//     return new EL(tag, attr, childs);
// }
// export function transform<T>(e: EL | ELArray, h: (tag: string, attr: any, childs?:T[]) => T): T | T[] {
//     return (Array.isArray(e) ? e : [e]).map((a) => {
//         const childs = a.childs && a.childs.length > 0 && transform(a.childs, h) || undefined;
//         if (childs) return h(a.tag, a.attr, childs as T[])
//         return h(a.tag, a.attr);
//     });
// }

import { ResizingConstraints } from "../data/consts";
import { Color, CurvePoint, OverrideType, Path, Point2D, Shape, ShapeFrame, SymbolRefShape, SymbolShape, Variable, VariableType } from "../data/classes";
import { Matrix } from "../basic/matrix";
import { findOverrideAndVar } from "../data/utils";
export { findOverrideAndVar } from "../data/utils";

// export { h } from "vue";
// import { VNode } from "vue";
// export interface EL extends VNode {}
// export class ELArray extends Array<VNode> {}
// export function transform(e: EL | ELArray, h: (tag: string, attr: any, childs:VNode[]) => VNode): VNode | VNode[] {
//     return e;
// }

export function isColorEqual(lhs: Color, rhs: Color): boolean {
    return lhs.equals(rhs);
}

export const DefaultColor = Color.DefaultColor;

export function isVisible(shape: Shape, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
    if (!varsContainer) return !!shape.isVisible;

    const _vars = findOverrideAndVar(shape, OverrideType.Visible, varsContainer);
    if (_vars && _vars.length > 0) {
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.Visible) {
            return !!_var.value;
        }
    }

    return !!shape.isVisible;
}

export function randomId() {
    return Math.floor((Math.random() * 10000) + 1);
}
