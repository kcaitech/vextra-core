import { OverrideType, Shape, ShapeType, SymbolShape, Variable, VariableType, SymbolUnionShape, GroupShape } from "../../data/shape";
import { SymbolRefShape } from "../../data/symbolref";
import { uuid } from "../../basic/uuid";
import { Page } from "../../data/page";
import { Api } from "../command/recordapi";
import { BasicArray } from "../../data/basic";
import { Border, Fill } from "../../data/style";
import { importBorder, importFill } from "../../data/baseimport";

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

/**
 * @description 判断图层是否为组件的组成部分
 */
export function is_part_of_symbol(shape: Shape) {
    let s: Shape | undefined = shape;
    while (s) {
        if (s.type === ShapeType.Symbol) return true;
        s = s.parent;
    }
    return false;
}

export function is_state(shape: Shape) {
    return shape.type === ShapeType.Symbol && (shape?.parent instanceof SymbolUnionShape);
}

function is_sym(shape: Shape) {
    return shape.type === ShapeType.Symbol;
}

/**
 * @description 给一个图层，返回这个图层所在的组件，如果不是组件内的图层，则return undefined;
 */
export function get_symbol_by_layer(layer: Shape): SymbolShape | undefined {
    let s: Shape | undefined = layer;
    while (s && !is_sym(s)) {
        s = s.parent;
    }
    if (s) return is_state(s) ? s.parent as SymbolShape : s as SymbolShape;
}

function varParent(_var: Variable) {
    let p = _var.parent;
    while (p && !(p instanceof Shape)) {
        p = p.parent;
    }
    return p;
}

function modify_variable(page: Page, shape: Shape, _var: Variable, value: any, api: Api) {
    const p = varParent(_var); // todo 如果p是symbolref(root), shape.isVirtual
    if (!p) throw new Error();
    let r: Shape | undefined = shape;
    while (r && r.isVirtualShape) r = r.parent;
    if (!r) throw new Error();

    // p 可能是symbolref(可能virtual), symbol(可能是被引用，todo 要看一下此时是否是virtual)
    // shape, 可能是virtual, 任意对象，比如在修改填充，它的root是symbolref
    // shape, 非virtual的情况：symbolref, symbol, 其它不需要修改variable, root是自己
    // r.id === p.id时，p非virtual(symbolref or symbol), 同时p是shape的直接父级，可直接修改
    // r.id !== p.id时
    //     p为virtual，则应该override
    //     p非virtual，p应该是symbol，不是shape的直接父级，应该override
    if (r.id !== p.id) {
        _override_variable(page, shape, _var, value, api);
    } else {
        api.shapeModifyVariable(page, _var, value);
    }
}

/**
 * @description override "editor/shape/_overrideVariable"
 */
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
    if (override_id.length > 0) override_id = override_id + "/";
    override_id += _var.id;
    const _var2 = new Variable(uuid(), _var.type, _var.name, value);
    api.shapeAddVariable(page, sym, _var2);
    api.shapeAddOverride(page, sym, override_id, OverrideType.Variable, _var2.id);
    return sym.getVar(_var2.id)!;
}

/**
 * @description override "editor/shape/overrideVariable"
 */
function override_variable(page: Page, varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, api: Api, shape: Shape) {
    // symbol shape
    if (!shape.isVirtualShape && shape.varbinds && shape.varbinds.has(overrideType)) {
        const _vars: Variable[] = [];
        shape.findVar(shape.varbinds.get(overrideType)!, _vars);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === varType) {
            return _var;
        }
    }
    if (!shape.isVirtualShape) return;

    // 先查varbinds
    if (shape.varbinds && shape.varbinds.has(overrideType)) {
        const _vars: Variable[] = [];
        const vars_path: Shape[] = [];
        shape.findVar(shape.varbinds.get(overrideType)!, _vars);
        // if (_vars.length !== vars_path.length) throw new Error();
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === varType) {

            let p = varParent(_var);
            if (!p) throw new Error();

            if (p.isVirtualShape || p instanceof SymbolShape) {
                // override variable
                return _override_variable(page, shape, _var, valuefun(_var), api);
            } else {
                return _var;
            }
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
            let p = varParent(_var); // 这里会有问题！如果p是symbolshape，往上追溯就错了。
            if (!p) throw new Error();
            if (p.isVirtualShape || p instanceof SymbolShape) {
                return _override_variable(page, shape, _var, valuefun(_var), api);
            } else {
                return _var;
            }
        }
    }

    // get first not virtual
    let symRef = shape.parent;
    while (symRef && symRef.isVirtualShape) symRef = symRef.parent;
    if (!symRef || !(symRef instanceof SymbolRefShape)) throw new Error();

    // add override add variable
    const _var2 = new Variable(uuid(), varType, "", valuefun(undefined));
    // _var2.value = valuefun(undefined);
    api.shapeAddVariable(page, symRef, _var2);
    api.shapeAddOverride(page, symRef, override_id, overrideType, _var2.id);

    return symRef.getVar(_var2.id)!;
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

/**
 * @description override "editor/shape/shape4border"
 */
export function shape4border(api: Api, page: Page, shape: Shape) {
    const _var = override_variable(page, VariableType.Borders, OverrideType.Borders, (_var) => {
        const fills = _var?.value ?? shape.style.borders;
        return new BasicArray(...(fills as Array<Border>).map((v) => {
            return importBorder(v);
        }
        ))
    }, api, shape)
    return _var || shape;
}

/**
 * @description override "editor/shape/shape4fill"
 */
export function shape4fill(api: Api, page: Page, shape: Shape) {
    const _var = override_variable(page, VariableType.Fills, OverrideType.Fills, (_var) => {
        const fills = _var?.value ?? shape.style.fills;
        return new BasicArray(...(fills as Array<Fill>).map((v) => {
            const ret = importFill(v);
            const imgmgr = v.getImageMgr();
            if (imgmgr) ret.setImageMgr(imgmgr)
            return ret;
        }
        ))
    }, api, shape)
    return _var || shape;
}

export function is_exist_invalid_shape(selected: Shape[]) {
    let result = false;
    for (let i = 0, len = selected.length; i < len; i++) {
        const item = selected[i];
        if ([ShapeType.Contact, ShapeType.Table].includes(item.type)) return true;
        if ((item as GroupShape).childs?.length) result = is_exist_invalid_shape((item as GroupShape).childs);
        if (result) return true;
    }
    return false;
}
export function is_exist_invalid_shape2(selected: Shape[]) {
    let result = false;
    for (let i = 0, len = selected.length; i < len; i++) {
        const item = selected[i];
        if ([ShapeType.Contact, ShapeType.Table, ShapeType.Symbol].includes(item.type)) return true;
        if ((item as GroupShape).childs?.length) result = is_exist_invalid_shape((item as GroupShape).childs);
        if (result) return true;
    }
    return false;
}

export function is_symbol_or_union(shape: Shape) {
    return shape.type === ShapeType.Symbol || shape.type === ShapeType.SymbolUnion;
}

export function get_state_name(state: SymbolShape, dlt: string) {
    if (!(state.parent instanceof SymbolUnionShape)) {
        return state.name;
    }
    const variables = (state.parent as SymbolShape).variables;
    if (!variables) {
        return state.name;
    }
    let name_slice: string[] = [];
    variables.forEach((v, k) => {
        if (v.type !== VariableType.Status) {
            return;
        }
        let slice = state.symtags?.get(k) || v.value;
        if (slice === SymbolShape.Default_State) {
            slice = dlt;
        }
        slice && name_slice.push(slice);
    })
    return name_slice.toString();
}
