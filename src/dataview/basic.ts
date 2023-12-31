import { OverrideType, Shape, ShapeFrame, SymbolRefShape, SymbolShape, Variable } from "../data/classes";

export function stringh(tag: string, attrs?: any, childs?: Array<string>): string;
export function stringh(tag: string, childs?: Array<string>): string;
export function stringh(...args: any[]): string {
    const tag = args[0];
    let attrs = args[1];
    let childs = args[2];
    if (args.length === 3) {
        //
    }
    else if (args.length === 2) {
        if (Array.isArray(args[1])) {
            attrs = undefined;
            childs = args[1];
        }
    }
    else {
        throw new Error("args err!");
    }

    if (typeof tag !== 'string') {
        throw new Error("not support:" + tag);
    }

    let ret = '<' + tag;
    if (attrs) for (let a in attrs) {
        const attr = attrs[a];
        if (a === 'style') {
            let style = ""
            for (let b in attr) {
                style += b + ':' + attr[b] + ';';
            }
            ret += ' ' + a + '="' + style + '"';
        }
        else {
            ret += ' ' + a + '="' + attr + '"';
        }
    }
    ret += '>';
    if (childs) for (let i = 0, len = childs.length; i < len; i++) {
        ret += childs[i];
    }
    ret += '</' + tag + '>';
    return ret;
}

// 待优化
export function findVar(varId: string, ret: Variable[], varsContainer: (SymbolRefShape | SymbolShape)[], i: number | undefined = undefined) {
    i = i === undefined ? varsContainer.length - 1 : i;
    for (; i >= 0; --i) {
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

export function findOverride(refId: string, type: OverrideType, varsContainer: (SymbolRefShape | SymbolShape)[]) {
    for (let i = varsContainer.length - 1; i >= 0; --i) {
        const container = varsContainer[i];
        const override = container.getOverrid(refId, type);
        if (override) {
            const ret = [override.v];
            refId = override.v.id;
            if (container instanceof SymbolRefShape) refId = container.id + '/' + refId;
            findVar(refId, ret, varsContainer, i - 1);
            return ret;
        }
        if (container instanceof SymbolRefShape) refId = container.id + '/' + refId;
    }
}

export function genid(shape: Shape,
    varsContainer: (SymbolRefShape | SymbolShape)[]) {
    if (varsContainer.length > 0) {
        let id = "";
        for (let i = 0, len = varsContainer.length; i < len; ++i) {
            const container = varsContainer[i];
            if (container instanceof SymbolRefShape) {
                if (id.length > 0) id += '/';
                id += container.id;
            }
        }
        if (id.length > 0) {
            return id + '/' + shape.id;
        }
    }
    return shape.id;
}

export function findOverrideAndVar(
    shape: Shape, // not proxyed
    overType: OverrideType,
    varsContainer: (SymbolRefShape | SymbolShape)[]) {

    const varbinds = shape.varbinds;
    const varId = varbinds?.get(overType);
    if (varId) {
        const _vars: Variable[] = [];
        findVar(varId, _vars, varsContainer);
        if (_vars && _vars.length > 0) return _vars;
    }

    // find override
    // id: xxx/xxx/xxx
    const id = shape.id; // genid(shape, varsContainer);
    const _vars = findOverride(id, overType, varsContainer);
    return _vars;
}


export interface RenderTransform {
    // 为保持位置及形状不变，提前设置给子对象的参数
    dx: number
    dy: number
    rotate: number
    hflip: boolean
    vflip: boolean

    scaleX: number // == parent.frame.width / parentFrame.width ?
    scaleY: number
    parentFrame: ShapeFrame // parent的实际绘制frame
}