import { Shape, SymbolShape, Variable } from "./shape";
import { OverrideType } from "./typesdefine";
import { SymbolRefShape } from "./classes";

export function findVar(varId: string, ret: Variable[], varsContainer: (SymbolRefShape | SymbolShape)[], revertStart: number | undefined = undefined, fOverride: boolean = false) {
    let i = revertStart === undefined ? varsContainer.length - 1 : revertStart;
    for (; i >= 0; --i) {
        const container = varsContainer[i];
        const _var = (container instanceof SymbolShape) && container.getVar(varId);
        if (!_var) continue;
        ret.push(_var);
        const ov = findOverride(varId, OverrideType.Variable, varsContainer.slice(0, i));
        if (ov) ret.push(...ov);
        return ret;
    }
    if (!fOverride) return; // 查找被删除掉的变量
    i = revertStart === undefined ? varsContainer.length - 1 : revertStart;
    for (; i >= 0; --i) {
        const container = varsContainer[i];
        const _var = (container instanceof SymbolRefShape) && container.getOverrid(varId, OverrideType.Variable);
        if (!_var) continue;
        ret.push(_var.v);
        const ov = findOverride(varId, OverrideType.Variable, varsContainer.slice(0, i));
        if (ov) ret.push(...ov);
        return ret;
    }
}

export function findOverride(refId: string, type: OverrideType, varsContainer: (SymbolRefShape | SymbolShape)[]) {
    let ret;
    for (let i = varsContainer.length - 1; i >= 0; --i) {
        const container = varsContainer[i];
        if (container instanceof SymbolRefShape) {
            const override = container.getOverrid(refId, type);
            if (override) {
                ret = override;
            }
            refId = refId.length > 0 ? (container.id + '/' + refId) : container.id;
        }
    }
    return ret ? [ret.v] : undefined;
}

export function findOverrideAll(refId: string, type: OverrideType, varsContainer: (SymbolRefShape | SymbolShape)[]) {
    let ret: Variable[] = [];
    for (let i = varsContainer.length - 1; i >= 0; --i) {
        const container = varsContainer[i];
        if (container instanceof SymbolRefShape) {
            const override = container.getOverrid(refId, type);
            if (override) {
                ret.push(override.v);
            }
            refId = refId.length > 0 ? (container.id + '/' + refId) : container.id;
        }
    }
    return ret.length > 0 ? ret : undefined;
}

export function findOverrideAndVar(
    shape: Shape, // not proxyed
    overType: OverrideType,
    varsContainer: (SymbolRefShape | SymbolShape)[],
    fOverride: boolean = false) {
    // override优先
    // find override
    // id: xxx/xxx/xxx
    const id = shape.id;
    const _vars = findOverride(id, overType, varsContainer);
    if (_vars) return _vars;

    const varbinds = shape.varbinds;
    const varId = varbinds?.get(overType);
    if (varId) {
        const _vars: Variable[] = [];
        findVar(varId, _vars, varsContainer, undefined, fOverride);
        if (_vars && _vars.length > 0) return _vars;
    }
}

export function is_mac() {
    return navigator && /macintosh|mac os x/i.test(navigator.userAgent);
}