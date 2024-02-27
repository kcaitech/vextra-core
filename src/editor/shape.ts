import {
    GroupShape,
    PathShape,
    PathShape2,
    RectShape,
    Shape,
    ShapeType,
    SymbolShape,
    TextShape,
    Variable,
    VariableType,
    SymbolUnionShape
} from "../data/shape";
import { Border, BorderPosition, BorderStyle, Fill, MarkerType, Shadow } from "../data/style";
import { expand, expandTo, translate, translateTo } from "./frame";
import { BoolOp, ContextSettings, CurvePoint, ExportFormat } from "../data/baseclasses";
import { Artboard } from "../data/artboard";
import { Page } from "../data/page";
import { CoopRepository } from "./coop/cooprepo";
import { CurveMode, OverrideType, ShadowPosition, ExportFileFormat, ExportFormatNameingScheme, BlendMode } from "../data/typesdefine";
import { Api } from "./coop/recordapi";
import { IImportContext, importBorder, importBorderOptions, importColor, importContextSettings, importCurvePoint, importFill, importGradient, importShadow, importStyle, importTableShape, importText } from "../data/baseimport";
import { v4 } from "uuid";
import { ContactShape } from "../data/contact";
import { Document, SymbolRefShape, Text } from "../data/classes";
import { uuid } from "../basic/uuid";
import { BasicArray } from "../data/basic";
import {
    after_remove,
    clear_binds_effect,
    find_layers_by_varid,
    get_symbol_by_layer,
    is_default_state
} from "./utils/other";
// import { _override_variable_for_symbolref, is_part_of_symbol, is_part_of_symbolref, is_symbol_or_union, modify_variable, shape4shadow } from "./utils/symbol";
import { newText2 } from "./creator";
import { _clip, _typing_modify, get_points_for_init, modify_points_xy, update_frame_by_points, update_path_shape_frame } from "./utils/path";
import { Color } from "../data/color";
import { adapt_for_artboard } from "./utils/common";
import { ShapeView, SymbolRefView, SymbolView, adapt2Shape, findOverride, findVar, isAdaptedShape } from "../dataview";
import { is_part_of_symbol, is_part_of_symbolref, is_symbol_or_union } from "./utils/symbol";

function varParent(_var: Variable) {
    let p = _var.parent;
    while (p && !(p instanceof Shape)) p = p.parent;
    return p;
}


// 修改对象属性
// 1. 如果普通对象
// 1.1 varbind, 则到3
// 1.2 正常修改. 
// 2. 如果对象为virtual, 将属性值override到var再修改
// 2.1 创建新var
// 2.2 将属性 override到新var
// 2.3 如果已级override到var，则到3
// 3. 如果为var，判断var是否属于virtual对象:
// 3.1 如果是则override到新var再修改;
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
function _ov_2(type: OverrideType, name: string, value: any, varType: VariableType, view: ShapeView, page: Page, api: Api) {
    // const view = this.__shape;
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) throw new Error();
    const host = varsContainer.find((v) => v instanceof SymbolRefShape);
    if (!host || !(host instanceof SymbolRefShape)) throw new Error();
    const _var2 = _ov_newvar(host, name, value, varType, page, api);
    _ov_2_2(host, type, _var2.id, view, page, api);
    return _var2;
}

/**
 * 将当前shape的overridetype对应的属性，override到varid的变量
 * @param type
 * @param varId
 * @param api
 */
function _ov_2_2(host: SymbolRefShape, type: OverrideType, varId: string, view: ShapeView, page: Page, api: Api) {

    // const view = this.__shape;
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) throw new Error();
    // const host = varsContainer.find((v) => v instanceof SymbolRefShape);
    // if (!host || !(host instanceof SymbolRefShape)) throw new Error();

    let override_id: string = (view.data instanceof SymbolRefShape) ? type : (view.data.id + '/' + type);
    for (let i = varsContainer.length - 1; i >= 0; --i) {
        const c = varsContainer[i];
        if (c === host) break;
        if (c instanceof SymbolRefShape) override_id = c.id + '/' + override_id;
    }

    api.shapeAddOverride(page, host, override_id, type, varId);
}

function _ov_newvar(host: SymbolRefShape | SymbolShape, name: string, value: any, type: VariableType, page: Page, api: Api) {
    const _var2 = new Variable(uuid(), type, name, value);
    api.shapeAddVariable(page, host, _var2); // create var
    return _var2;
}

function _ov_3(_var: Variable, name: string, valuefun: (_var: Variable | undefined) => any, view: ShapeView, page: Page, api: Api) {
    const p = varParent(_var);
    if (!p) throw new Error();
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) throw new Error();
    const pIdx = varsContainer.findIndex((v) => v.id === p.id);
    if (pIdx < 0) throw new Error();
    const hostIdx = varsContainer.findIndex((v) => v instanceof SymbolRefShape);
    if (hostIdx < 0) throw new Error();
    if (pIdx <= hostIdx) return _var; // 可直接修改

    const value = valuefun(_var);
    const host = varsContainer[hostIdx] as SymbolRefShape;
    return _ov_3_1(_var, name, value, host, view, page, api);
}

function _ov_3_1(_var: Variable, name: string, value: any, host: SymbolRefShape, view: ShapeView, page: Page, api: Api) { // 3.1
    // override text
    if (_var.type === VariableType.Text
        && typeof value === 'string') {
        const origin = _var.value as Text;
        const text = newText2(origin.attr, origin.paras[0]?.attr, origin.paras[0]?.spans[0]);
        text.insertText(value, 0);
        value = text;
    }
    // const view = this.__shape;
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) throw new Error();
    // const host = varsContainer.find((v) => v instanceof SymbolRefShape);
    // if (!host || !(host instanceof SymbolRefShape)) throw new Error();
    const _var2 = _ov_newvar(host, name, value, _var.type, page, api);
    _ov_3_1_2(_var, _var2.id, host, view, page, api); // override
    return _var2;
}

function _ov_3_1_2(fromVar: Variable, toVarId: string, host: SymbolRefShape | SymbolShape, view: ShapeView, page: Page, api: Api) {
    let p = varParent(fromVar);
    if (!p) throw new Error();
    // if (!p.isVirtualShape) throw new Error(); // 不一定,可能是symbolshape??然后也不在view结构里？

    // const view = this.__shape;
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) throw new Error();

    if (isAdaptedShape(p)) throw new Error(); // 不用adapted的
    const pIdx = varsContainer.findIndex((v) => v.id === p!.id);// 不对？虚拟对象的id？
    if (pIdx < 0) throw new Error();

    let override_id = fromVar.id;
    for (let i = pIdx; i >= 0; --i) {
        const c = varsContainer[i];
        if (c === host) break;
        if (c instanceof SymbolRefShape) override_id = c.id + '/' + override_id;
    }

    api.shapeAddOverride(page, host, override_id, OverrideType.Variable, toVarId);
}

function _ov(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, view: ShapeView, page: Page, api: Api) {
    const varsContainer = _varsContainer(view);
    if (!varsContainer || varsContainer.length === 0) return;

    if (view.varbinds && view.varbinds.has(overrideType)) { // 走var
        const _vars: Variable[] = [];
        findVar(view.varbinds.get(overrideType)!, _vars, varsContainer);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === varType) {
            return _ov_3(_var, _var.name, valuefun, view, page, api);
        }
    }

    if (!view.isVirtualShape && !(view.data instanceof SymbolRefShape)) return;

    const refId = view.data instanceof SymbolRefShape ? "" : view.data.id;
    const _vars = findOverride(refId, overrideType, varsContainer);
    if (_vars) {
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === varType) {
            return _ov_3(_var, _var.name, valuefun, view, page, api);
        }
    }

    return _ov_2(overrideType, "", valuefun(undefined), varType, view, page, api);
}

function _clone_value(_var: Variable, document: Document, page: Page) {
    if (_var.value === undefined) return undefined;

    const ctx: IImportContext = new class implements IImportContext { document: Document = document; curPage: string = page.id };

    switch (_var.type) {
        case VariableType.BorderOptions:
            return importBorderOptions(_var.value);
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
        case VariableType.Table:
            return importTableShape(_var.value, ctx);
        case VariableType.Text:
            return _var.value instanceof Text ? importText(_var.value) : _var.value;
        case VariableType.Visible:
            return _var.value;
        default:
            throw new Error();
    }
}

export function shape4contextSettings(api: Api, _shape: ShapeView, page: Page) {
    const valuefun = (_var: Variable | undefined) => {
        const clone: ContextSettings | undefined = _shape instanceof SymbolRefView ? _shape.symData?.style.contextSettings : _shape.style.contextSettings;
        const contextSettings = _var?.value ?? clone;
        return contextSettings && importContextSettings(contextSettings) || new ContextSettings(BlendMode.Normal, 1);
    };
    const _var = _ov(VariableType.ContextSettings, OverrideType.ContextSettings, valuefun, _shape, page, api);
    return _var || _shape.data;
}

export class ShapeEditor {
    protected __shape: ShapeView;
    protected __repo: CoopRepository;
    protected __page: Page;
    protected __document: Document

    constructor(shape: ShapeView, page: Page, repo: CoopRepository, document: Document) {
        this.__shape = shape;
        this.__repo = repo;
        this.__page = page;
        this.__document = document;
    }

    get shape(): Shape {
        return adapt2Shape(this.__shape);
    }

    private _repoWrap(name: string, func: (api: Api) => void) {
        const api = this.__repo.start(name);
        try {
            func(api);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    /**
     * 检查当前shape的overrideType对应的属性值是否由变量起作用，如果是则判断var是否可以修改，如可以则「返回」var，否则先override再「返回」新的var
     * 适合text这种，value的修改非原子操作的情况 已提出到 "editor/utils/symbol"
     *
     * @param varType
     * @param overrideType
     * @param valuefun
     * @param api
     * @param shape
     * @returns
     */
    protected overrideVariable(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, api: Api, view?: ShapeView) {
        view = view ?? this.__shape;
        return _ov(varType, overrideType, valuefun, view, this.__page, api);
    }

    /**
     * 修改_var的值为value，如果_var不可以修改，则override _var到value
     * @param _var
     * @param value
     * @param api
     */
    private modifyVariable2(_var: Variable, value: any, api: Api) {
        // modify_variable(this.__page, this.shape, _var, value, api);
        const _var1 = _ov_3(_var, _var.name, () => value, this.__shape, this.__page, api);
        if (_var1 === _var) {
            api.shapeModifyVariable(this.__page, _var, value);
        }
    }

    /**
     * @description 修改_var的名称为name，如果_var不可以修改，则override _var到name
     */
    modifyVariableName(_var: Variable, name: string) {
        try {
            const api = this.__repo.start("modifyVariableName");
            const _var1 = _ov_3(_var, name,
                () => _clone_value(_var, this.__document, this.__page), this.__shape, this.__page, api);
            if (_var1 === _var) {
                api.shapeModifyVariableName(this.__page, _var, name);
            }
            this.__repo.commit();
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
        }
    }

    /**
     * @description 修改实例身上某一个变量的值
     * @param _var
     * @param value
     */
    modifySymbolRefVariable(_var: Variable, value: any) {
        const api = this.__repo.start("modifySymbolRefVariable");
        try {
            this.modifyVariable2(_var, value, api);
            this.__repo.commit();
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
        }
    }

    /**
     * @description 重置实例属性
     */
    resetSymbolRefVariable() {
        let shape = this.shape as SymbolRefShape;

        let p: Shape | undefined = shape;
        while (p) {
            if (p instanceof SymbolRefShape) {
                shape = p;
            }
            p = p.parent;
        }

        const variables = (shape as SymbolRefShape).variables;
        const overrides = (shape as SymbolRefShape).overrides;
        const symData = (shape as SymbolRefShape).symData;
        // const symParent = symData?.parent;
        // const root_data = (symParent instanceof SymbolUnionShape ? symParent : symData);

        const root_data = symData;

        if (variables.size === 0 || !overrides || !root_data) {
            console.log('!variables || !overrides || !root_data');
            return false;
        }
        const root_variables = root_data?.variables;
        try {
            const api = this.__repo.start('resetSymbolRefVariable');
            if (!root_variables) {
                overrides && overrides.forEach((v, k) => {
                    const variable = variables.get(v);
                    if (!variable) return;
                    api.shapeRemoveVirbindsEx(this.__page, shape as SymbolRefShape, k, variable.id, variable.type);
                })
                variables.forEach((_, k) => {
                    api.shapeRemoveVariable(this.__page, shape as SymbolRefShape, k);
                });
            } else {
                variables.forEach((v, k) => {
                    if (v.type === VariableType.Status) return;
                    api.shapeRemoveVariable(this.__page, shape as SymbolRefShape, k);
                });
                root_variables.forEach((v, k) => {
                    if (v.type === VariableType.Status || !overrides?.has(k)) return;
                    api.shapeRemoveVirbindsEx(this.__page, shape as SymbolRefShape, k, v.id, v.type);
                })
            }
            this.__repo.commit();
            return true;
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
            return false;
        }
    }

    /**
     * @description 给组件创建一个图层显示变量
     */
    makeVisibleVar(symbolView: SymbolView, name: string, dlt_value: boolean, shapes: Shape[]) {
        let symbol = adapt2Shape(symbolView) as SymbolShape;
        if (!is_symbol_or_union(symbol)) {
            throw new Error('wrong role!');
        }
        const api = this.__repo.start("makeVisibleVar");
        try {
            const _var = new Variable(v4(), VariableType.Visible, name, dlt_value);
            api.shapeAddVariable(this.__page, symbol, _var);
            for (let i = 0, len = shapes.length; i < len; i++) {
                const item = shapes[i];
                api.shapeBindVar(this.__page, item, OverrideType.Visible, _var.id);
            }
            this.__repo.commit();
            return symbol;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
    }

    /**
     * @description 给组件创建一个实例切换变量
     */
    makeSymbolRefVar(symbolView: SymbolView, name: string, shapes: SymbolRefShape[]) {
        let symbol = adapt2Shape(symbolView) as SymbolShape;
        if (!shapes.length) throw new Error('invalid data');
        if (!is_symbol_or_union(symbol)) {
            throw new Error('wrong role!');
        }
        const api = this.__repo.start("makeSymbolRefVar");
        try {
            const _var = new Variable(v4(), VariableType.SymbolRef, name, shapes[0].refId);
            api.shapeAddVariable(this.__page, symbol, _var);
            for (let i = 0, len = shapes.length; i < len; i++) {
                api.shapeBindVar(this.__page, shapes[i], OverrideType.SymbolID, _var.id);
            }
            this.__repo.commit();
            return symbol;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
    }

    /**
     * @description 给组件创建一个文本变量
     */
    makeTextVar(symbolView: SymbolView, name: string, dlt: string, shapes: (Shape & { text?: Text })[]) {
        let symbol = adapt2Shape(symbolView) as SymbolShape;
        if (!is_symbol_or_union(symbol)) {
            throw new Error('wrong role!');
        }
        const api = this.__repo.start("makeTextVar");
        try {
            const first = shapes[0]?.text instanceof Text ? shapes[0]?.text : undefined;
            const text = newText2(first?.attr, first?.paras[0]?.attr, first?.paras[0]?.spans[0]);
            text.insertText(dlt, 0);
            const _var = new Variable(v4(), VariableType.Text, name, text);
            api.shapeAddVariable(this.__page, symbol, _var);
            for (let i = 0, len = shapes.length; i < len; i++) {
                const item = shapes[i];
                api.shapeBindVar(this.__page, item, OverrideType.Text, _var.id);
            }
            this.__repo.commit();
            return symbol;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
    }

    /**
     * @description 修改图层显示、文本内容、实例切换变量
     */
    modifyVar(symbol: SymbolShape, variable: Variable, new_name: string, new_dlt_value: any, new_layers: Shape[], old_layers: Shape[]) {
        const type: any = {};
        type[VariableType.Text] = OverrideType.Text;
        type[VariableType.Visible] = OverrideType.Visible;
        type[VariableType.SymbolRef] = OverrideType.SymbolID;
        if (!is_symbol_or_union(symbol)) {
            throw new Error('wrong role!');
        }
        const api = this.__repo.start("modifyVar");
        try {
            for (let i = 0, len = new_layers.length; i < len; i++) {
                const item = new_layers[i];
                api.shapeBindVar(this.__page, item, type[variable.type], variable.id);
            }
            for (let i = 0, len = old_layers.length; i < len; i++) {
                const item = old_layers[i];
                api.shapeUnbinVar(this.__page, item, type[variable.type]);
            }

            if (new_name !== variable.name) {
                const _var1 = _ov_3(variable, new_name,
                    () => _clone_value(variable, this.__document, this.__page),
                    this.__shape, this.__page, api);
                if (_var1 === variable) {
                    api.shapeModifyVariableName(this.__page, variable, new_name);
                }
            }

            if (new_dlt_value !== variable.value) {
                const _var1 = _ov_3(variable, variable.name, () => new_dlt_value, this.__shape, this.__page, api);
                if (_var1 === variable) {
                    api.shapeModifyVariable(this.__page, variable, new_dlt_value);
                }
            }

            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
            return false;
        }
    }

    /**
     * 检查当前shape的overrideType对应的属性值是否由变量起作用，如果是则判断var是否可以修改，如可以则「修改」var，否则先override再「修改」新的var zrx?是否用于修改组件身上的变量
     * @param varType
     * @param overrideType
     * @param valuefun
     * @returns
     */
    modifyVariable(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any): boolean {
        // const _var = this.overrideVariable(slot, varType, ov)
        const shape = this.shape;
        // symbol shape
        if (!shape.isVirtualShape && shape.varbinds && shape.varbinds.has(overrideType)) {
            const _vars: Variable[] = [];
            shape.findVar(shape.varbinds.get(overrideType)!, _vars);

            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                this._repoWrap('modifyVariable', (api) => {
                    this.modifyVariable2(_var, valuefun(_var), api);
                });
                return true;
            }
        }
        if (!shape.isVirtualShape) return false;

        // 先override还是varbinds？？应该是override?

        // 先查varbinds
        // if (shape.varbinds && shape.varbinds.has(overrideType)) {
        if (shape.varbinds?.get(overrideType)) {
            const _vars: Variable[] = [];
            const vars_path: Shape[] = [];
            shape.findVar(shape.varbinds.get(overrideType)!, _vars);
            // if (_vars.length !== vars_path.length) {
            //     console.log('wrong data: _vars.length !== vars_path.length');
            //     return false;
            // }
            if (!_vars.length) {
                console.log('wrong data: _vars.length !== vars_path.length');
                return false;
            }
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                this._repoWrap('modifyVariable', (api) => {
                    this.modifyVariable2(_var, valuefun(_var), api)
                });
                return true;
            }
        }

        // override
        let override_id = shape.id;
        override_id = override_id.substring(override_id.indexOf('/') + 1); // 需要截掉第一个
        if (override_id.length === 0) throw new Error();

        // x 找不到已有的
        const _vars = shape.findOverride(override_id.substring(override_id.lastIndexOf('/') + 1), overrideType);
        if (_vars) {
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                this._repoWrap('modifyVariable', (api) => {
                    this.modifyVariable2(_var, valuefun(_var), api)
                });
                return true;
            }
        }
        //
        // symRef.addOverrid(override_id, OverrideType.SymbolID, refId);

        // get first not virtual
        let symRef = shape.parent;
        while (symRef && symRef.isVirtualShape) symRef = symRef.parent;
        if (!symRef || !(symRef instanceof SymbolRefShape)) throw new Error();

        // add override
        //

        // todo api
        // add override add variable
        const _symRef = symRef;
        const api = this._repoWrap('addOverrid', (api) => {
            const _var2 = new Variable(uuid(), varType, "", valuefun(undefined));
            // _var2.value = valuefun(undefined);
            api.shapeAddVariable(this.__page, _symRef, _var2);
            api.shapeAddOverride(this.__page, _symRef, override_id, overrideType, _var2.id);
        });

        // symRef.addOverrid(override_id, overrideType, value);

        return true;
    }

    public setName(name: string) {
        const api = this.__repo.start('setName');
        api.shapeModifyName(this.__page, this.shape, name)
        api.shapeModifyNameFixed(this.__page, this.shape, true);
        this.__repo.commit();
    }

    public toggleVisible() {
        // 实例图层
        if (this.modifyVariable(VariableType.Visible, OverrideType.Visible, (_var) => {
            return _var ? !_var.value : !this.shape.isVisible;
        })) {
            return;
        }
        this._repoWrap('toggleVisible', (api) => {
            api.shapeModifyVisible(this.__page, this.shape, !this.shape.isVisible);
            // after_toggle_shapes_visible(api, this.__page, [this.shape]);
        })
    }

    public toggleLock() {
        if (this.modifyVariable(VariableType.Lock, OverrideType.Lock, (_var) => {
            return _var ? !_var.value : !this.shape.isLocked;
        })) {
            return;
        }
        this._repoWrap('toggleLock', (api) => {
            api.shapeModifyLock(this.__page, this.shape, !this.shape.isLocked);
        });
    }

    public translate(dx: number, dy: number, round: boolean = true) {
        this._repoWrap("translate", (api) => {
            translate(api, this.__page, this.shape, dx, dy, round);
        });
    }

    public translateTo(x: number, y: number) {
        this._repoWrap("translateTo", (api) => {
            translateTo(api, this.__page, this.shape, x, y);
        });
    }

    public expand(dw: number, dh: number) {
        this._repoWrap("expand", (api) => {
            expand(api, this.__page, this.shape, dw, dh);
        });
    }

    public expandTo(w: number, h: number) {
        this._repoWrap("expandTo", (api) => {
            expandTo(api, this.__page, this.shape, w, h);
        });
    }

    public setConstrainerProportions(val: boolean) {
        this._repoWrap("setConstrainerProportions", (api) => {
            api.shapeModifyConstrainerProportions(this.__page, this.shape, val)
        });
    }

    // flip
    public flipH() {
        this._repoWrap("flipHorizontal", (api) => {
            api.shapeModifyHFlip(this.__page, this.shape, !this.shape.isFlippedHorizontal)
        });
    }

    public flipV() {
        this._repoWrap("flipVertical", (api) => {
            api.shapeModifyVFlip(this.__page, this.shape, !this.shape.isFlippedVertical)
        });
    }

    public contextSettingOpacity(value: number) {
        const api = this.__repo.start("contextSettingOpacity");
        try {
            const shape = shape4contextSettings(api, this.__shape, this.__page);
            api.shapeModifyContextSettingsOpacity(this.__page, shape, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    // resizingConstraint
    public setResizingConstraint(value: number) {
        this._repoWrap("setResizingConstraint", (api) => {
            api.shapeModifyResizingConstraint(this.__page, this.shape, value);
        });
    }

    // rotation
    public rotate(deg: number) {
        this._repoWrap("rotate", (api) => {
            deg = deg % 360;
            api.shapeModifyRotate(this.__page, this.shape, deg)
        });
    }
    /**
     * @description 路径裁剪
     */
    public clipPathShape(index: number, slice_name: string): { code: number, ex: Shape | undefined } {
        const data: { code: number, ex: Shape | undefined } = { code: 0, ex: undefined };
        if (!(this.shape instanceof PathShape)) {
            console.log('!(this.shape instanceof PathShape)');
            data.code = -1;
            return data;
        }
        try {
            const api = this.__repo.start("sortPathShapePoints");
            const code = _clip(this.__document, this.__page, api, this.shape as PathShape, index, slice_name);
            this.__repo.commit();
            return code;
        } catch (error) {
            console.log('sortPathShapePoints:', error);
            this.__repo.rollback();
            data.code = -1;
            return data;
        }
    }

    // radius
    public setRectRadius(lt: number, rt: number, rb: number, lb: number) {
        const shape = this.shape;
        if (!(shape instanceof RectShape)) return;
        this._repoWrap("setRectRadius", (api) => {
            api.shapeModifyRadius(this.__page, shape, lt, rt, rb, lb);
        });
    }

    public setFixedRadius(fixedRadius: number) {
        if (this.shape instanceof GroupShape) {
            if (!this.shape.isBoolOpShape) return;
        } else if (!(this.shape instanceof PathShape || this.shape instanceof PathShape2 || this.shape instanceof TextShape)) {
            return;
        }
        this._repoWrap("setFixedRadius", (api) => {
            api.shapeModifyFixedRadius(this.__page, this.shape as GroupShape, fixedRadius || undefined);
        });
    }

    public setBoolOp(op: BoolOp, name?: string) {
        if (!(this.shape instanceof GroupShape)) return;
        this._repoWrap("setBoolOp", (api) => {
            const shape = this.shape as GroupShape;
            if (name) api.shapeModifyName(this.__page, this.shape, name);
            shape.childs.forEach((child) => {
                api.shapeModifyBoolOp(this.__page, child, op);
            })
            api.shapeModifyBoolOpShape(this.__page, shape, op !== BoolOp.None);
        });
    }

    public setIsBoolOpShape(isOpShape: boolean) {
        if (!(this.shape instanceof GroupShape)) return;
        this._repoWrap("setIsBoolOpShape", (api) => {
            api.shapeModifyBoolOpShape(this.__page, this.shape as GroupShape, isOpShape);
        });
    }

    /**
     * @description 已提出到 "editor/utils/symbol"
     */
    private shape4fill(api: Api, shape?: ShapeView) {
        const _shape = shape ?? this.__shape;
        const _var = this.overrideVariable(VariableType.Fills, OverrideType.Fills, (_var) => {
            const clone = _shape instanceof SymbolRefView ? _shape.symData?.style.fills : _shape.style.fills;
            const fills = _var?.value ?? clone;
            return new BasicArray(...(fills as Array<Fill>).map((v) => {
                const ret = importFill(v);
                const imgmgr = v.getImageMgr();
                if (imgmgr) ret.setImageMgr(imgmgr)
                return ret;
            }
            ))
        }, api, _shape)
        return _var || _shape.data;
    }

    // fill
    public addFill(fill: Fill) {
        this._repoWrap("addFill", (api) => {
            const shape = this.shape4fill(api);
            const l = shape instanceof Shape ? shape.style.fills.length : shape.value.length;
            api.addFillAt(this.__page, shape, fill, l);
        });
    }

    public setFillColor(idx: number, color: Color) {
        this._repoWrap("setFillColor", (api) => {
            const shape = this.shape4fill(api);
            api.setFillColor(this.__page, shape, idx, color)
        });
    }

    public setFillEnable(idx: number, value: boolean) {
        this._repoWrap("setFillEnable", (api) => {
            const shape = this.shape4fill(api);
            api.setFillEnable(this.__page, shape, idx, value);
        });
    }

    public deleteFill(idx: number) {
        this._repoWrap("deleteFill", (api) => {
            const shape = this.shape4fill(api);
            api.deleteFillAt(this.__page, shape, idx);
        });
    }

    /**
     * @description 已提出到 "editor/utils/symbol"
     */
    private shape4border(api: Api, shape?: ShapeView) {
        const _shape = shape ?? this.__shape;
        const _var = this.overrideVariable(VariableType.Borders, OverrideType.Borders, (_var) => {
            const clone = _shape instanceof SymbolRefView ? _shape.symData?.style.borders : _shape.style.borders;
            const borders = _var?.value ?? clone;
            return new BasicArray(...(borders as Array<Border>).map((v) => {
                const ret = importBorder(v);
                return ret;
            }
            ))
        }, api, _shape)
        return _var || _shape.data;
    }

    // border
    public setBorderEnable(idx: number, isEnabled: boolean) {
        this._repoWrap("setBorderEnable", (api) => {
            const shape = this.shape4border(api);
            api.setBorderEnable(this.__page, shape, idx, isEnabled);
        });
    }

    public setBorderColor(idx: number, color: Color) {
        this._repoWrap("setBorderColor", (api) => {
            const shape = this.shape4border(api);
            api.setBorderColor(this.__page, shape, idx, color);
        });
    }

    public setBorderThickness(idx: number, thickness: number) {
        this._repoWrap("setBorderThickness", (api) => {
            const shape = this.shape4border(api);
            api.setBorderThickness(this.__page, shape, idx, thickness);
        });
    }

    public setBorderPosition(idx: number, position: BorderPosition) {
        this._repoWrap("setBorderPosition", (api) => {
            const shape = this.shape4border(api);
            api.setBorderPosition(this.__page, shape, idx, position);
        });
    }

    public setBorderStyle(idx: number, borderStyle: BorderStyle) {
        this._repoWrap("setBorderStyle", (api) => {
            const shape = this.shape4border(api);
            api.setBorderStyle(this.__page, shape, idx, borderStyle);
        });
    }

    public setMarkerType(mt: MarkerType, isEnd: boolean) {
        this._repoWrap("setMarkerType", (api) => {
            if (isEnd) {
                api.shapeModifyEndMarkerType(this.__page, this.shape, mt);
            } else {
                api.shapeModifyStartMarkerType(this.__page, this.shape, mt);
            }
        });
    }

    public exchangeMarkerType() {
        const { endMarkerType, startMarkerType } = this.shape.style;
        if (endMarkerType !== startMarkerType) {
            this._repoWrap("exchangeMarkerType", (api) => {
                api.shapeModifyEndMarkerType(this.__page, this.shape, startMarkerType || MarkerType.Line);
                api.shapeModifyStartMarkerType(this.__page, this.shape, endMarkerType || MarkerType.Line);
            });
        }
    }

    public deleteBorder(idx: number) {

        this._repoWrap("deleteBorder", (api) => {
            const shape = this.shape4border(api);
            api.deleteBorderAt(this.__page, shape, idx)
        });

    }

    public addBorder(border: Border) {
        this._repoWrap("addBorder", (api) => {
            const shape = this.shape4border(api);
            const l = shape instanceof Shape ? shape.style.borders.length : shape.value.length;
            api.addBorderAt(this.__page, shape, border, l);
        });
    }

    // points
    public setPathClosedStatus(val: boolean) {
        this._repoWrap("setPathClosedStatus", (api) => {
            api.setCloseStatus(this.__page, this.shape as PathShape, val);
        });
    }

    public addPointAt(point: CurvePoint, idx: number) {
        this._repoWrap("addPointAt", (api) => {
            api.addPointAt(this.__page, this.shape as PathShape, idx, point);
        });
    }

    /**
     * @description 删除编辑点，从后面往前面删
     * @param indexes 需要转化成有序索引
     */
    public removePoints(indexes: number[]) {
        let result = -1;
        if (!(this.shape instanceof PathShape)) {
            console.log('!(this.shape instanceof PathShape)');
            return result;
        }

        // 排序 
        indexes = indexes.sort((a, b) => {
            if (a > b) {
                return 1;
            } else {
                return -1;
            }
        });

        if (!indexes.length) {
            console.log('!indexes.length');
            return result;
        }

        try {
            const api = this.__repo.start("deleteShape");

            for (let i = indexes.length - 1; i > -1; i--) {
                api.deletePoint(this.__page, this.shape as PathShape, indexes[i]);
            }

            const p = this.shape.parent as GroupShape;

            result = 1;

            if (this.shape.points.length === 2) {
                api.setCloseStatus(this.__page, this.shape, false);
            }

            if (this.shape.points.length < 2 && p) {
                const index = p.indexOfChild(this.shape);
                api.shapeDelete(this.__document, this.__page, p, index)
                result = 0;
            } else {
                update_path_shape_frame(api, this.__page, [this.shape as PathShape]);
            }

            this.__repo.commit();
            return result;
        } catch (e) {
            console.log("removePoints:", e);
            this.__repo.rollback();
            return 0;
        }
    }

    public modifyPointsCurveMode(indexes: number[], curve_mode: CurveMode) {
        if (!indexes.length) {
            console.log('!indexes.length');
            return false;
        }
        try {
            const api = this.__repo.start("modifyPointsCurveMode");
            for (let i = indexes.length - 1; i > -1; i--) {
                const index = indexes[i];
                _typing_modify(this.shape as PathShape, this.__page, api, index, curve_mode);
                api.modifyPointCurveMode(this.__page, this.shape as PathShape, index, curve_mode);
            }
            update_path_shape_frame(api, this.__page, [this.shape as PathShape]);
            this.__repo.commit();
            return true;
        } catch (e) {
            console.log("modifyPointsCurveMode:", e);
            this.__repo.rollback();
            return false;
        }
    }
    public modifyPointsCornerRadius(indexes: number[], cornerRadius: number) {
        if (!indexes.length) {
            console.log('!indexes.length');
            return false;
        }
        try {
            const api = this.__repo.start("modifyPointsCornerRadius");
            for (let i = indexes.length - 1; i > -1; i--) {
                api.modifyPointCornerRadius(this.__page, this.shape as PathShape, indexes[i], cornerRadius);
            }
            this.__repo.commit();
            return true;
        } catch (e) {
            console.log("modifyPointsCornerRadius:", e);
            this.__repo.rollback();
            return false;
        }
    }

    public modifyPointsXY(actions: { x: number, y: number, index: number }[]) {
        try {
            if (!(this.shape instanceof PathShape)) return;
            const api = this.__repo.start("deleteShape");
            modify_points_xy(api, this.__page, this.shape, actions);
            this.__repo.commit();
            return true;
        } catch (e) {
            console.log('modifyPointsXY:', e);
            this.__repo.rollback();
            return false;
        }
    }

    private shape4shadow(api: Api, shape?: ShapeView) {
        const _shape = shape ?? this.__shape;
        const _var = this.overrideVariable(VariableType.Shadows, OverrideType.Shadows, (_var) => {
            const clone = _shape instanceof SymbolRefView ? _shape.symData?.style.shadows : _shape.style.shadows;
            const shadows = _var?.value ?? clone;
            return new BasicArray(...(shadows as Array<Shadow>).map((v) => {
                const ret = importShadow(v);
                return ret;
            }
            ))
        }, api, _shape)
        return _var || _shape.data;
    }

    // shadow
    public addShadow(shadow: Shadow) {
        const api = this.__repo.start("addShadow");
        try {
            const shape = this.shape4shadow(api);
            const l = shape instanceof Shape ? shape.style.shadows.length : shape.value.length;
            api.addShadow(this.__page, shape, shadow, l);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    public deleteShadow(idx: number) {
        const api = this.__repo.start("deleteShadow");
        try {
            const shape = this.shape4shadow(api);
            api.deleteShadowAt(this.__page, shape, idx)
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    public setShadowPosition(idx: number, position: ShadowPosition) {
        const api = this.__repo.start("setShadowPosition");
        try {
            const shape = this.shape4shadow(api);
            api.setShadowPosition(this.__page, shape, idx, position);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    public setShadowEnable(idx: number, isEnabled: boolean) {
        const api = this.__repo.start("setShadowEnable");
        try {
            const shape = this.shape4shadow(api);
            api.setShadowEnable(this.__page, shape, idx, isEnabled);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    public setShadowColor(idx: number, color: Color) {
        const api = this.__repo.start("setShadowColor");
        try {
            const shape = this.shape4shadow(api);
            api.setShadowColor(this.__page, shape, idx, color);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    public setShadowOffsetX(idx: number, offserX: number) {
        const api = this.__repo.start("setShadowOffsetX");
        try {
            const shape = this.shape4shadow(api);
            api.setShadowOffsetX(this.__page, shape, idx, offserX);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    public setShadowOffsetY(idx: number, offsetY: number) {
        const api = this.__repo.start("setShadowOffsetY");
        try {
            const shape = this.shape4shadow(api);
            api.setShadowOffsetY(this.__page, shape, idx, offsetY);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    public setShadowBlur(idx: number, blur: number) {
        const api = this.__repo.start("setShadowBlur");
        try {
            const shape = this.shape4shadow(api);
            api.setShadowBlur(this.__page, shape, idx, blur);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    public setShadowSpread(idx: number, spread: number) {
        const api = this.__repo.start("setShadowSpread");
        try {
            const shape = this.shape4shadow(api);
            api.setShadowSpread(this.__page, this.shape, idx, spread);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }
    // export ops
    public addExportFormat(formats: ExportFormat[]) {
        const api = this.__repo.start("addExportFormat");
        try {
            for (let i = 0; i < formats.length; i++) {
                const format = formats[i];
                const length = this.shape.exportOptions ? this.shape.exportOptions.exportFormats.length : 0;
                api.addExportFormat(this.__page, this.shape, format, length);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }
    public deleteExportFormat(idx: number) {
        const format = this.shape.exportOptions?.exportFormats[idx];
        if (format) {
            const api = this.__repo.start("deleteExportFormat");
            try {
                api.deleteExportFormatAt(this.__page, this.shape, idx)
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }
        }
    }
    public setExportFormatScale(idx: number, scale: number) {
        const format = this.shape.exportOptions?.exportFormats[idx];
        if (format) {
            const api = this.__repo.start("setExportFormatScale");
            try {
                api.setExportFormatScale(this.__page, this.shape, idx, scale);
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }
        }
    }
    public setExportFormatName(idx: number, name: string) {
        const format = this.shape.exportOptions?.exportFormats[idx];
        if (format) {
            const api = this.__repo.start("setExportFormatName");
            try {
                api.setExportFormatName(this.__page, this.shape, idx, name);
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }
        }
    }
    public setExportFormatFileFormat(idx: number, fileFormat: ExportFileFormat) {
        const format = this.shape.exportOptions?.exportFormats[idx];
        if (format) {
            const api = this.__repo.start("setExportFormatFileFormat");
            try {
                api.setExportFormatFileFormat(this.__page, this.shape, idx, fileFormat);
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }
        }
    }
    public setExportFormatPerfix(idx: number, perfix: ExportFormatNameingScheme) {
        const format = this.shape.exportOptions?.exportFormats[idx];
        if (format) {
            const api = this.__repo.start("setExportFormatPerfix");
            try {
                api.setExportFormatPerfix(this.__page, this.shape, idx, perfix);
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }
        }
    }
    public setExportTrimTransparent(trim: boolean) {
        const api = this.__repo.start("setExportTrimTransparent");
        try {
            api.setExportTrimTransparent(this.__page, this.shape, trim);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }
    public setExportCanvasBackground(background: boolean) {
        const api = this.__repo.start("setExportTrimTransparent");
        try {
            api.setExportCanvasBackground(this.__page, this.shape, background);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }
    public setExportPreviewUnfold(unfold: boolean) {
        const api = this.__repo.start("setExportTrimTransparent");
        try {
            api.setExportPreviewUnfold(this.__page, this.shape, unfold);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // 容器自适应大小
    public adapt() {
        if (!(this.shape instanceof Artboard)) {
            console.log('adapt: !(this.shape instanceof Artboard)');
            return;
        }

        try {
            const api = this.__repo.start("adapt");
            adapt_for_artboard(api, this.__page, this.shape);
            this.__repo.commit();
        } catch (error) {
            console.log('adapt', error);
            this.__repo.rollback();
        }
    }

    // 删除图层
    public delete() {
        if (is_part_of_symbolref(this.shape)) {
            this.toggleVisible();
            return;
        }
        const parent = this.shape.parent as GroupShape;
        if (parent) {
            const childs = parent.type === ShapeType.SymbolRef ? ((parent as GroupShape).naviChilds || []) : (parent as GroupShape).childs;
            const index = childs.findIndex(s => s.id === this.shape.id);
            if (index >= 0) {
                try {
                    const api = this.__repo.start("deleteShape");
                    if (this.shape.type === ShapeType.Contact) { // 将执行删除连接线，需要清除连接线对起始两边的影响
                        this.removeContactSides(api, this.__page, this.shape as unknown as ContactShape);
                    } else {
                        this.removeContact(api, this.__page, this.shape);
                    }
                    const symbol = get_symbol_by_layer(this.shape);
                    if (symbol) { // 将执行删除组件内部图层，需要清除内部图层对组件的影响
                        clear_binds_effect(this.__page, this.shape, symbol, api);
                    }
                    api.shapeDelete(this.__document, this.__page, parent, index);
                    // 当所删除元素为某一个编组的最后一个子元素时，需要把这个编组也删掉
                    if (after_remove(parent)) {
                        const _p = parent.parent;
                        const _idx = (_p as GroupShape).childs.findIndex(c => c.id === parent.id);
                        api.shapeDelete(this.__document, this.__page, (_p as GroupShape), _idx);
                    }
                    if (this.shape.type === ShapeType.Symbol) {
                        this.__document.__correspondent.notify('update-symbol-list');
                    }
                    this.__repo.commit();
                } catch (error) {
                    this.__repo.rollback();
                    console.log(error);
                }
            }
        }
    }

    private removeContactSides(api: Api, page: Page, shape: ContactShape) {
        if (shape.from) {
            const fromShape = page.getShape(shape.from.shapeId);
            const contacts = fromShape?.style.contacts;
            if (fromShape && contacts) {
                let idx: number = -1;
                for (let i = 0, len = contacts.length; i < len; i++) {
                    const c = contacts[i];
                    if (c.shapeId === shape.id) {
                        idx = i;
                        break;
                    }
                }
                if (idx > -1) {
                    api.removeContactRoleAt(page, fromShape, idx);
                }
            }
        }
        if (shape.to) {
            const toShape = page.getShape(shape.to.shapeId);
            const contacts = toShape?.style.contacts;
            if (toShape && contacts) {
                let idx: number = -1;
                for (let i = 0, len = contacts.length; i < len; i++) {
                    const c = contacts[i];
                    if (c.shapeId === shape.id) {
                        idx = i;
                        break;
                    }
                }
                if (idx > -1) {
                    api.removeContactRoleAt(page, toShape, idx);
                }
            }
        }
    }

    private removeContact(api: Api, page: Page, shape: Shape) {
        const contacts = shape.style.contacts;
        if (contacts && contacts.length) {
            for (let i = 0, len = contacts.length; i < len; i++) {
                const shape = page.getShape(contacts[i].shapeId);
                if (!shape) continue;
                const p = shape.parent as GroupShape;
                if (!p) continue;
                let idx = -1;
                for (let j = 0, len = p.childs.length; j < len; j++) {
                    if (p.childs[j].id === shape.id) {
                        idx = j;
                        break;
                    }
                }
                if (idx > -1) api.shapeDelete(this.__document, page, p as GroupShape, idx);
            }
        }
    }

    public isDeleted() {
        return !this.__page.getShape(this.shape.id);
    }

    // contact
    /**
     * @description 修改连接线的编辑状态，如果一条连接线的状态为被用户手动编辑过，
     * 则在生成路径的时候应该以用户手动确认的点为主体，让两端去连接这些用户手动确认的点。
     */
    public modify_edit_state(state: boolean) {
        if (this.shape.type !== ShapeType.Contact) return false;
        this._repoWrap("modify_edit_state", (api) => {
            api.contactModifyEditState(this.__page, this.shape as ContactShape, state);
        });
    }

    public modify_frame_by_points() {
        this._repoWrap("modify_frame_by_points", (api) => {
            update_frame_by_points(api, this.__page, this.shape as PathShape);
        });
    }

    public reset_contact_path() {
        if (!(this.shape instanceof ContactShape)) {
            return false;
        }
        const shape = this.shape;
        this._repoWrap("reset_contact_path", (api) => {
            api.contactModifyEditState(this.__page, shape, false);

            const points = get_points_for_init(this.__page, shape, 1, shape.getPoints());

            const len = shape.points.length;

            api.deletePoints(this.__page, shape, 0, len);

            for (let i = 0, len = points.length; i < len; i++) {
                const p = importCurvePoint((points[i]));
                p.id = v4();
                points[i] = p;
            }

            api.addPoints(this.__page, shape, points);
            update_frame_by_points(api, this.__page, shape);
            console.log('reset path');
        });
    }

    // symbolref
    switchSymRef(refId: string) {
        if (!(this.shape instanceof SymbolRefShape)) return;
        // check？

        if (this.modifyVariable(VariableType.SymbolRef, OverrideType.SymbolID, (_var) => {
            return refId;
        })) return;

        const api = this.__repo.start("switchSymRef");
        try {
            api.shapeModifySymRef(this.__page, this.shape, refId);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // symbolref
    /**
     * @description 切换实例的可变组件状态
     */
    switchSymState(varId: string, state: string) {
        if (!(this.shape instanceof SymbolRefShape)) return;

        // 寻找目标组件
        const shape: SymbolRefShape = this.shape;
        const sym1 = shape.symData;
        const sym = sym1?.parent;
        if (!sym1 || !sym || !(sym instanceof SymbolUnionShape)) return;

        const symbols: SymbolShape[] = sym.childs as any as SymbolShape[];

        const curState = new Map<string, string>();
        sym.variables?.forEach((v) => {
            if (v.type === VariableType.Status) {
                const cur = v.id === varId ? state : sym1.symtags?.get(v.id);
                curState.set(v.id, cur ?? v.value);
            }
        })

        // 找到对应的shape
        const candidateshape: SymbolShape[] = []
        const matchshapes: SymbolShape[] = [];
        symbols.forEach((s) => {
            const symtags = s.symtags;

            let match = true;
            curState.forEach((v, k) => {
                const tag = symtags?.get(k) ?? SymbolShape.Default_State;
                if (match) match = v === tag;
                if (k === varId && v === tag) candidateshape.push(s);
            });
            if (match) {
                matchshapes.push(s);
            }
        })
        //

        const matchsym = matchshapes[0] ?? candidateshape[0];
        if (!matchsym) {
            throw new Error();
        }
        this.switchSymRef(matchsym.id);
    }

    // symbol
    modifySymTag(varId: string, tag: string) {
        if (!(this.shape instanceof SymbolShape)) return;
        if (this.shape.isVirtualShape) return;

        const shape = this.shape;


        const sym = this.shape.parent;
        if (!sym || !(sym instanceof SymbolShape) || !(sym instanceof SymbolUnionShape)) return;

        const symbols: SymbolShape[] = sym.childs as any as SymbolShape[];

        const curVars = new Map<string, Variable>();
        const curState = new Map<string, string>();
        let _var: Variable | undefined;
        sym.variables?.forEach((v) => {
            if (v.type === VariableType.Status) {
                const overrides = shape.findOverride(v.id, OverrideType.Variable);
                const _v = overrides ? overrides[overrides.length - 1] : v;
                curState.set(v.id, _v.value);
                curVars.set(v.id, _v);
            }
        })

        if (!_var) { // 不存在了？
            throw new Error();
        }

        // 找到对应的shape
        const matchshapes: SymbolShape[] = [];
        symbols.forEach((s) => {
            const symtags = s.symtags;

            let match = true;
            curState.forEach((v, k) => {
                const tag = symtags?.get(k) ?? SymbolShape.Default_State;
                if (match) match = v === tag;
            });
            if (match) {
                matchshapes.push(s);
            }
        })

        const matchshape = matchshapes[0];
        // 同步修改当前var的值，判断下是不是选择了这个sym?

        // 检查重复值，这个无法避免完全不重复，还是有可能同步修改过来的
        //

        const api = this.__repo.start("modifySymTag");
        try {
            if (shape.id === matchshape.id) {
                // todo
                // 同步修改对应的变量值
                const _var = curVars.get(varId);
                if (!_var) throw new Error();
                this.modifyVariable2(_var, tag, api);
            }

            // todo 判断shape是否是virtual? 不能是
            // 修改vartag
            api.shapeModifyVartag(this.__page, shape, varId, tag);

            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    /**
     * @description 修改可变组件的某一个属性var的属性值 --776a0ac3351f
     */
    modifyStateSymTagValue(varId: string, tag: string) {
        if (!this.shape.parent || !(this.shape.parent instanceof SymbolUnionShape)) return;
        const api = this.__repo.start("modifyStateSymTagValue");
        try {
            const is_default = is_default_state(this.shape as SymbolShape); // 如果修改的可变组件为默认可变组件，则需要更新组件的默认状态
            if (is_default) {
                const variables = (this.shape.parent as SymbolUnionShape).variables;
                const _var = variables?.get(varId);
                if (!_var) throw new Error('wrong variable');
                api.shapeModifyVariable(this.__page, _var, tag);
            }
            api.shapeModifyVartag(this.__page, this.shape as SymbolShape, varId, tag);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // symbol symbolref
    createVar(type: VariableType, name: string, value: any) {
        if (!(this.shape instanceof SymbolShape) && !(this.shape instanceof SymbolRefShape)) return;
        if (this.shape.isVirtualShape) return;

        // virtual? no

        const _var = new Variable(uuid(), type, name, value);
        // _var.value = value;
        const api = this.__repo.start("createVar");
        try {
            api.shapeAddVariable(this.__page, this.shape, _var);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    /**
     * @description 给组件移除一个变量
     */
    removeVar(key: string) {
        if (!(this.shape instanceof SymbolShape) && !(this.shape instanceof SymbolRefShape)) return;
        if (this.shape.isVirtualShape) return;

        // virtual? no
        const _var = this.shape.getVar(key);
        if (!_var) return;

        // 遍历所有子对象
        const traval = (g: GroupShape, f: (s: Shape) => void) => {
            const childs = g.childs;
            childs.forEach((s) => {
                f(s);
                if (s instanceof GroupShape) traval(s, f);
            })
        }

        const api = this.__repo.start("removeVar");
        try {
            // 将_var的值保存到对象中
            if (this.shape instanceof SymbolShape) switch (_var.type) {
                case VariableType.Visible:
                    traval(this.shape, (s: Shape) => {
                        const bindid = s.varbinds?.get(OverrideType.Visible);
                        if (bindid && bindid === _var.id && (!!s.isVisible !== !!_var.value)) {
                            api.shapeModifyVisible(this.__page, s, !s.isVisible);
                        }
                    });
                    break;
                case VariableType.Text:
                    traval(this.shape, (s: Shape) => {
                        const bindid = s.varbinds?.get(OverrideType.Text);
                        if (bindid && bindid === _var.id && s instanceof TextShape) {
                            api.deleteText(this.__page, s, 0, s.text.length - 1);
                            if (typeof _var.value === 'string') {
                                api.insertSimpleText(this.__page, s, 0, _var.value);
                            } else {
                                api.insertComplexText(this.__page, s, 0, _var.value);
                            }
                        }
                    });
                    break;
            }
            api.shapeRemoveVariable(this.__page, this.shape, key);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    /**
     * @description 解除一个对象上的某一个变量绑定
     * @param type
     */
    removeBinds(type: OverrideType) {
        if (!is_part_of_symbol(this.shape)) return;
        try {
            const api = this.__repo.start("removeBinds");
            const var_id = this.shape.varbinds?.get(type);
            if (!var_id) throw new Error('Invalid Override');
            api.shapeUnbinVar(this.__page, this.shape, type);
            const symbol = get_symbol_by_layer(this.shape);
            if (!symbol) {
                this.__repo.commit();
                return;
            }
            const layers = find_layers_by_varid(symbol, var_id, type);
            if (!layers.length) {
                api.shapeRemoveVariable(this.__page, symbol, var_id);
            }
            this.__repo.commit();
        } catch (e) {
            console.error("error from removeBinds:", e);
            this.__repo.rollback();
        }
    }

    // shape
    bindVar(slot: OverrideType, varId: string) {
        const view = this.__shape;
        const varsContainer = view.varsContainer;
        if (!varsContainer) throw new Error();
        // check varId
        // const _vars: Variable[] = [];
        // if (varsContainer) findVar(varId, _vars, varsContainer);
        // if (_vars.length === 0) throw new Error();

        // const _var = _vars[_vars.length - 1];

        // 1. 如果是普通shape，直接修改varbinds
        // 2. 如果是virtual，看varbinds是否绑定了一个变量，如果是找到最终的var，并override var 到新变量？或者修改var??
        // 2.1 如果varbinds未绑定变量，如何？

        // const shape = this.shape;
        // check virtual
        if (view.isVirtualShape) {
            const _vars: Variable[] = [];
            if (view.varbinds && view.varbinds.has(slot)) findVar(view.varbinds.get(slot)!, _vars, varsContainer);
            const _var = _vars[_vars.length - 1];
            const host = varsContainer.find((v) => v instanceof SymbolRefShape) as SymbolRefShape | undefined;
            if (!host) throw new Error();
            // override
            if (_var) {
                const api = this.__repo.start("bindVar");
                try {
                    _ov_3_1_2(_var, varId, host, view, this.__page, api);
                    this.__repo.commit();
                } catch (e) {
                    console.error(e);
                    this.__repo.rollback();
                }
            } else {
                // override to variable // todo slot要与override相同！
                const api = this.__repo.start("bindVar");
                try {
                    // this._override2Variable(varId, slot, api);
                    _ov_2_2(host, slot, varId, view, this.__page, api);
                    this.__repo.commit();
                } catch (e) {
                    console.error(e);
                    this.__repo.rollback();
                }
            }
        } else {
            const api = this.__repo.start("bindVar");
            try {
                api.shapeBindVar(this.__page, this.shape, slot, varId);
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }
        }

    }
}