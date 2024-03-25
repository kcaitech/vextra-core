import { OverrideType, Shape, ShapeType, SymbolShape, Variable, VariableType, SymbolUnionShape, GroupShape } from "../data/shape";
import { ExportOptions, SymbolRefShape } from "../data/symbolref";
import { uuid } from "../basic/uuid";
import { Page } from "../data/page";
import { Api } from "./coop/recordapi";
import { newText2 } from "./creator";
import { BlendMode, Border, ContextSettings, Fill, Shadow, Style, TableCell, TableCellType, Text } from "../data/classes";
import { findOverride, findVar } from "../data/utils";
import { BasicArray } from "../data/basic";
import { IImportContext, importBorder, importColor, importContextSettings, importExportOptions, importFill, importGradient, importShadow, importStyle, importTableCell, importTableShape, importText } from "../data/baseimport";
import { ShapeView, TableCellView, TableView, isAdaptedShape } from "../dataview";
import { Document, ShapeFrame } from "../data/classes";
import { newTableCellText } from "../data/textutils";

/**
 * @description 图层是否为组件实例的引用部分
 * @param shape
 */
export function is_part_of_symbolref(shape: ShapeView | Shape) {
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

export function varParent(_var: Variable) {
    let p = _var.parent;
    while (p && !(p instanceof Shape)) {
        p = p.parent;
    }
    return p;
}


// 修改对象属性
// 1. 如果普通对象(非virtual、非symbolref)
// 1.1 varbind, 则到3
// 1.2 正常修改. 
// 2. 如果对象为virtual或者symbolref, 将属性值override到var再修改
// 2.1 创建新var
// 2.2 将属性 override到新var
// 2.3 如果已级override到var，但不可修改，仍然override到新var再修改
// 3. 如果为var，判断var是否属于virtual对象:
// 3.1 如果是则override到新var再修改;(仅override原始varid)
// 3.1.1 创建新var 同2.1
// 3.1.2 将var override到新var
// 3.2 否则正常修改var

function _varsContainer(view: ShapeView) {
    let varsContainer = view.varsContainer;
    if (view.data instanceof SymbolRefShape) {
        varsContainer = (varsContainer || []).concat(view.data);
    }
    return varsContainer;
}

/**
 * 
 */
function _ov_2(type: OverrideType, name: string, value: any, varType: VariableType, view: ShapeView, refId: string, page: Page, api: Api) {
    // const view = this.__shape;
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) throw new Error();
    const host = varsContainer.find((v) => v instanceof SymbolRefShape);
    if (!host || !(host instanceof SymbolRefShape)) throw new Error();

    let override_id: string = refId.length > 0 ? (refId + '/' + type) : type;
    for (let i = varsContainer.length - 1; i >= 0; --i) {
        const c = varsContainer[i];
        if (c === host) break;
        if (c instanceof SymbolRefShape) override_id = c.id + '/' + override_id;
    }

    if (varType === VariableType.Text
        && typeof value === 'string') {
        throw new Error();
    }

    const _var2 = _ov_newvar(host, name, value, varType, page, api);

    api.shapeAddOverride(page, host, override_id, _var2.id);
    // _ov_2_2(host, type, _var2.id, view, page, api);
    return _var2;
}

// /**
//  * 将当前shape的overridetype对应的属性，override到varid的变量
//  * @param type
//  * @param varId
//  * @param api
//  */
// function _ov_2_2(host: SymbolRefShape, type: OverrideType, varId: string, view: ShapeView, page: Page, api: Api) {

//     // const view = this.__shape;
//     const varsContainer = _varsContainer(view);
//     if (!varsContainer || varsContainer.length === 0) throw new Error();
//     // const host = varsContainer.find((v) => v instanceof SymbolRefShape);
//     // if (!host || !(host instanceof SymbolRefShape)) throw new Error();

//     let override_id: string = (view.data instanceof SymbolRefShape) ? type : (view.data.id + '/' + type);
//     for (let i = varsContainer.length - 1; i >= 0; --i) {
//         const c = varsContainer[i];
//         if (c === host) break;
//         if (c instanceof SymbolRefShape) override_id = c.id + '/' + override_id;
//     }

//     api.shapeAddOverride(page, host, override_id, type, varId);
// }

function _ov_newvar(host: SymbolRefShape | SymbolShape, name: string, value: any, type: VariableType, page: Page, api: Api) {
    const _var2 = new Variable(uuid(), type, name, value);
    api.shapeAddVariable(page, host, _var2); // create var
    return _var2;
}

/**
 * 
 * @param _var 0: 原始var，1: 当前起作用的var。原始var所在的view能不能拿到？
 * @param name 
 * @param valuefun 
 * @param view 
 * @param page 
 * @param api 
 * @returns 
 */
function _ov_3(_var: Variable[], name: string, valuefun: (_var: Variable | undefined) => any, view: ShapeView, page: Page, api: Api) {
    if (_var.length === 0) throw new Error();
    const p = varParent(_var[_var.length - 1]);
    if (!p) throw new Error();
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) {
        // p.isVirtual??
        return _var[_var.length - 1]; // symbolshape?
    }

    const pIdx = varsContainer.findIndex((v) => v.id === p.id);
    // if (pIdx < 0) throw new Error(); // 可能的，当前view为symbolref，正在修改组件变量
    const hostIdx = varsContainer.findIndex((v) => v instanceof SymbolRefShape);
    if (hostIdx < 0) return _var[_var.length - 1]; // 可直接修改;
    if (pIdx >= 0 && pIdx <= hostIdx) return _var[_var.length - 1]; // 可直接修改

    const value = valuefun(_var[_var.length - 1]);
    const host = varsContainer[hostIdx] as SymbolRefShape;
    return _ov_3_1(_var, name, value, host, view, page, api);
}

function _ov_3_1(_var: Variable[], name: string, value: any, host: SymbolRefShape, view: ShapeView, page: Page, api: Api) { // 3.1
    // override text
    if (_var[0].type === VariableType.Text
        && typeof value === 'string') {
        const origin = _var[_var.length - 1].value as Text;
        const text = newText2(origin.attr, origin.paras[0]?.attr, origin.paras[0]?.spans[0]);
        text.insertText(value, 0);
        value = text;
    }
    // const view = this.__shape;
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) throw new Error();
    // const host = varsContainer.find((v) => v instanceof SymbolRefShape);
    // if (!host || !(host instanceof SymbolRefShape)) throw new Error();

    let p = varParent(_var[0]);
    if (!p) throw new Error();
    // if (!p.isVirtualShape) throw new Error(); // 不一定,可能是symbolshape??然后也不在view结构里？

    if (isAdaptedShape(p)) throw new Error(); // 不用adapted的
    let pIdx = varsContainer.findIndex((v) => v.id === p!.id);// 不对？虚拟对象的id？
    if (pIdx < 0) { // 可能的，当前view为symbolref，正在修改组件变量
        // 组件中的变量，不在ref中也不在view的子view中
        pIdx = varsContainer.length - 1;
    }

    let override_id = _var[0].id;
    for (let i = pIdx; i >= 0; --i) {
        const c = varsContainer[i];
        if (c === host) break;
        if (c instanceof SymbolRefShape) override_id = c.id + '/' + override_id;
    }

    const _var2 = _ov_newvar(host, name, value, _var[0].type, page, api);
    // _ov_3_1_2(_var, _var2.id, host, view, page, api); // override

    api.shapeAddOverride(page, host, override_id, _var2.id);
    return _var2;
}

// function _ov_3_1_2(fromVar: Variable[], toVarId: string, host: SymbolRefShape | SymbolShape, view: ShapeView, page: Page, api: Api) {
//     let p = varParent(fromVar[0]);
//     if (!p) throw new Error();
//     // if (!p.isVirtualShape) throw new Error(); // 不一定,可能是symbolshape??然后也不在view结构里？

//     // const view = this.__shape;
//     const varsContainer = _varsContainer(view);
//     if (!varsContainer || varsContainer.length === 0) throw new Error();

//     if (isAdaptedShape(p)) throw new Error(); // 不用adapted的
//     let pIdx = varsContainer.findIndex((v) => v.id === p!.id);// 不对？虚拟对象的id？
//     if (pIdx < 0) { // 可能的，当前view为symbolref，正在修改组件变量
//         // 组件中的变量，不在ref中也不在view的子view中
//         pIdx = varsContainer.length - 1;
//     }

//     let override_id = fromVar[0].id;
//     for (let i = pIdx; i >= 0; --i) {
//         const c = varsContainer[i];
//         if (c === host) break;
//         if (c instanceof SymbolRefShape) override_id = c.id + '/' + override_id;
//     }

//     api.shapeAddOverride(page, host, override_id, OverrideType.Variable, toVarId);
// }

function _ov(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, view: ShapeView, page: Page, api: Api) {
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) return;

    if (!view.isVirtualShape && !(view.data instanceof SymbolRefShape)) {
        if (view.varbinds && view.varbinds.has(overrideType)) { // 走var
            const _vars: Variable[] = [];
            findVar(view.varbinds.get(overrideType)!, _vars, varsContainer);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                return _ov_3(_vars, _var.name, valuefun, view, page, api);
            }
        }
        return;
    }

    if (!view.isVirtualShape) {
        // if (!(view.data instanceof SymbolRefShape)) return;
        switch (overrideType) {
            case OverrideType.Borders:
            case OverrideType.ContextSettings:
            case OverrideType.EndMarkerType:
            case OverrideType.Fills:
            case OverrideType.Shadows:
            case OverrideType.StartMarkerType:
                break;
            case OverrideType.ExportOptions:
            case OverrideType.Image:
            case OverrideType.Lock:
            case OverrideType.SymbolID:
            case OverrideType.TableCell:
            case OverrideType.Text:
            case OverrideType.Variable:
            case OverrideType.Visible:
                return;
        }
    }

    const refId = view.data instanceof SymbolRefShape ? "" : view.data.id;
    const _vars = findOverride(refId, overrideType, varsContainer);
    if (_vars) {
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === varType) {
            // 判断是否可修改
            const p = varParent(_var);
            if (!p) throw new Error();
            const pIdx = varsContainer.findIndex((v) => v.id === p.id);
            // if (pIdx < 0) throw new Error(); // 可能的，当前view为symbolref，正在修改组件变量
            const hostIdx = varsContainer.findIndex((v) => v instanceof SymbolRefShape);
            // if (hostIdx < 0) throw new Error();
            if (hostIdx < 0 || pIdx >= 0 && pIdx <= hostIdx) return _var; // 可直接修改
            // return _ov_3(_var, _var.name, valuefun, view, page, api);
            // 否则重新override
        }
    }

    if (view.varbinds && view.varbinds.has(overrideType)) { // 走var
        const _vars: Variable[] = [];
        findVar(view.varbinds.get(overrideType)!, _vars, varsContainer);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === varType) {
            return _ov_3(_vars, _var.name, valuefun, view, page, api);
        }
    }

    return _ov_2(overrideType, "", valuefun(undefined), varType, view, refId, page, api);
}


export function override_variable2(page: Page, varType: VariableType, overrideType: OverrideType, refId: string, valuefun: (_var: Variable | undefined) => any, api: Api, view: ShapeView) {
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) return;
    if (!view.isVirtualShape) return;
    // const refId = view.data instanceof SymbolRefShape ? "" : view.data.id;
    const _vars = findOverride(refId, overrideType, varsContainer);
    if (_vars) {
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === varType) {
            // 判断是否可修改
            const p = varParent(_var);
            if (!p) throw new Error();
            const pIdx = varsContainer.findIndex((v) => v.id === p.id);
            // if (pIdx < 0) throw new Error(); // 可能的，当前view为symbolref，正在修改组件变量
            const hostIdx = varsContainer.findIndex((v) => v instanceof SymbolRefShape);
            // if (hostIdx < 0) throw new Error();
            if (hostIdx < 0 || pIdx >= 0 && pIdx <= hostIdx) return _var; // 可直接修改
            // return _ov_3(_var, _var.name, valuefun, view, page, api);
            // 否则重新override
        }
    }

    return _ov_2(overrideType, "", valuefun(undefined), varType, view, refId, page, api);
}

function _clone_value(_var: Variable, document: Document, page: Page) {
    if (_var.value === undefined) return undefined;

    const ctx: IImportContext = new class implements IImportContext { document: Document = document; curPage: string = page.id };

    switch (_var.type) {
        case VariableType.MarkerType:
            return _var.value;
        case VariableType.Borders:
            return (_var.value as Border[]).reduce((arr, v) => {
                arr.push(importBorder(v, ctx));
                return arr;
            }, new BasicArray<Border>());
        case VariableType.Color:
            return importColor(_var.value);
        case VariableType.ContextSettings:
            return importContextSettings(_var.value);
        case VariableType.Fills:
            return (_var.value as Fill[]).reduce((arr, v) => {
                arr.push(importFill(v, ctx));
                return arr;
            }, new BasicArray<Fill>());
        case VariableType.Gradient:
            return importGradient(_var.value, ctx);
        case VariableType.ImageRef:
            return _var.value;
        case VariableType.Lock:
            return _var.value;
        case VariableType.Shadows:
            return (_var.value as Shadow[]).reduce((arr, v) => {
                arr.push(importShadow(v, ctx));
                return arr;
            }, new BasicArray<Shadow>());
        case VariableType.Status:
            return _var.value;
        case VariableType.Style:
            return importStyle(_var.value, ctx);
        case VariableType.SymbolRef:
            return _var.value;
        case VariableType.TableCell:
            return importTableShape(_var.value, ctx);
        case VariableType.Text:
            return _var.value instanceof Text ? importText(_var.value) : _var.value;
        case VariableType.Visible:
            return _var.value;
        case VariableType.ExportOptions:
            return importExportOptions(_var.value, ctx);
        default:
            throw new Error();
    }
}

export function shape4contextSettings(api: Api, _shape: ShapeView, page: Page) {
    const valuefun = (_var: Variable | undefined) => {
        const contextSettings = _var?.value ?? _shape.contextSettings;
        return contextSettings && importContextSettings(contextSettings) || new ContextSettings(BlendMode.Normal, 1);
    };
    const _var = _ov(VariableType.ContextSettings, OverrideType.ContextSettings, valuefun, _shape, page, api);
    return _var || _shape.data;
}

export function shape4exportOptions(api: Api, _shape: ShapeView, page: Page) {
    const valuefun = (_var: Variable | undefined) => {
        const options = _var?.value ?? _shape.exportOptions;
        return options && importExportOptions(options) || new ExportOptions(new BasicArray(), 0, false, false, false, false);
    };
    const _var = _ov(VariableType.ExportOptions, OverrideType.ExportOptions, valuefun, _shape, page, api);
    return _var || _shape.data;
}

// 变量可能的情况
// 1. 存在于symbolref中，则变量一定是override某个属性或者变量的。此时如果symbolref非virtual，可以直接修改，否则要再override
// 2. 存在于symbol中，则变量一定是用户定义的某个变量。当前环境如在ref中，则需要override，否则可直接修改。
export function modify_variable(document: Document, page: Page, view: ShapeView, _var: Variable, attr: { name?: string, value?: any }, api: Api) {
    const p = varParent(_var);
    if (!p) throw new Error();
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) {
        if (attr.name && _var.name !== attr.name) api.shapeModifyVariableName(page, _var, attr.name);
        if (attr.hasOwnProperty('value')) api.shapeModifyVariable(page, _var, attr.value);
        return;
    }

    let pIdx = varsContainer.findIndex((v) => v.id === p.id); // 不一定找的到
    // if (pIdx < 0) throw new Error(); // 可能的，当前view为symbolref，正在修改组件变量
    const hostIdx = varsContainer.findIndex((v) => v instanceof SymbolRefShape);
    // if (hostIdx < 0) throw new Error();
    if (hostIdx < 0 || pIdx >= 0 && pIdx <= hostIdx) {
        if (attr.name && _var.name !== attr.name) api.shapeModifyVariableName(page, _var, attr.name);
        if (attr.hasOwnProperty('value')) api.shapeModifyVariable(page, _var, attr.value);
        return;
    }

    // fix text
    let value = attr.value;
    if (_var.type === VariableType.Text
        && typeof value === 'string') {
        const origin = _var.value as Text;
        const text = newText2(origin.attr, origin.paras[0]?.attr, origin.paras[0]?.spans[0]);
        text.insertText(value, 0);
        value = text;
    }

    // 到这需要override
    let override_id;
    if (p instanceof SymbolRefShape) { // p不可以修改
        const overrides = p.overrides;
        if (!overrides) throw new Error(); // 废var?
        for (let [k, v] of overrides) {
            if (v === _var.id) {
                override_id = k;
                break;
            }
        }
        if (!override_id) throw new Error();

        const idx = override_id.lastIndexOf('/');
        const _overrideType = idx >= 0 ? override_id.slice(idx + 1) : override_id;
        let ot;
        switch (_overrideType) {
            case OverrideType.Borders:
            case OverrideType.ContextSettings:
            case OverrideType.EndMarkerType:
            case OverrideType.Fills:
            case OverrideType.Image:
            case OverrideType.Lock:
            case OverrideType.Shadows:
            case OverrideType.StartMarkerType:
            case OverrideType.SymbolID:
            case OverrideType.TableCell:
            case OverrideType.Text:
            case OverrideType.Visible:
            case OverrideType.ExportOptions:
                ot = _overrideType as OverrideType;
                break;
            default:
                ot = OverrideType.Variable;
                break;
        }

        const _vars = findOverride(override_id, ot, pIdx >= 0 ? varsContainer.slice(0, pIdx) : varsContainer)
        if (_vars) {
            const p = varParent(_vars[_vars.length - 1]);
            if (!p) throw new Error();
            // 判断是否可以修改，如可以则直接修改。否则走override
            const pIdx = varsContainer.findIndex((v) => v.id === p.id);
            if (pIdx >= 0 && pIdx <= hostIdx) {
                api.shapeModifyVariable(page, _vars[_vars.length - 1], value);
                return;
            }
        }
    } else {
        // SymbolShape
        override_id = _var.id;
        const _vars = findOverride(override_id, OverrideType.Variable, pIdx >= 0 ? varsContainer.slice(0, pIdx) : varsContainer)
        if (_vars) {
            const p = varParent(_vars[_vars.length - 1]);
            if (!p) throw new Error();
            // 判断是否可以修改，如可以则直接修改。否则走override
            const pIdx = varsContainer.findIndex((v) => v.id === p.id);
            if (pIdx >= 0 && pIdx <= hostIdx) {
                api.shapeModifyVariable(page, _vars[_vars.length - 1], value);
                return;
            }
        }
    }
    if (pIdx < 0) { // 可能的，当前view为symbolref，正在修改组件变量
        // 组件中的变量，不在ref中也不在view的子view中
        pIdx = varsContainer.length - 1;
    }
    const host = varsContainer[hostIdx] as SymbolRefShape;
    for (let i = pIdx; i >= 0; --i) {
        const c = varsContainer[i];
        if (c === host) break;
        if (c instanceof SymbolRefShape) override_id = c.id + '/' + override_id;
    }

    const _var2 = _ov_newvar(host, attr.name ?? _var.name, value ?? _clone_value(_var.value, document, page), _var.type, page, api);
    api.shapeAddOverride(page, host, override_id, _var2.id);
}


/**
 * @description override "editor/shape/overrideVariable"
 */
export function override_variable(page: Page, varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, api: Api, view: ShapeView) {
    // view = view ?? this.__shape;
    return _ov(varType, overrideType, valuefun, view, page, api);
}

/**
 * @description 由外引入api的变量修改函数
 */
export function modify_variable_with_api(api: Api, page: Page, shape: ShapeView, varType: VariableType, overrideType: OverrideType, value: any) {
    const _var = _ov(varType, overrideType, () => value, shape, page, api);
    if (_var && _var.value !== value) {
        api.shapeModifyVariable(page, _var, value);
    }
    return !!_var;
}

/**
 * @description override "editor/shape/shape4border"
 */
export function shape4border(api: Api, page: Page, shape: ShapeView) {
    const _var = override_variable(page, VariableType.Borders, OverrideType.Borders, (_var) => {
        const bordors = _var?.value ?? shape.getBorders();
        return new BasicArray(...(bordors as Array<Border>).map((v) => {
            return importBorder(v);
        }
        ))
    }, api, shape)
    return _var || shape.data;
}

/**
 * @description override "editor/shape/shape4fill"
 */
export function shape4fill(api: Api, page: Page, shape: ShapeView) {
    const _var = override_variable(page, VariableType.Fills, OverrideType.Fills, (_var) => {
        const fills = _var?.value ?? shape.getFills();
        return new BasicArray(...(fills as Array<Fill>).map((v) => {
            const ret = importFill(v);
            const imgmgr = v.getImageMgr();
            if (imgmgr) ret.setImageMgr(imgmgr)
            return ret;
        }
        ))
    }, api, shape)
    return _var || shape.data;
}

export function shape4shadow(api: Api, page: Page, shape: ShapeView) {
    const _var = override_variable(page, VariableType.Shadows, OverrideType.Shadows, (_var) => {
        const shadows = _var?.value ?? shape.getShadows();
        return new BasicArray(...(shadows as Array<Shadow>).map((v) => {
            return importShadow(v);
        }
        ))
    }, api, shape)
    return _var || shape.data;
}

export function is_exist_invalid_shape(selected: Shape[]) {
    let result = false;
    for (let i = 0, len = selected.length; i < len; i++) {
        const item = selected[i];
        if ([ShapeType.Contact].includes(item.type)) return true;
        if ((item as GroupShape).childs?.length) result = is_exist_invalid_shape((item as GroupShape).childs);
        if (result) return true;
    }
    return false;
}
export function is_exist_invalid_shape2(selected: Shape[]) {
    let result = false;
    for (let i = 0, len = selected.length; i < len; i++) {
        const item = selected[i];
        if (ShapeType.Symbol === item.type || ShapeType.Contact === item.type) {
            return true;
        }
        if ((item as GroupShape).childs?.length) {
            result = is_exist_invalid_shape2((item as GroupShape).childs);
        }
        if (result) {
            return true;
        }
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



export function cell4edit2(page: Page, view: TableView, _cell: TableCellView, api: Api): Variable | undefined {
    // cell id 要重新生成
    const index = view.indexOfCell(_cell);
    if (!index) throw new Error();
    const {rowIdx, colIdx} = index;
    const cellId = _cell.data.id; //view.rowHeights[rowIdx].id + "," + view.colWidths[colIdx].id;
    const valuefun = (_var: Variable | undefined) => {
        const cell = _var?.value ?? _cell.data;
        if (cell) return importTableCell(cell);
        return new TableCell(new BasicArray(),
            cellId,
            "",
            ShapeType.TableCell,
            new ShapeFrame(0, 0, 0, 0),
            new Style(new BasicArray(), new BasicArray(), new BasicArray()),
            TableCellType.Text,
            newTableCellText(view.data.textAttr));
    };
    const refId = view.data.id + '/' + cellId;
    const _var = override_variable2(page, VariableType.TableCell, OverrideType.TableCell, refId, valuefun, api, view);
    if (_var) return _var;
    api.tableInitCell(page, view.data, rowIdx, colIdx);
    // return _cell.data;
    // return _var;
}

export function cell4edit(page: Page, view: TableView, rowIdx: number, colIdx: number, api: Api): TableCellView {
    const cell = view.getCellAt(rowIdx, colIdx);
    if (!cell) throw new Error("cell init fail?");

    const cellId = view.rowHeights[rowIdx].id + "," + view.colWidths[colIdx].id;
    const valuefun = (_var: Variable | undefined) => {
        const cell = _var?.value ?? view._getCellAt(rowIdx, colIdx);
        if (cell) return importTableCell(cell);
        return new TableCell(new BasicArray(),
            cellId,
            "",
            ShapeType.TableCell,
            new ShapeFrame(0, 0, 0, 0),
            new Style(new BasicArray(), new BasicArray(), new BasicArray()),
            TableCellType.Text,
            newTableCellText(view.data.textAttr));
    };
    const refId = view.data.id + '/' + cellId;
    const _var = override_variable2(page, VariableType.TableCell, OverrideType.TableCell, refId, valuefun, api, view);
    if (_var) {
        cell.setData(_var.value);
        // return _var;
        return cell;
    }


    if (api.tableInitCell(page, view.data, rowIdx, colIdx)) {
        // 更新下data
        const _cell = view._getCellAt2(rowIdx, colIdx);
        if (!_cell) throw new Error();
        cell.setData(_cell);
    }
    return cell;
}