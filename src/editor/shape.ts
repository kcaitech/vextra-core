/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    BoolShape,
    GroupShape,
    PathShape,
    PathShape2,
    RectShape,
    Shape,
    ShapeType,
    SymbolShape,
    SymbolUnionShape,
    TextShape,
    Variable,
    VariableType,
    Color,
    PathType,
    Document,
    SymbolRefShape,
    Text,
    Page,
    BorderStyle,
    Fill,
    BoolOp,
    CurvePoint,
    ExportFormat,
    ContactShape,
    AutoLayout,
    PathSegment,
    BasicArray,
    string2Text,
    Artboard,
    ShapeFrame
} from "../data";
import { expand, expandTo, translate, translateTo } from "./frame";
import { CoopRepository } from "../coop/cooprepo";
import {
    CurveMode,
    ExportFileFormat,
    ExportFormatNameingScheme,
    ExportOptions,
    OverrideType,
    StackMode,
    StackSizing,
    StackWrap
} from "../data/typesdefine";
import { Operator } from "../coop/recordop";
import { importCurvePoint } from "../data/baseimport";
import { v4 } from "uuid";
import { uuid } from "../basic/uuid";
import {
    after_remove,
    clear_binds_effect,
    find_layers_by_varid,
    get_symbol_by_layer,
    is_default_state
} from "./utils/other";
import { _typing_modify, modify_points_xy, update_frame_by_points } from "./utils/path";
import { adapt_for_artboard } from "./utils/common";
import { ShapeView, SymbolRefView, SymbolView, adapt2Shape, findOverride, ArtboardView, findVar, GroupShapeView, PageView } from "../dataview";
import { is_part_of_symbol, is_symbol_or_union, modify_variable, modify_variable_with_api, shape4border, shape4contextSettings, shape4exportOptions, shape4fill, shape4shadow } from "./symbol";
import { ISave4Restore, LocalCmd, SelectionState } from "../coop/localcmd";
import { exportCurvePoint } from "../data/baseexport";
import { layoutShapesOrder2, layoutSpacing } from "./utils/auto_layout2";
import { group, ungroup } from "./group";
import { newArtboard } from "./creator/creator";

export class ShapeEditor {
    protected __shape: ShapeView;
    protected __repo: CoopRepository;
    protected _page: PageView;
    protected __document: Document

    constructor(shape: ShapeView, page: PageView, repo: CoopRepository, document: Document) {
        // check
        if (!(shape instanceof ShapeView)) throw new Error("shape wrong");
        if (!(page instanceof PageView)) {
            console.error("page wrong", page ? JSON.stringify(page, (k, v) => k.startsWith('__')) : page)
            throw new Error("page wrong");
        }
        if (!(repo instanceof CoopRepository)) throw new Error("repo wrong");
        if (!(document instanceof Document)) throw new Error("document wrong");
        this.__shape = shape;
        this.__repo = repo;
        this._page = page;
        this.__document = document;
    }

    get __page() {
        return this._page.data
    }

    get view(): ShapeView {
        return this.__shape;
    }

    get shape(): Shape {
        return adapt2Shape(this.__shape);
    }

    private _repoWrap(name: string, func: (api: Operator) => void) {
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
    // private overrideVariable(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, api: Api, view?: ShapeView) {
    //     view = view ?? this.__shape;
    //     return override_variable(this.__page, varType, overrideType, valuefun, api, view);
    // }

    /**
     * 检查当前shape的overrideType对应的属性值是否由变量起作用，如果是则判断var是否可以修改，如可以则「修改」var，否则先override再「修改」新的var
     * @returns
     */
    modifyVariable(varType: VariableType, overrideType: OverrideType, value: any, api: Operator): boolean {
        return modify_variable_with_api(api, this._page, this.__shape, varType, overrideType, value);
    }

    /**
     * 修改_var的值为value，如果_var不可以修改，则override _var到value
     * @param _var
     * @param value
     * @param api
     */
    private modifyVariable2(_var: Variable, value: any, api: Operator) {
        modify_variable(this.__document, this.__page, this.__shape, _var, { value }, api);
    }

    /**
     * @description 修改_var的名称为name，如果_var不可以修改，则override _var到name
     */
    modifyVariableName(_var: Variable, name: string) {
        try {
            const api = this.__repo.start("modifyVariableName");
            modify_variable(this.__document, this.__page, this.__shape, _var, { name }, api);
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

    modifySymbolRefVisibleVariable(_var: Variable, value: any) {
        try {
            const api = this.__repo.start("modifySymbolRefVisibleVariable");
            const clearOverride = (children: ShapeView[]) => {
                for (const child of children) {
                    if (child instanceof GroupShapeView) clearOverride(child.childs);
                    const originOV = child._findOV(OverrideType.Visible, VariableType.Visible);
                    if (!originOV) continue;
                    const varbinds = child.varbinds;
                    const varId = varbinds?.get(OverrideType.Visible);
                    if (!varId) continue;
                    const _vars: Variable[] = [];
                    child.varsContainer && findVar(varId, _vars, child.varsContainer, undefined, false);
                    if (_vars.find(i => i.id === _var.id) && !_vars.find(i => i.id === originOV.id)) {
                        api.shapeRemoveVariable(this.__page, this.shape as SymbolRefShape, originOV.id);
                    }
                }
            }
            clearOverride((this.view as SymbolRefView).childs);
            this.modifyVariable2(_var, value, api);
            this.__repo.commit();
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
        }
    }

    modifySymbolRefTextVariable(_var: Variable, value: any) {
        try {
            const api = this.__repo.start("modifySymbolRefTextVariable");
            const page = this.__page;
            const shape = this.shape as SymbolRefShape;
            const clearOverride = (children: ShapeView[]) => {
                for (const child of children) {
                    if (child instanceof GroupShapeView) clearOverride(child.childs);
                    const originOV = child._findOV(OverrideType.Text, VariableType.Text);
                    if (!originOV) continue;
                    const varbinds = child.varbinds;
                    const varId = varbinds?.get(OverrideType.Text);
                    if (!varId) continue;
                    const _vars: Variable[] = [];
                    child.varsContainer && findVar(varId, _vars, child.varsContainer, undefined, false);
                    if (_vars.find(i => i.id === _var.id) && !_vars.find(i => i.id === originOV.id)) {
                        api.shapeRemoveVariable(page, shape, originOV.id);
                    }
                }
            }
            clearOverride((this.view as SymbolRefView).childs);
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
        // 仅重置当前ref

        let view = this.view as SymbolRefView;

        let p: ShapeView | undefined = view;
        while (p && p.isVirtualShape) {
            p = p.parent;
        }
        if (!(p instanceof SymbolRefView)) throw new Error();

        const api = this.__repo.start('resetSymbolRefVariable');
        try {
            if (p === view) {
                // 清空当前view的variables,overrides,isCustomSize
                const variables = view.variables;
                const overrides = view.overrides;
                overrides && overrides.forEach((v, k) => {
                    api.shapeRemoveOverride(this.__page, view.data, k);
                })
                variables.forEach((_, k) => {
                    api.shapeRemoveVariable(this.__page, view.data, k);
                });
                if (view.isCustomSize) {
                    api.shapeModifyIsCustomSize(this.__page, view.data, false);
                    const sym = view.symData;
                    if (sym) api.shapeModifyWH(this.__page, view.data, sym.size.width, sym.size.height);
                }
                if (view.uniformScale && view.uniformScale !== 1) {
                    api.modifyShapeScale(this.__page, view.data, 1);
                }
            } else {
                // 清空p中与当前view相关的variables,overrides
                const variables = p.variables;
                const overrides = p.overrides;

                const _p = p;
                const refId = view.id.split('/').slice(1).join('/'); // 去掉首个

                overrides && overrides.forEach((v, k) => {

                    if (!(k.startsWith(refId))) return;
                    api.shapeRemoveOverride(this.__page, _p.data, k);

                    const variable = variables.get(v);
                    if (variable) api.shapeRemoveVariable(this.__page, _p.data, k);
                })
            }

            this.__repo.commit();
            return true;
        } catch (e) {
            this.__repo.rollback();
            throw e;
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
        if (!is_symbol_or_union(symbol)) return;
        const api = this.__repo.start("makeTextVar");
        try {
            const text = string2Text(dlt)
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
                modify_variable(this.__document, this.__page, this.__shape, variable, { name: new_name }, api)
            }

            if (new_dlt_value !== variable.value) {
                modify_variable(this.__document, this.__page, this.__shape, variable, { value: new_dlt_value }, api)
            }

            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
            return false;
        }
    }

    public setName(name: string) {
        this._repoWrap('setName', (api) => {
            const __r = this.modifyVariable(VariableType.Name, OverrideType.Name, name, api);
            if (__r) return;
            api.shapeModifyName(this.__page, this.shape, name)
            api.shapeModifyNameFixed(this.__page, this.shape, true);
        })
    }

    public toggleVisible() {
        // 实例图层
        this._repoWrap('toggleVisible', (api) => {
            const isVisible = !this.view.isVisible;
            if (this.modifyVariable(VariableType.Visible, OverrideType.Visible, isVisible, api)) return;
            api.shapeModifyVisible(this.__page, this.shape, isVisible);
        })
    }

    public toggleLock() {
        this._repoWrap('toggleLock', (api) => {
            const isLocked = !this.view.isLocked;
            if (this.modifyVariable(VariableType.Lock, OverrideType.Lock, isLocked, api)) return;
            api.shapeModifyLock(this.__page, this.shape, isLocked);
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
            expand(api, this.__document, this.__page, this.shape, dw, dh);
        });
    }

    public expandTo(w: number, h: number) {
        this._repoWrap("expandTo", (api) => {
            expandTo(api, this.__document, this.__page, this.shape, w, h);
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
            api.shapeModifyHFlip(this.__page, this.shape)
        });
    }

    public flipV() {
        this._repoWrap("flipVertical", (api) => {
            api.shapeModifyVFlip(this.__page, this.shape)
        });
    }

    public contextSettingOpacity(value: number) {
        const api = this.__repo.start("contextSettingOpacity");
        try {
            const shape = shape4contextSettings(api, this.__shape, this._page);
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
            // api.shapeModifyRotate(this.__page, this.shape, deg)
        });
    }

    // radius
    public setRectRadius(lt: number, rt: number, rb: number, lb: number) {
        const shape = this.shape;
        this._repoWrap("setRectRadius", (api) => {
            api.shapeModifyRadius(this.__page, (shape as RectShape), lt, rt, rb, lb);
        });
    }

    public setFixedRadius(fixedRadius: number) {
        if (this.shape instanceof GroupShape) {
            if (!(this.shape instanceof BoolShape)) return;
        } else if (!(this.shape instanceof PathShape || this.shape instanceof PathShape2 || this.shape instanceof TextShape)) {
            return;
        }
        this._repoWrap("setFixedRadius", (api) => {
            api.shapeModifyFixedRadius(this.__page, this.shape as GroupShape, fixedRadius || undefined);
        });
    }

    public setBoolOp(op: BoolOp, name?: string) {
        if (!(this.shape instanceof BoolShape)) return;
        this._repoWrap("setBoolOp", (api) => {
            const shape = this.shape as BoolShape;
            if (name) api.shapeModifyName(this.__page, this.shape, name);
            shape.childs.forEach((child) => {
                api.shapeModifyBoolOp(this.__page, child, op);
            })
        });
    }

    /**
     * @description 已提出到 "editor/utils/symbol"
     */
    private shape4fill(api: Operator, shape?: ShapeView) {
        return shape4fill(api, this._page, shape ?? this.__shape);
    }

    /**
     * @deprecated 单个图层修改局限性大，应该使用批量修改接口
     */
    public addFill(fill: Fill) {
        this._repoWrap("addFill", (api) => {
            const shape = this.shape4fill(api);
            const fills = shape instanceof Shape ? shape.style.fills : shape.value;
            api.addFillAt(fills, fill, fills.length);
        });
    }

    /**
     * @deprecated 单个图层修改局限性大，应该使用批量修改接口
     */
    public setFillColor(fill: Fill, color: Color) {
        this._repoWrap("setFillColor", (api) => {
            api.setFillColor(fill, color);
        });
    }

    public setFillEnable(fill: Fill, value: boolean) {
        this._repoWrap("setFillEnable", (api) => {
            api.setFillEnable(fill, value);
        });
    }

    public deleteFill(fills: BasicArray<Fill>, idx: number) {
        this._repoWrap("deleteFill", (api) => {
            api.deleteFillAt(fills, idx);
        });
    }

    /**
     * @description 已提出到 "editor/utils/symbol"
     */
    private shape4border(api: Operator, shape?: ShapeView) {
        return shape4border(api, this._page, shape ?? this.__shape);
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

    public setBorderStyle(borderStyle: BorderStyle) {
        this._repoWrap("setBorderStyle", (api) => {
            const shape = this.shape4border(api);
            api.setBorderStyle(this.__page, shape, borderStyle);
        });
    }

    public deleteBorder(idx: number) {

        this._repoWrap("deleteBorder", (api) => {
            const shape = this.shape4border(api);
            api.deleteStrokePaintAt(this.__page, shape, idx)
        });

    }

    public addStrokePaint(strokePaint: Fill) {
        this._repoWrap("addStrokePaint", (api) => {
            const shape = this.shape4border(api);
            const borders = shape instanceof Shape ? shape.style.borders : shape.value;
            api.addStrokePaint(this.__page, shape, strokePaint, borders.strokePaints.length);
        });
    }

    // points
    public setPathClosedStatus(val: boolean, segmentIndex: number) {
        this._repoWrap("setPathClosedStatus", (api) => {
            api.setCloseStatus(this.__page, this.shape as PathShape, val, segmentIndex);
        });
    }

    public addPointAt(point: CurvePoint, idx: number, segmentIndex: number) {
        this._repoWrap("addPointAt", (api) => {
            api.addPointAt(this.__page, this.shape as PathShape, idx, point, segmentIndex);
        });
    }

    public removePoints(map: Map<number, number[]>) {
        try {
            let result = -1;

            const api = this.__repo.start("removePoints");

            const page = this.__page;

            const shape = this.shape as PathShape;

            map.forEach((indexes, segment) => {
                indexes = indexes.sort((a, b) => {
                    if (a > b) {
                        return 1;
                    } else {
                        return -1;
                    }
                });
                if (!indexes.length) {
                    console.log('removePoints: !indexes.length');
                    return;
                }
                for (let i = indexes.length - 1; i > -1; i--) {
                    api.deletePoint(page, shape, indexes[i], segment);
                }
                const seg = shape.pathsegs[segment];
                if (seg.points.length === 2) {
                    api.setCloseStatus(page, shape, false, segment);
                }

                if (seg.points.length < 2) {
                    api.deleteSegmentAt(page, shape, segment);
                }
            });

            result = 1;

            let needRecovery = true;

            for (let i = 0; i < shape.pathsegs.length; i++) {
                if (shape.pathsegs[i].points.length > 1) {
                    needRecovery = false;
                    break;
                }
            }

            if (needRecovery) {
                this.__delete(shape, api);
                result = 0;
            } else {
                api.shapeEditPoints(page, shape, true);
                update_frame_by_points(api, page, shape);
            }

            this.__repo.commit();

            return result;
        } catch (e) {
            this.__repo.rollback();
            console.log('removePoints:', e);
            return -1;
        }

    }

    __delete(shape: Shape, api: Operator) {
        const parent = shape.parent as GroupShape;
        const index = parent.indexOfChild(shape);

        if (index < 0) {
            return;
        }

        api.shapeDelete(this.__document, this.__page, parent, index);

        if (!parent.childs.length) {
            this.__delete(parent, api);
        }
    }

    public modifyPointsCurveMode(range: Map<number, number[]>, curve_mode: CurveMode) {
        try {
            const api = this.__repo.start("modifyPointsCurveMode");

            if (this.shape.pathType !== PathType.Editable) return;

            range.forEach((indexes, segment) => {
                for (let i = indexes.length - 1; i > -1; i--) {
                    const index = indexes[i];
                    _typing_modify(this.shape as PathShape, this.__page, api, index, curve_mode, segment);
                    api.modifyPointCurveMode(this.__page, this.shape as PathShape, index, curve_mode, segment);
                }
            });

            update_frame_by_points(api, this.__page, this.shape as PathShape);
            if (!this.shape.haveEdit) api.shapeEditPoints(this.__page, this.shape, true);
            this.__repo.commit();
            return true;
        } catch (e) {
            console.log("modifyPointsCurveMode:", e);
            this.__repo.rollback();
            return false;
        }
    }

    public modifyPointsCornerRadius(range: Map<number, number[]>, cornerRadius: number) {
        try {
            const api = this.__repo.start("modifyPointsCornerRadius");

            if (this.shape.pathType !== PathType.Editable) {
                return;
            }

            range.forEach((indexes, segment) => {
                for (let i = indexes.length - 1; i > -1; i--) {
                    api.modifyPointCornerRadius(this.__page, this.shape as PathShape, indexes[i], cornerRadius, segment);
                }
            });

            this.__repo.commit();
            return true;
        } catch (e) {
            console.log("modifyPointsCornerRadius:", e);
            this.__repo.rollback();
            return false;
        }
    }

    public modifyPointsXY(actions: { x: number, y: number, segment: number, index: number }[]) {
        try {
            if (!this.shape.pathType) {
                return;
            }

            const api = this.__repo.start("modifyPointsXY");
            modify_points_xy(api, this.__page, this.shape as PathShape, actions);
            this.__repo.commit();
            return true;
        } catch (e) {
            console.log('modifyPointsXY:', e);
            this.__repo.rollback();
            return false;
        }
    }

    // export ops
    public addExportFormat(formats: ExportFormat[]) {
        const api = this.__repo.start("addExportFormat");
        try {
            const shape = shape4exportOptions(api, this.__shape, this._page);
            const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
            const len = options?.exportFormats.length || 0;
            for (let i = 0; i < formats.length; i++) {
                const format = formats[i];
                const length = len + i;
                api.addExportFormat(this.__page, shape, format, length);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    public deleteExportFormat(idx: number) {
        const format = this.__shape.exportOptions?.exportFormats[idx];
        if (format) {
            const api = this.__repo.start("deleteExportFormat");
            try {
                const shape = shape4exportOptions(api, this.__shape, this._page);
                api.deleteExportFormatAt(this.__page, shape, idx)
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }
        }
    }

    public setExportFormatScale(idx: number, scale: number) {
        const format = this.__shape.exportOptions?.exportFormats[idx];
        if (format) {
            const api = this.__repo.start("setExportFormatScale");
            try {
                const shape = shape4exportOptions(api, this.__shape, this._page);
                api.setExportFormatScale(this.__page, shape, idx, scale);
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }
        }
    }

    public setExportFormatName(idx: number, name: string) {
        const format = this.__shape.exportOptions?.exportFormats[idx];
        if (format) {
            const api = this.__repo.start("setExportFormatName");
            try {
                const shape = shape4exportOptions(api, this.__shape, this._page);
                api.setExportFormatName(this.__page, shape, idx, name);
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }
        }
    }

    public setExportFormatFileFormat(idx: number, fileFormat: ExportFileFormat) {
        const format = this.__shape.exportOptions?.exportFormats[idx];
        if (format) {
            const api = this.__repo.start("setExportFormatFileFormat");
            try {
                const shape = shape4exportOptions(api, this.__shape, this._page);
                api.setExportFormatFileFormat(this.__page, shape, idx, fileFormat);
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }
        }
    }

    public setExportFormatPerfix(idx: number, perfix: ExportFormatNameingScheme) {
        const format = this.__shape.exportOptions?.exportFormats[idx];
        if (format) {
            const api = this.__repo.start("setExportFormatPerfix");
            try {
                const shape = shape4exportOptions(api, this.__shape, this._page);
                api.setExportFormatPerfix(this.__page, shape, idx, perfix);
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
            const shape = shape4exportOptions(api, this.__shape, this._page);
            api.setExportTrimTransparent(this.__page, shape, trim);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    public setExportCanvasBackground(background: boolean) {
        const api = this.__repo.start("setExportTrimTransparent");
        try {
            const shape = shape4exportOptions(api, this.__shape, this._page);
            api.setExportCanvasBackground(this.__page, shape, background);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    public setExportPreviewUnfold(unfold: boolean) {
        const api = this.__repo.start("setExportTrimTransparent");
        try {
            const shape = shape4exportOptions(api, this.__shape, this._page);
            api.setExportPreviewUnfold(this.__page, shape, unfold);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // 容器自适应大小
    public adapt() {
        try {
            if (!(this.view instanceof ArtboardView)) return;
            const api = this.__repo.start('adapt');
            if (adapt_for_artboard(api, this.__page, this.view)) this.__repo.commit();
        } catch (error) {
            console.error('adapt', error);
            this.__repo.rollback();
        }
    }

    // 删除图层
    public delete(_api?: Operator) {
        if (this.shape.isVirtualShape) {
            this.toggleVisible();
            return;
        }
        const parent = this.shape.parent as GroupShape;
        if (parent) {
            const childs = parent.type === ShapeType.SymbolRef ? ((parent as GroupShape).naviChilds || []) : (parent as GroupShape).childs;
            const index = childs.findIndex(s => s.id === this.shape.id);
            if (index >= 0) {
                try {
                    const api = _api ?? this.__repo.start("deleteShape", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                        const state = {} as SelectionState;
                        if (isUndo) state.shapes = [this.shape.id];
                        else state.shapes = cmd.saveselection?.shapes || [];
                        selection.restore(state);
                    });
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
                    _api || this.__repo.commit();
                } catch (error) {
                    this.__repo.rollback();
                    throw error;
                }
            }
        }
    }

    private removeContactSides(api: Operator, page: Page, shape: ContactShape) {
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

    private removeContact(api: Operator, page: Page, shape: Shape) {
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

    public reset_contact_path(visiblePoints: CurvePoint[]) {
        if (!(this.shape instanceof ContactShape)) {
            return false;
        }
        const shape = this.shape;
        this._repoWrap("reset_contact_path", (api) => {
            api.contactModifyEditState(this.__page, shape, false);

            const len = shape.points.length;

            api.deletePoints(this.__page, shape, 0, len, 0);

            for (let i = 0, len = visiblePoints.length; i < len; i++) {
                const p = importCurvePoint((visiblePoints[i]));
                p.id = v4();
                visiblePoints[i] = p;
            }

            api.addPoints(this.__page, shape, visiblePoints, 0);
        });
    }

    // symbolref
    switchSymRef(refId: string) {
        // check
        if (!(this.view instanceof SymbolRefView)) return;
        const api = this.__repo.start("switchSymRef");
        try {
            if (!this.modifyVariable(VariableType.SymbolRef, OverrideType.SymbolID, refId, api)) {
                api.shapeModifySymRef(this.__page, this.view.data, refId);
                const view = this.view as SymbolRefView;
                if (!view.data.isCustomSize) {
                    const sym = this.__document.symbolsMgr.get(refId);
                    if (sym) {
                        api.shapeModifyWH(this.__page, view.data, sym.size.width, sym.size.height);
                    }
                }
            }
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
        const shape = this.shape;
        if (!(shape instanceof SymbolShape)) return;
        if (shape.isVirtualShape) return;
        const sym = shape.parent;
        if (!(sym instanceof SymbolUnionShape)) return;

        const symbols: SymbolShape[] = sym.childs as any as SymbolShape[];

        const curVars = new Map<string, Variable>();
        const curState = new Map<string, string>();
        let _var: Variable | undefined;
        sym.variables?.forEach((v) => {
            if (v.type === VariableType.Status) {
                const overrides = findOverride(v.id, OverrideType.Variable, this.__shape.varsContainer || []);
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
                // this.modifyVariable2(_var, tag, api);
                api.shapeModifyVariable(this.__page, _var, tag);
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
     * @description 修改可变组件的某一个属性var的属性值
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
        const shape = this.shape;
        if (!(shape instanceof SymbolShape)) return;
        // virtual? no
        if (shape.isVirtualShape) return;
        const _var = shape.getVar(key);
        if (!_var) return;

        // 遍历所有子对象
        const traval = (g: GroupShape, varId: string, ot: OverrideType, f: (s: Shape) => void) => {
            const childs = g.childs;
            childs.forEach((s) => {
                const bindid = s.varbinds?.get(ot);
                if (bindid === varId) f(s);
                if (s instanceof GroupShape) traval(s, varId, ot, f);
            })
        }
        const api = this.__repo.start("removeVar");
        try {
            // 将_var的值保存到对象中
            switch (_var.type) {
                case VariableType.Visible:
                    traval(shape, _var.id, OverrideType.Visible, (s: Shape) => {
                        if ((!!s.isVisible !== !!_var.value)) {
                            api.shapeModifyVisible(this.__page, s, !s.isVisible);
                        }
                    });
                    break;
                case VariableType.Text:
                    traval(shape, _var.id, OverrideType.Text, (s: Shape) => {
                        if (s instanceof TextShape) {
                            api.deleteText2(this.__page, s, 0, s.text.length - 1);
                            if (typeof _var.value === 'string') {
                                api.insertSimpleText2(this.__page, s, 0, _var.value);
                            } else {
                                api.insertComplexText2(this.__page, s, 0, _var.value);
                            }
                        }
                    });
                    break;
            }
            api.shapeRemoveVariable(this.__page, shape, key);
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
        if (view.isVirtualShape) throw new Error();
        const api = this.__repo.start("bindVar");
        try {
            api.shapeBindVar(this.__page, this.shape, slot, varId);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }

    }

    addAutoLayout() {
        let api: Operator;
        const parent = adapt2Shape(this.__shape) as GroupShape;
        const id = parent.id;
        let artboard: Artboard | undefined = undefined;
        const p = parent.parent! as GroupShape;
        if (parent.type === ShapeType.Group) {
            artboard = newArtboard(parent.name, new ShapeFrame(0, 0, 100, 100), this.__document.stylesMgr);
            api = this.__repo.start("addAutoLayout", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = [id];
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });
            artboard.style = parent.style;
        } else {
            api = this.__repo.start("addAutoLayout");
        }
        try {
            const shapes_rows = layoutShapesOrder2(this.__shape.childs, false);
            const rows = shapes_rows.flat();
            const { hor, ver } = layoutSpacing(shapes_rows);
            const h_padding = shapes_rows.length ? Math.max(Math.round(Math.min(...rows.map(s => s.x))), 0) : 10;
            const v_padding = shapes_rows.length ? Math.max(Math.round(Math.min(...shapes_rows[0].map(s => s.y))), 0) : 10;
            const ver_auto = shapes_rows.length === 1 || shapes_rows.every(s => s.length === 1) ? StackSizing.Auto : StackSizing.Fixed;
            const layoutInfo = new AutoLayout(hor, ver, h_padding, v_padding, h_padding, v_padding, ver_auto);
            let shape_width = h_padding * 2;
            let shape_height = v_padding * 2;
            if (shapes_rows.length === 1) {
                layoutInfo.stackWrap = StackWrap.NoWrap;
                layoutInfo.stackMode = StackMode.Horizontal;
                layoutInfo.stackCounterSpacing = hor;
                shape_height += Math.max(...rows.map(s => s.frameProxy._p_frame.height));
                rows.forEach(s => {
                    shape_width += s.frameProxy._p_frame.width + hor;
                })
                shape_width -= hor;
            } else if (shapes_rows.every(s => s.length === 1)) {
                layoutInfo.stackWrap = StackWrap.NoWrap;
                layoutInfo.stackMode = StackMode.Vertical;
                layoutInfo.stackSpacing = ver;
                shape_width += Math.max(...rows.map(s => s.frameProxy._p_frame.width));
                rows.forEach(s => {
                    shape_height += s.frameProxy._p_frame.height + ver;
                })
                shape_height -= ver;
            }
            // 给自动布局中的子元素进行排序
            if (this.__shape.childs.length !== rows.length) {
                const hiddenChilds = this.__shape.childs.filter(c => !c.isVisible); // 隐藏的元素放在前面
                rows.unshift(...hiddenChilds);
            }
            for (let i = 0; i < rows.length; i++) {
                const s = adapt2Shape(rows[i]);
                const currentIndex = parent.indexOfChild(s);
                if (currentIndex === i) continue;
                api!.shapeMove(this.__page, parent, currentIndex, parent, i);
            }
            if (parent.type === ShapeType.Group) {
                const saveidx = p.indexOfChild(parent);
                const childs = ungroup(this.__document, this.__page, parent, api!);
                artboard = group(this.__document, this.__page, childs.map(s => s), artboard!, p, saveidx, api!);
            }
            api!.shapeAutoLayout(this.__page, artboard || parent, layoutInfo);
            this.__repo.commit();
            return artboard;
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    /**
     * @description 裁剪路径，把第originSegmentIndex条路径裁成slices，slices不会存在新的闭合路径
     */
    clipPath(actions: { originSegmentIndex: number; slices: CurvePoint[][]; closed: boolean }[]) {
        try {
            const api = this.__repo.start("clipPath");
            const page = this.__page;
            const shape = adapt2Shape(this.__shape) as PathShape;
            const segments = shape.pathsegs;
            for (const action of actions) {
                const { originSegmentIndex, slices, closed } = action;
                let last = originSegmentIndex;
                for (let i = 0; i < slices.length; i++) {
                    const slice = new BasicArray(...slices[i].map(p => importCurvePoint(exportCurvePoint((p)))));
                    if (last === originSegmentIndex) api.deleteSegmentAt(page, shape, originSegmentIndex);
                    slice.forEach((i, index) => i.crdtidx = [index] as BasicArray<number>);
                    api.addSegmentAt(page, shape, last++, new PathSegment([0] as BasicArray<number>, uuid(), slice, closed));
                }
                if (last === originSegmentIndex) api.deleteSegmentAt(page, shape, originSegmentIndex);
            }
            if (!segments.length) this.delete(api);
            else {
                update_frame_by_points(api, page, shape);
                api.shapeEditPoints(page, shape, true);
            }
            this.__repo.commit();
            return segments.length;
        } catch (e) {
            this.__repo.rollback();
            throw e;
        }
    }
}