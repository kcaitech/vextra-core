
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
import { Color, OverrideType, Shape, ShapeFrame, SymbolRefShape, SymbolShape, Variable, VariableType } from "../data/classes";


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

export function isVisible(shape: Shape, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, consumedVars: { slot: string, vars: Variable[] }[] | undefined) {
    if (!varsContainer) return !!shape.isVisible;

    const _vars = findOverrideAndVar(shape, OverrideType.Visible, varsContainer);
    if (_vars && _vars.length > 0) {
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.Visible) {
            if (consumedVars) consumedVars.push({ slot: OverrideType.Visible, vars: _vars });
            return !!_var.value;
        }
    }

    return !!shape.isVisible;
}

export interface RenderTransform {
    dx: number
    dy: number
    scaleX: number
    scaleY: number
    rotate: number
    hflip: boolean
    vflip: boolean
    parentFrame: ShapeFrame
}

export function isNoTransform(trans: RenderTransform | undefined): boolean {
    return !trans ||
        trans.dx === 0 &&
        trans.dy === 0 &&
        trans.scaleX === 1 &&
        trans.scaleY === 1 &&
        trans.rotate === 0 &&
        !trans.hflip &&
        !trans.vflip;
}

export function fixFrameByConstrain(shape: Shape, parentFrame: ShapeFrame, frame: ShapeFrame) {
    const originParentFrame = shape.parent?.frame; // 至少有page!
    if (!originParentFrame) return;

    const cFrame = shape.frame;
    const resizingConstraint = shape.resizingConstraint;
    if (!resizingConstraint || ResizingConstraints.isUnset(resizingConstraint)) {
        return;
    }

    // 水平
    const hasWidth = ResizingConstraints.hasWidth(resizingConstraint);
    const hasLeft = ResizingConstraints.hasLeft(resizingConstraint);
    const hasRight = ResizingConstraints.hasRight(resizingConstraint);
    // 计算width, x
    // 宽度与同时设置左右是互斥关系，万一数据出错，以哪个优先？先以左右吧
    let cw = hasWidth ? cFrame.width : frame.width;
    let cx = frame.x;
    if (hasLeft && hasRight) {
        cx = cFrame.x;
        const dis = originParentFrame.width - (cFrame.x + cFrame.width);
        cw = parentFrame.width - dis - cx;
    }
    else if (hasLeft) {
        cx = cFrame.x;
    }
    else if (hasRight) {
        cx = frame.x;
        const dis = originParentFrame.width - (cFrame.x + cFrame.width);
        cw = parentFrame.width - dis - cx;
    }
    else if (hasWidth) {
        // 居中
        cx += (frame.width - cFrame.width) / 2;
    }

    // 垂直
    const hasHeight = ResizingConstraints.hasHeight(resizingConstraint);
    const hasTop = ResizingConstraints.hasTop(resizingConstraint);
    const hasBottom = ResizingConstraints.hasBottom(resizingConstraint);
    // 计算height, y
    let ch = hasHeight ? cFrame.height : frame.height;
    let cy = frame.y;
    if (hasTop && hasBottom) {
        cy = cFrame.y;
        const dis = originParentFrame.height - (cFrame.y + cFrame.height);
        ch = parentFrame.height - dis - cy;
    }
    else if (hasTop) {
        cy = cFrame.y;
    }
    else if (hasBottom) {
        cy = frame.y;
        const dis = originParentFrame.height - (cFrame.y + cFrame.height);
        ch = parentFrame.height - dis - cy;
    }
    else if (hasHeight) {
        // 居中
        cy += (frame.height - cFrame.height) / 2;
    }

    frame.x = cx;
    frame.y = cy;
    frame.width = cw;
    frame.height = ch;
}

function findVar(varId: string, ret: Variable[], varsContainer: (SymbolRefShape | SymbolShape)[], i: number = 0) {
    for (let len = varsContainer.length; i < len; ++i) {
        const container = varsContainer[i];
        const override = container.getOverrid(varId, OverrideType.Variable);
        if (override) {
            ret.push(override.v);
            // scope??
            varId = override.v.id;
        }
        else {
            const _var = container.getVar(varId);
            if (_var) {
                ret.push(_var);
            }
        }
        if (container instanceof SymbolRefShape) varId = container.id + '/' + varId;
    }
}

function findOverride(refId: string, type: OverrideType, varsContainer: (SymbolRefShape | SymbolShape)[]) {
    for (let i = 0, len = varsContainer.length; i < len; ++i) {
        const container = varsContainer[i];
        const override = container.getOverrid(refId, type);
        if (override) {
            const ret = [override.v];
            findVar(override.v.id, ret, varsContainer, i + 1);
            return ret;
        }
        if (container instanceof SymbolRefShape) refId = container.id + '/' + refId;
    }
}

export function findOverrideAndVar(
    shape: Shape, // proxyed
    overType: OverrideType,
    varsContainer: (SymbolRefShape | SymbolShape)[]) {

    // if (!(shape as any).__symbolproxy) throw new Error("");
    const varbinds = shape.varbinds;
    if (!varbinds) {
        // find override
        // id: xxx/xxx/xxx
        const id = shape.id;

        const _vars = findOverride(id, overType, varsContainer);
        // if (_vars) {
        //     (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
        //     const _var = _vars[_vars.length - 1];
        //     if (_var && _var.type === varType) {
        //         return _var.value;
        //     }
        // }
        return _vars;
    } else {
        const varId = varbinds.get(overType);
        if (varId) {
            const _vars: Variable[] = [];
            findVar(varId, _vars, varsContainer);
            // watch vars
            // (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            // const _var = _vars[_vars.length - 1];
            // if (_var && _var.type === varType) {
            //     return _var.value;
            // }
            return _vars;
        }
    }
}