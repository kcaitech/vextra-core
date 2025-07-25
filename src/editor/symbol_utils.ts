/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Operator } from "../operator";
import { uuid } from "../basic/uuid";
import {
    OverrideType,
    SymbolRefShape,
    SymbolShape,
    SymbolUnionShape,
    TableCell,
    Variable,
    VariableType
} from "../data";
import { PageView, ShapeView, TableCellView, TableView } from "../dataview";

// 查看说明symbol_utils.png


function _findOverride(view: ShapeView, overrideType: OverrideType, refId: string = ''): { view: ShapeView, var: Variable, refId: string } | undefined {
    let p: ShapeView | undefined = view;
    let ret: { view: ShapeView, var: Variable, refId: string } | undefined;
    // let refId = ''

    // fix refId
    if (overrideType !== OverrideType.TableCell && overrideType !== OverrideType.Variable && !(view.data instanceof SymbolRefShape)) {
        refId = view.data.id
    }

    while (p) {
        if (p.data instanceof SymbolRefShape) { // override 只存在于symbolref中
            // push symbol
            const override = p.data.getOverrid(refId, overrideType)
            if (override) {
                ret = {
                    view: p,
                    var: override.v,
                    refId
                }
            }
            refId = refId.length > 0 ? (p.data.id + '/' + refId) : p.data.id;
        }
        p = p.isVirtualShape ? p.parent! : undefined
    }
    return ret;
}

function _newVar(type: VariableType, value: any, name?: string): Variable {
    return new Variable(uuid(), type, name ?? "", value)
}

function _getRefView(view: ShapeView, _refId?: string): { view: ShapeView, refId: string } {

    let refId = _refId ?? ''
    if (!_refId && !(view.data instanceof SymbolRefShape)) {
        refId = view.data.id
    }

    while (view.isVirtualShape) {
        if (view.data instanceof SymbolRefShape) { // override 只存在于symbolref中
            refId = refId.length > 0 ? (view.data.id + '/' + refId) : view.data.id;
        }
        view = view.parent!
    }
    if (!(view.data instanceof SymbolRefShape)) throw new Error("view is not symbolref")
    return { view, refId }
}

function _getVarShape(view: ShapeView, varId: string): { shape: SymbolShape | SymbolUnionShape, var: Variable } | undefined {
    // 变量只存在于SymbolShape,SymbolUnionShape中
    // symbolref中的variable,仅用于override
    const varsContainer = view.varsContainer
    if (!varsContainer) {
        throw new Error("view is not virtual?")
    }
    for (let i = 0, len = varsContainer.length; i < len; i++) {
        const shape = varsContainer[i]
        if (shape instanceof SymbolShape && shape.variables?.has(varId)) {
            return {
                shape,
                var: shape.variables.get(varId)!
            }
        }
    }
    return undefined
}


function _getVarView(view: ShapeView, varId: string): { view: ShapeView, var: Variable } | undefined {
    let p: ShapeView | undefined = view;
    while (p) {
        if (p.data instanceof SymbolShape) {
            const _var = p.data.variables.get(varId)
            if (_var) {
                return {
                    view: p,
                    var: _var
                }
            }
        }
        p = p.parent
    }
    return undefined
}

function _isNeedOverride4SymbolRef(overrideType: OverrideType) {
    switch (overrideType) {
        case OverrideType.Borders:
        case OverrideType.ContextSettings:
        case OverrideType.EndMarkerType:
        case OverrideType.Fills:
        case OverrideType.Shadows:
        case OverrideType.StartMarkerType:
        case OverrideType.CornerRadius:
        case OverrideType.Blur:
        case OverrideType.FrameMaskDisabled:
        case OverrideType.AutoLayout:
        case OverrideType.FillsMask:
        case OverrideType.BorderFillsMask:
        case OverrideType.BordersMask:
        case OverrideType.ShadowsMask:
        case OverrideType.BlursMask:
        case OverrideType.RadiusMask:
            return true
        case OverrideType.ExportOptions:
        case OverrideType.Image:
        case OverrideType.Lock:
        case OverrideType.SymbolID:
        case OverrideType.TableCell:
        case OverrideType.Text:
        case OverrideType.Variable:
        case OverrideType.Visible:
            return false;
    }
}

function _override(op: Operator, page: PageView, view: ShapeView, overrideType: OverrideType, varType: VariableType, varValue: (_var: Variable | undefined) => any) {
    // tablecell 单独处理, @overrideTableCell
    if (view.data instanceof TableCell) {
        throw new Error("call wrong function")
    }
    // override的优先级高于varbind
    const override = _findOverride(view, overrideType)
    if (override) {
        if (override.view.isVirtualShape) {
            const _var = _newVar(varType, varValue(override.var))
            const _ref = _getRefView(override.view, override.refId)
            op.shapeAddVariable(page.data, _ref.view.data as SymbolRefShape, _var)
            const refId = _ref.refId
            op.shapeAddOverride(page.data, _ref.view.data as SymbolRefShape, refId.length > 0 ? (refId + '/' + overrideType) : overrideType, _var.id)
            return {
                view: _ref.view,
                var: _var,
                isNew: true
            }
        } else {
            return { // 不需要创建新的var
                view: override.view,
                var: override.var,
                isNew: false
            }
        }
    } else if (view.varbinds?.has(overrideType)) {
        // varbind
        const varId = view.varbinds.get(overrideType)!
        const override = _findOverride(view, OverrideType.Variable, varId)
        if (override) {
            if (override.view.isVirtualShape) {
                const _var = _newVar(varType, varValue(override.var))
                const _ref = _getRefView(override.view, override.refId)
                op.shapeAddVariable(page.data, _ref.view.data as SymbolRefShape, _var)
                const refId = _ref.refId
                op.shapeAddOverride(page.data, _ref.view.data as SymbolRefShape, refId, _var.id)
                return {
                    view: _ref.view,
                    var: _var,
                    isNew: true
                }
            } else {
                return { // 不需要创建新的var
                    view: override.view,
                    var: override.var,
                    isNew: false
                }
            }
        } else {
            const _varShape = _getVarShape(view, varId)
            if (!_varShape) {
                // 当成没有varbind来处理
                const _var = _newVar(varType, varValue(undefined))
                const _ref = _getRefView(view)
                op.shapeAddVariable(page.data, _ref.view.data as SymbolRefShape, _var)
                const refId = _ref.refId
                op.shapeAddOverride(page.data, _ref.view.data as SymbolRefShape, refId.length > 0 ? (refId + '/' + overrideType) : overrideType, _var.id)
                return {
                    view: _ref.view,
                    var: _var,
                    isNew: true
                }
            } else {
                const _var = _newVar(varType, varValue(_varShape.var))
                const _ref = _getRefView(view, varId)
                op.shapeAddVariable(page.data, _ref.view.data as SymbolRefShape, _var)
                const refId = _ref.refId
                op.shapeAddOverride(page.data, _ref.view.data as SymbolRefShape, refId, _var.id)
                return {
                    view: _ref.view,
                    var: _var,
                    isNew: true
                }
            }
        }
    } else {
        const _var = _newVar(varType, varValue(undefined))
        const _ref = _getRefView(view)
        op.shapeAddVariable(page.data, _ref.view.data as SymbolRefShape, _var)
        const refId = _ref.refId
        op.shapeAddOverride(page.data, _ref.view.data as SymbolRefShape, refId.length > 0 ? (refId + '/' + overrideType) : overrideType, _var.id)
        return {
            view: _ref.view,
            var: _var,
            isNew: true
        }
    }
}

export function prepareVar(op: Operator, page: PageView, view: ShapeView, overrideType: OverrideType, varType: VariableType, varValue: (_var: Variable | undefined) => any): {
    view: ShapeView,
    var: Variable,
    isNew: boolean
} | undefined {
    // 快速排除
    if (!view.isVirtualShape && !(view.data instanceof SymbolRefShape) && !(view.varbinds?.has(overrideType))) {
        return undefined;
    }

    if (view.isVirtualShape) {
        return _override(op, page, view, overrideType, varType, varValue)
    } else if (view.data instanceof SymbolRefShape) {
        if (!_isNeedOverride4SymbolRef(overrideType)) {
            return
        }
        // override
        const override = view.data.getOverrid("", overrideType)
        if (override) {
            return { // 不需要创建新的var
                view,
                var: override.v,
                isNew: false
            }
        }

        const _var = _newVar(varType, varValue(undefined))
        op.shapeAddVariable(page.data, view.data as SymbolRefShape, _var)
        op.shapeAddOverride(page.data, view.data as SymbolRefShape, overrideType, _var.id)
        return {
            view: view,
            var: _var,
            isNew: true
        }
    } else { // varbind
        const varId = view.varbinds?.get(overrideType)!
        const _varView = _getVarView(view, varId)
        if (_varView) {
            return {
                view: _varView.view,
                var: _varView.var,
                isNew: false
            }
        }
    }
    return undefined;
}

// override shape?
export function overrideTableCell(op: Operator, page: PageView, table: TableView, view: TableCellView, varValue: (_var: Variable | undefined) => any): {
    view: ShapeView,
    var: Variable,
    isNew: boolean
} | undefined {
    // 快速排除
    if (!view.isVirtualShape) { // 非virtual也不需要override
        return undefined;
    }

    // override的优先级高于varbind
    // todo 当view是tablecell时，refId要是tablecell的id，同variable
    // 即，refId跟overridetype相关
    const override = _findOverride(view, OverrideType.TableCell, table.data.id + '/' + view.data.id)
    if (override) {
        if (override.view.isVirtualShape) {
            const _var = _newVar(VariableType.TableCell, varValue(override.var))
            const _ref = _getRefView(override.view, override.refId)
            op.shapeAddVariable(page.data, _ref.view.data as SymbolRefShape, _var)
            const refId = _ref.refId
            op.shapeAddOverride(page.data, _ref.view.data as SymbolRefShape, refId, _var.id)
            return {
                view: _ref.view,
                var: _var,
                isNew: true
            }
        } else {
            return { // 不需要创建新的var
                view: override.view,
                var: override.var,
                isNew: false
            }
        }
    } else {
        const _var = _newVar(VariableType.TableCell, varValue(undefined))
        const _ref = _getRefView(table, table.data.id + '/' + view.data.id)
        op.shapeAddVariable(page.data, _ref.view.data as SymbolRefShape, _var)
        const refId = _ref.refId
        op.shapeAddOverride(page.data, _ref.view.data as SymbolRefShape, refId, _var.id)
        return {
            view: _ref.view,
            var: _var,
            isNew: true
        }
    }

}