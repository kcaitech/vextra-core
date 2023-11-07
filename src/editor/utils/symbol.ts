import {OverrideType, Shape, ShapeType, SymbolShape, Variable, VariableType} from "../../data/shape";
import {SymbolRefShape} from "../../data/symbolref";
import {uuid} from "../../basic/uuid";
import {Page} from "../../data/page";
import {Api} from "../command/recordapi";
import {Document} from "../../data/document";
import {log} from "console";

/**
 * @description 图层是否为组件实例的引用部分
 * @param shape
 */
export function is_part_of_symbolref(shape: Shape) {
    let p = shape.parent;
    while (p) {
        if (p.type === ShapeType.SymbolRef) return true;
        p = p.parent;
    }
    return false;
}

function varParent(_var: Variable) {
    let p = _var.parent;
    while (p && !(p instanceof Shape)) {
        p = p.parent;
    }
    return p;
}

function modify_variable(page: Page, shape: Shape, _var: Variable, value: any, api: Api) {
    const p = varParent(_var);
    if (!p) throw new Error();
    if (p.isVirtualShape || (p instanceof SymbolShape && !(shape instanceof SymbolShape))) {
        _override_variable(page, shape, _var, value, api);
    } else {
        api.shapeModifyVariable(page, _var, value);
    }
}

function _override_variable(page: Page, shape: Shape, _var: Variable, value: any, api: Api) {
    let p = varParent(_var);
    if (!p) throw new Error();
    if (p instanceof SymbolShape) {
        if (p.isVirtualShape) throw new Error();
        p = shape;
    }
    let sym: Shape | undefined = p;
    while (sym && sym.isVirtualShape) {
        sym = sym.parent;
    }
    if (!sym || !(sym instanceof SymbolRefShape || sym instanceof SymbolShape)) throw new Error();
    let override_id = p.id;
    override_id = override_id.substring(override_id.indexOf('/') + 1); // 需要截掉第一个
    if (override_id.length === 0) throw new Error();
    if (!(p instanceof SymbolRefShape)) {
        const idx = override_id.lastIndexOf('/');
        if (idx > 0) {
            override_id = override_id.substring(0, idx);
        } else {
            override_id = ""
        }
    }
    if (override_id.length > 0) override_id += "/";
    const _var2 = new Variable(uuid(), _var.type, _var.name, value);
    api.shapeAddVariable(page, sym, _var2);
    api.shapeAddOverride(page, sym, _var.id, OverrideType.Variable, _var2.id);
    return sym.getVar(_var2.id)!;
}

/**
 * @description 由外引入api的变量修改函数
 */
export function modify_variable_with_api(api: Api, page: Page, shape: Shape, varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any) {
    if (!shape.isVirtualShape && shape.varbinds && shape.varbinds.has(overrideType)) {
        const _vars: Variable[] = [];
        shape.findVar(shape.varbinds.get(overrideType)!, _vars);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === varType) {
            modify_variable(page, shape, _var, valuefun(_var), api);
            return true;
        }
    }
    if (!shape.isVirtualShape) return false;
    if (shape.varbinds?.get(overrideType)) {
        const _vars: Variable[] = [];
        shape.findVar(shape.varbinds.get(overrideType)!, _vars);
        if (!_vars.length) {
            console.log('wrong data: _vars.length !== vars_path.length');
            return false;
        }
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === varType) {
            modify_variable(page, shape, _var, valuefun(_var), api);
            return true;
        }
    }

    // override
    let override_id = shape.id;
    override_id = override_id.substring(override_id.indexOf('/') + 1); // 需要截掉第一个
    if (override_id.length === 0) throw new Error();

    const _vars = shape.findOverride(override_id.substring(override_id.lastIndexOf('/') + 1), overrideType);
    if (_vars) {
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === varType) {
            modify_variable(page, shape, _var, valuefun(_var), api);
            return true;
        }
    }
    let symRef = shape.parent;
    while (symRef && symRef.isVirtualShape) symRef = symRef.parent;
    if (!symRef || !(symRef instanceof SymbolRefShape)) throw new Error();

    const _symRef = symRef;
    const _var2 = new Variable(uuid(), varType, "", valuefun(undefined));
    api.shapeAddVariable(page, _symRef, _var2);
    api.shapeAddOverride(page, _symRef, override_id, overrideType, _var2.id);
    return true;
}