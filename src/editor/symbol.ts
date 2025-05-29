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
    CornerRadius,
    GroupShape,
    OverrideType,
    Shape,
    ShapeType,
    SymbolShape,
    SymbolUnionShape,
    TextShape,
    Variable,
    VariableType
} from "../data/shape";
import { ExportOptions, SymbolRefShape } from "../data/symbolref";
import { uuid } from "../basic/uuid";
import { Page } from "../data/page";
import { Operator } from "../coop/recordop";
import { newArtboard, newText2 } from "./creator/creator";
import {
    Artboard,
    AutoLayout,
    BlendMode,
    Blur,
    BlurType,
    Border,
    BorderSideSetting,
    BorderStyle,
    ContextSettings,
    Document,
    Fill,
    Point2D,
    Shadow,
    ShapeSize,
    SideType,
    string2Text,
    Style,
    TableCell,
    TableCellType,
    Text,
    Transform
} from "../data/classes";
import { findOverride } from "../data/utils";
import { BasicArray } from "../data/basic";
import {
    IImportContext,
    importAutoLayout,
    importBlur,
    importBorder,
    importColor,
    importContextSettings,
    importCornerRadius,
    importExportOptions,
    importFill,
    importGradient,
    importShadow,
    importStyle,
    importTableCell,
    importTableShape,
    importText
} from "../data/baseimport";
import {
    adapt2Shape,
    ArtboardView,
    PageView,
    ShapeView,
    SymbolRefView,
    SymbolView,
    TableCellView,
    TableView
} from "../dataview";
import { newTableCellText } from "../data/text/textutils";
import { FMT_VER_latest } from "../data/fmtver";
import * as types from "../data/typesdefine";
import { exportArtboard, exportVariable, IExportContext } from "../data/baseexport";
import { v4 } from "uuid";
import { overrideTableCell, prepareVar } from "./symbol_utils";

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

function _varsContainer(view: ShapeView) {
    let varsContainer = view.varsContainer;
    if (view.data instanceof SymbolRefShape) {
        varsContainer = (varsContainer || []).concat(view.data);
    }
    return varsContainer;
}

function _ov_newvar(host: SymbolRefShape | SymbolShape, name: string, value: any, type: VariableType, page: Page, api: Operator) {
    const _var2 = new Variable(uuid(), type, name, value);
    api.shapeAddVariable(page, host, _var2); // create var
    return _var2;
}


export function _ov(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, view: ShapeView, page: PageView, api: Operator) {
    return prepareVar(api, page, view, overrideType, varType, valuefun)?.var
}

function _clone_value(_var: Variable, document: Document, page: Page) {
    if (_var.value === undefined) return undefined;

    const ctx: IImportContext = new class implements IImportContext { document: Document = document; curPage: string = page.id; fmtVer: string = FMT_VER_latest };

    switch (_var.type) {
        case VariableType.MarkerType:
            return _var.value;
        case VariableType.Borders:
            return importBorder(_var.value, ctx);
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
        case VariableType.AutoLayout:
            return importAutoLayout(_var.value, ctx);
        default:
            throw new Error();
    }
}

export function shape4contextSettings(api: Operator, _shape: ShapeView, page: PageView) {
    const valuefun = (_var: Variable | undefined) => {
        const contextSettings = _var?.value ?? _shape.contextSettings;
        return contextSettings && importContextSettings(contextSettings) || new ContextSettings(BlendMode.Normal, 1);
    };
    const _var = _ov(VariableType.ContextSettings, OverrideType.ContextSettings, valuefun, _shape, page, api);
    return _var || _shape.data;
}

export function shape4exportOptions(api: Operator, _shape: ShapeView, page: PageView) {
    const valuefun = (_var: Variable | undefined) => {
        const options = _var?.value ?? _shape.exportOptions;
        return options && importExportOptions(options) || new ExportOptions(new BasicArray(), 0, false, false, false, false);
    };
    const _var = _ov(VariableType.ExportOptions, OverrideType.ExportOptions, valuefun, _shape, page, api);
    return _var || _shape.data;
}

export function shape4blur(api: Operator, _shape: ShapeView, page: PageView) {
    const valuefun = (_var: Variable | undefined) => {
        const blur = _var?.value ?? _shape.blur;
        return blur && importBlur(blur) || new Blur(true, new Point2D(0, 0), 10, BlurType.Gaussian);
    };
    const _var = _ov(VariableType.Blur, OverrideType.Blur, valuefun, _shape, page, api);
    return _var || _shape.data;
}

export function shape4Autolayout(api: Operator, _shape: ShapeView, page: PageView) {
    const valuefun = (_var: Variable | undefined) => {
        const autolayout = _var?.value ?? (_shape as ArtboardView).autoLayout;
        return autolayout && importAutoLayout(autolayout) || new AutoLayout(10, 10, 0, 0, 0, 0, types.StackSizing.Auto);
    };
    const _var = _ov(VariableType.AutoLayout, OverrideType.AutoLayout, valuefun, _shape, page, api);
    return _var || _shape.data;
}

// 变量可能的情况
// 1. 存在于symbolref中，则变量一定是override某个属性或者变量的。此时如果symbolref非virtual，可以直接修改，否则要再override
// 2. 存在于symbol中，则变量一定是用户定义的某个变量。当前环境如在ref中，则需要override，否则可直接修改。
export function modify_variable(document: Document, page: Page, view: ShapeView, _var: Variable, attr: { name?: string, value?: any }, api: Operator) {
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
        // const origin = _var.value as Text;
        // const text = newText2(origin.attr, origin.paras[0]?.attr, origin.paras[0]?.spans[0]);
        // text.insertText(value, 0);
        value = string2Text(value);
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
            case OverrideType.Blur:
            case OverrideType.AutoLayout:
            case OverrideType.CornerRadius:
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
export function override_variable(page: PageView, varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, api: Operator, view: ShapeView) {
    // view = view ?? this.__shape;
    return _ov(varType, overrideType, valuefun, view, page, api);
}

/**
 * @description 由外引入api的变量修改函数
 */
export function modify_variable_with_api(api: Operator, page: PageView, shape: ShapeView, varType: VariableType, overrideType: OverrideType, value: any) {
    const _var = _ov(varType, overrideType, () => value, shape, page, api);
    if (_var && _var.value !== value) {
        api.shapeModifyVariable(page.data, _var, value);
    }
    return !!_var;
}

/**
 * @description override "editor/shape/shape4border"
 */
export function shape4border(api: Operator, page: PageView, shape: ShapeView) {
    const _var = override_variable(page, VariableType.Borders, OverrideType.Borders, (_var) => {
        const borders = _var?.value ?? shape.getBorder();
        return importBorder(borders);
    }, api, shape)
    return _var || shape.data;
}

export function shape4fill(api: Operator, page: PageView, shape: ShapeView) {
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
export function shape4fill2(api: Operator, page: PageView, shape: ShapeView) {
    return override_variable(page, VariableType.Fills, OverrideType.Fills, (_var) => {
        const fills = _var?.value ?? shape.getFills();
        return new BasicArray(...(fills as Array<Fill>).map((v) => {
                const ret = importFill(v);
                const imgmgr = v.getImageMgr();
                if (imgmgr) ret.setImageMgr(imgmgr)
                return ret;
            }
        ))
    }, api, shape)!;
}

export function shape4shadow(api: Operator, page: PageView, shape: ShapeView) {
    const _var = override_variable(page, VariableType.Shadows, OverrideType.Shadows, (_var) => {
        const shadows = _var?.value ?? shape.getShadows();
        return new BasicArray(...(shadows as Array<Shadow>).map((v) => {
            return importShadow(v);
        }
        ))
    }, api, shape)
    return _var || shape.data;
}

export function shape4cornerRadius(api: Operator, page: PageView, shape: ArtboardView | SymbolView | SymbolRefView) {
    const _var = override_variable(page, VariableType.CornerRadius, OverrideType.CornerRadius, (_var) => {
        const cornerRadius = _var?.value ?? shape.cornerRadius;
        return cornerRadius ? importCornerRadius(cornerRadius) : new CornerRadius(v4(),0, 0, 0, 0);
    }, api, shape)
    const ret = _var || shape.data;
    if (ret instanceof SymbolRefShape) throw new Error();
    return ret;
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

export function cell4edit2(page: PageView, view: TableView, _cell: TableCellView, api: Operator): Variable | undefined {
    // cell id 要重新生成
    const index = view.indexOfCell(_cell);
    if (!index) throw new Error();
    const { rowIdx, colIdx } = index;
    const cellId = _cell.data.id; //view.rowHeights[rowIdx].id + "," + view.colWidths[colIdx].id;
    const valuefun = (_var: Variable | undefined) => {
        const cell = _var?.value ?? _cell.data;
        if (cell) return importTableCell(cell);
        const size = new ShapeSize();
        const trans = new Transform();
        const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
        const strokePaints = new BasicArray<Fill>();
        const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
        return new TableCell(new BasicArray(),
            cellId,
            "",
            ShapeType.TableCell,
            trans,
            new Style(new BasicArray(), new BasicArray(), border),
            TableCellType.Text,
            newTableCellText(view.data.textAttr));
    };
    // const refId = view.data.id + '/' + cellId;
    const _var = overrideTableCell(api, page, view, _cell, valuefun);
    if (_var?.var) return _var.var;
    api.tableInitCell(page.data, view.data, rowIdx, colIdx);
    // return _cell.data;
    // return _var;
}

export function cell4edit(page: PageView, view: TableView, rowIdx: number, colIdx: number, api: Operator): TableCellView {
    const cell = view.getCellAt(rowIdx, colIdx);
    if (!cell) throw new Error("cell init fail?");

    const cellId = view.rowHeights[rowIdx].id + "," + view.colWidths[colIdx].id;
    const valuefun = (_var: Variable | undefined) => {
        const cell = _var?.value ?? view._getCellAt(rowIdx, colIdx);
        if (cell) return importTableCell(cell);
        const size = new ShapeSize();
        const trans = new Transform();
        const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
        const strokePaints = new BasicArray<Fill>();
        const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
        return new TableCell(new BasicArray(),
            cellId,
            "",
            ShapeType.TableCell,
            trans,
            new Style(new BasicArray(), new BasicArray(), border),
            TableCellType.Text,
            newTableCellText(view.data.textAttr));
    };
    // const refId = view.data.id + '/' + cellId;
    // const _var = override_variable2(page, VariableType.TableCell, OverrideType.TableCell, refId, valuefun, api, view);
    const _var = overrideTableCell(api, page, view, cell, valuefun);
    if (_var?.var) {
        cell.setData(_var.var.value);
        // return _var;
        return cell;
    }

    if (api.tableInitCell(page.data, view.data, rowIdx, colIdx)) {
        // 更新下data
        const _cell = view._getCellAt2(rowIdx, colIdx);
        if (!_cell) throw new Error();
        cell.setData(_cell);
    }
    return cell;
}

export class RefUnbind {
    private static replaceId(shape: types.Shape) {
        shape.id = uuid();
        if ((shape as types.GroupShape).childs) {
            (shape as types.GroupShape).childs.forEach((c) => this.replaceId(c));
        }
    }

    private static clearBindVars(shape: types.Shape) {
        if (shape.varbinds) shape.varbinds = undefined;
        const g = shape as types.GroupShape;
        if (Array.isArray(g.childs)) {
            g.childs.forEach((c) => this.clearBindVars(c));
        }
    }

    private static solidify(shape: GroupShape, uniformScale: number) {
        const children = shape.childs;
        for (const child of children) {
            const t = child.transform.clone();
            t.scale(uniformScale, uniformScale);
            const __scale = t.decomposeScale();
            child.size.width *= Math.abs(__scale.x);
            child.size.height *= Math.abs(__scale.y);
            t.clearScaleSize();
            child.transform = (t);
            const borders = child.style.borders;
            borders.sideSetting = new BorderSideSetting(
                SideType.Normal,
                borders.sideSetting.thicknessTop * uniformScale,
                borders.sideSetting.thicknessLeft * uniformScale,
                borders.sideSetting.thicknessBottom * uniformScale,
                borders.sideSetting.thicknessRight * uniformScale
            );
            const shadows = child.style.shadows;
            shadows.forEach(s => {
                s.offsetX *= uniformScale;
                s.offsetY *= uniformScale;
                s.blurRadius *= uniformScale;
                s.spread *= uniformScale;
            });
            if (child.type === ShapeType.Text) {
                const text = (child as TextShape).text;
                scale4Text(text);
            }
            const blur = child.style.blur;
            if (blur?.saturation) blur.saturation *= uniformScale;
            if ((child as any).pathsegs?.length) {
                (child as any).pathsegs.forEach((segs: any) => {
                    segs.points.forEach((point: any) => point.radius && (point.radius *= uniformScale));
                });
            }
            if (child.type === ShapeType.Table) {
                const cells = Object.values((child as any).cells);
                cells.forEach((cell: any) => {
                    if (cell.text) scale4Text(cell.text);
                });
            }
            if ((child as any).cornerRadius) {
                const __corner: any = (child as any).cornerRadius;
                __corner.lt *= uniformScale;
                __corner.rt *= uniformScale;
                __corner.rb *= uniformScale;
                __corner.lb *= uniformScale;
            }

            if (child instanceof GroupShape) {
                this.solidify(child, uniformScale);
            }
        }

        function scale4Text(text: Text) {
            const attr = text.attr;
            if (attr?.paraSpacing) attr.paraSpacing *= uniformScale;
            if (attr?.padding?.left) attr.padding.left *= uniformScale;
            if (attr?.padding?.right) attr.padding.right *= uniformScale;
            const paras = text.paras;
            for (const para of paras) {
                const attr = para.attr;
                if (attr?.maximumLineHeight) attr.maximumLineHeight *= uniformScale;
                if (attr?.minimumLineHeight) attr.minimumLineHeight *= uniformScale;
                for (const span of para.spans) {
                    if (span.fontSize) span.fontSize *= uniformScale;
                    if (span.kerning) span.kerning *= uniformScale;
                }
            }
        }
    }

    private static transferVars(rootRef: SymbolRefShape, g: { childs: types.Shape[] }, ctx?: IExportContext): void {
        const overrides = rootRef.overrides;
        const vars = rootRef.variables;
        if (ctx) {
            vars.forEach(v => {
                if (v.type === VariableType.BlursMask
                    || v.type === VariableType.FillsMask
                    || v.type === VariableType.RadiusMask
                    || v.type === VariableType.BorderFillsMask
                    || v.type === VariableType.ShadowsMask
                    || v.type === VariableType.BordersMask
                ) ctx.styles?.add(v.value);
            })
        }
        if (!overrides) return;
        for (let i = 0, childs = g.childs; i < childs.length; ++i) {
            const c = childs[i];
            if ((c as any).childs) { // group
                return this.transferVars(rootRef, c as any, ctx);
            }
            if (c.typeId !== "symbol-ref-shape") continue;
            let refId = c.id;
            refId = refId.substring(refId.indexOf('/') + 1);
            if (refId.length === 0) throw new Error();
            overrides.forEach((v, k) => {
                if (!k.startsWith(refId)) return;
                const _v = vars.get(v);
                if (!_v) return;
                const _var = exportVariable(_v);
                _var.id = uuid();
                const override_id = k.substring(refId.length + 1);
                if (override_id.length === 0) throw new Error();
                const ref = c as types.SymbolRefShape;
                if ((ref.variables as any)[override_id]) {
                    const origin_var = (ref.variables as any)[override_id] as types.Variable;
                    origin_var.name = _var.name;
                    origin_var.value = _var.value;
                } else if (ref.overrides && (ref.overrides as any)[override_id]) {
                    const origin_ref = (ref.overrides as any)[override_id];
                    const origin_var = (ref.variables as any)[origin_ref] as types.Variable;
                    if (!origin_var) {
                        (ref.variables as any)[_var.id] = _var;
                        (ref.overrides as any)[override_id] = _var.id;
                    } else {
                        origin_var.name = _var.name;
                        origin_var.value = _var.value;
                    }
                } else {
                    (ref.variables as any)[_var.id] = _var;
                    if (!ref.overrides) (ref as any).overrides = {};
                    (ref.overrides as any)[override_id] = _var.id;
                }
            })
        }
    }

    static unbind(view: SymbolRefView, ctx?: IExportContext) {
        if (view.isVirtualShape) return;
        const shape: SymbolRefShape = adapt2Shape(view) as SymbolRefShape;
        const tmpArtboard: Artboard = newArtboard(view.name, shape.frame, view.style.getStylesMgr()!);
        tmpArtboard.childs = shape.naviChilds! as BasicArray<Shape>;
        tmpArtboard.varbinds = shape.varbinds;
        tmpArtboard.style = shape.style;
        tmpArtboard.transform.m00 = shape.transform.m00;
        tmpArtboard.transform.m01 = shape.transform.m01;
        tmpArtboard.transform.m10 = shape.transform.m10;
        tmpArtboard.transform.m11 = shape.transform.m11;
        tmpArtboard.transform.m02 = shape.transform.m02;
        tmpArtboard.transform.m12 = shape.transform.m12;

        tmpArtboard.frameMaskDisabled = view.frameMaskDisabled;

        const layoutInfo = view.autoLayout;
        if (layoutInfo) {
            tmpArtboard.autoLayout = importAutoLayout(layoutInfo);
        }
        const radius = (view as SymbolRefView).cornerRadius
        if (radius) {
            tmpArtboard.cornerRadius = importCornerRadius(radius);
        }
        const symbolData = exportArtboard(tmpArtboard, ctx); // todo 如果symbol只有一个child时

        if (shape.uniformScale && shape.uniformScale !== 1) this.solidify(symbolData as GroupShape, shape.uniformScale);

        // 遍历symbolData,如有symbolref,则查找根shape是否有对应override的变量,如有则存到symbolref内
        this.transferVars(shape, symbolData, ctx);
        this.clearBindVars(symbolData);
        this.replaceId(symbolData);
        return symbolData;
    }
}