/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { float_accuracy } from "../../basic/consts";
import {
    Border,
    BorderPosition,
    BorderStyle,
    Color,
    Document,
    GroupShape,
    OverrideType,
    Page,
    Shape,
    ShapeType,
    SymbolUnionShape,
    SymbolShape,
    TableCell,
    TableShape,
    Text,
    TextBehaviour,
    TextShape,
    Variable,
    VariableType,
    ShapeFrame,
    SideType,
    TextVerAlign,
    TextHorAlign,
    BorderSideSetting,
    Fill,
} from "../../data/classes";
import { BasicArray, BasicMap } from "../../data/basic";
import { newSymbolShapeUnion } from "../creator/creator";
import { uuid } from "../../basic/uuid";
import * as types from "../../data/typesdefine";
import { PageView, ShapeView, TableCellView, TableView, TextShapeView, adapt2Shape } from "../../dataview";
import { Operator } from "../../operator";

export function fixTextShapeFrameByLayout(op: Operator, page: Page, shape: TextShapeView | TextShape) {
    if (!shape.text || shape.isVirtualShape) return;
    const _shape = shape instanceof TextShape ? shape : adapt2Shape(shape);
    const textBehaviour = shape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;

    switch (textBehaviour) {
        case TextBehaviour.FixWidthAndHeight:
            break;
        case TextBehaviour.Fixed: {
            const layout = shape.getLayout();
            const fontsize = shape.text.attr?.fontSize ?? Text.DefaultFontSize;
            const targetHeight = Math.ceil(Math.max(fontsize, layout.contentHeight));
            op.shapeModifyWH(page, _shape, shape.size.width, targetHeight);
            const verAlign = shape.text.attr?.verAlign ?? TextVerAlign.Top;
            if (verAlign === TextVerAlign.Middle) {
                fixTransform(0, (_shape.size.height - targetHeight) / 2);
            } else if (verAlign === TextVerAlign.Bottom) {
                fixTransform(0, (_shape.size.height - targetHeight));
            }
            break;
        }
        case TextBehaviour.Flexible: {
            const layout = shape.getLayout();
            const targetWidth = Math.ceil(layout.contentWidth);
            const targetHeight = Math.ceil(layout.contentHeight);
            const verAlign = shape.text.attr?.verAlign ?? TextVerAlign.Top;
            if (verAlign === TextVerAlign.Middle) {
                fixTransform(0, (_shape.size.height - targetHeight) / 2);
            } else if (verAlign === TextVerAlign.Bottom) {
                fixTransform(0, (_shape.size.height - targetHeight));
            }
            for (let i = 0, pc = shape.text.paras.length; i < pc; i++) {
                const para = shape.text.paras[i];
                const horAlign = para.attr?.alignment ?? TextHorAlign.Left;
                if (targetWidth === Math.ceil(layout.paras[i].paraWidth)) {
                    if (horAlign === TextHorAlign.Centered) {
                        fixTransform((_shape.size.width - targetWidth) / 2, 0);
                    } else if (horAlign === TextHorAlign.Right) {
                        fixTransform(_shape.size.width - targetWidth, 0);
                    }
                }
            }
            op.shapeModifyWH(page, _shape, targetWidth, targetHeight);
            break;
        }
    }

    function fixTransform(offsetX: number, offsetY: number) {
        const targetXY = _shape.transform.computeCoord(offsetX, offsetY)
        const dx = targetXY.x - _shape.transform.translateX;
        const dy = targetXY.y - _shape.transform.translateY;
        if (dx || dy) {
            const trans = _shape.transform.clone().trans(dx, dy)
            op.shapeModifyTransform(page, _shape, trans);
        }
    }
}

export function fixTableShapeFrameByLayout(op: Operator, page: Page, shape: TableCellView | TableCell, table: TableView) {
    if (!shape.text || shape.isVirtualShape) return;
    // const table = shape.parent as TableView;
    const indexCell = table.indexOfCell(shape);
    if (!indexCell) return;

    const rowSpan = Math.max(shape.rowSpan ?? 1, 1);
    const colSpan = Math.max(shape.colSpan ?? 1, 1);

    let widthWeight = table.colWidths[indexCell.colIdx].value;
    for (let i = 1; i < colSpan; ++i) {
        widthWeight += table.colWidths[indexCell.colIdx + i].value;
    }
    let heightWeight = table.rowHeights[indexCell.rowIdx].value;
    for (let i = 1; i < rowSpan; ++i) {
        heightWeight += table.rowHeights[indexCell.rowIdx + i].value;
    }

    const width = widthWeight / table.widthTotalWeights * table.frame.width;
    const height = heightWeight / table.heightTotalWeights * table.frame.height;
    // shape.text.updateSize(width, height);
    const layout = shape.text.getLayout2(new ShapeFrame(0, 0, width, height)); // 按理这里应该取的是个已有的layout
    if (layout.contentHeight > (height + float_accuracy)) {
        // set row height
        const rowIdx = indexCell.rowIdx + rowSpan - 1;
        const curHeight = table.rowHeights[rowIdx].value / table.heightTotalWeights * table.frame.height;
        const weight = (curHeight + layout.contentHeight - height) / curHeight * table.rowHeights[rowIdx].value;
        op.tableModifyRowHeight(page, table.data, rowIdx, weight);
        op.shapeModifyWH(page, table.data, table.frame.width, table.frame.height + layout.contentHeight - height);
    }
}

export function find_state_space(union: SymbolShape) {
    if (!(union instanceof SymbolUnionShape)) return;
    const childs = union.childs;
    if (!childs.length) return;
    let space_y = -1;
    let space_x = -1;
    for (let i = 0, len = childs.length; i < len; i++) {
        const child = childs[i];
        const m2p = child.matrix2Parent(), f = child.size;
        const point = [
            { x: 0, y: 0 },
            { x: f.width, y: 0 },
            { x: f.width, y: f.height },
            { x: 0, y: f.height }
        ].map(p => m2p.computeCoord3(p));
        for (let j = 0; j < 4; j++) {
            if (point[j].x > space_x) space_x = point[j].x;
            if (point[j].y > space_y) space_y = point[j].y;
        }
    }
    return { x: space_x, y: space_y };
}

export function modify_frame_after_inset_state(page: Page, op: Operator, union: SymbolShape) {
    const space = find_state_space(union)
    if (!space) return;
    const delta_x = union.size.width - space.x;
    const delta_y = union.size.height - space.y;
    if (delta_x <= 0) {
        op.shapeModifyWidth(page, union, union.size.width - delta_x + 20)
    }
    if (delta_y <= 0) {
        op.shapeModifyHeight(page, union, union.size.height - delta_y + 20)
    }
}

/**
 * @description 根据属性值，为可变组件命名
 * @param symbol
 */
export function gen_name_for_state(symbol: SymbolShape) {
    if (!symbol.parent) return false;
    if (!(symbol.parent instanceof SymbolUnionShape)) return false;
    if (!symbol.parent.variables) return false;
    if (!symbol.symtags) return false;
    const variables = symbol.parent.variables as BasicMap<string, Variable>;
    let name_slices: string[] = [];
    variables.forEach((v, k) => {
        if (v.type !== VariableType.Status) return;
        const slice = symbol.symtags?.get(k) || v.value;
        slice && name_slices.push(slice);
    })
    return name_slices.toString();
}

/**
 * @description 初始化可变组件的属性值，使该可变组件的属性值与其余可变组件不同、给可变组件命名
 */
export function init_state(op: Operator, page: Page, symbol: SymbolShape, dlt: string) {
    if (!symbol.parent) return;
    const union = symbol.parent as SymbolShape;
    if (!union.variables) return;
    const variables: Variable[] = Array.from(union.variables.values());
    for (let i = 0, len = variables.length; i < len; i++) {
        const v = variables[i];
        if (v.type !== VariableType.Status) continue;
        const special_name = gen_special_value_for_state(symbol, v, dlt) || dlt;
        op.shapeModifyVartag(page, symbol, v.id, special_name);
        break;
    }
    const name = gen_name_for_state(symbol);
    if (!name) return;
    op.shapeModifyName(page, symbol, name);
}

export function gen_special_value_for_state(symbol: SymbolShape, variable: Variable, dlt: string) {
    if (!symbol.parent) return false;
    if (!(symbol.parent as SymbolShape).variables) return false;
    const bros: SymbolShape[] = (symbol.parent as SymbolShape).childs as unknown as SymbolShape[];
    let index = 2, type_name = dlt, max = 2;
    const reg = new RegExp(`^${dlt}[0-9]*$`), number_set: Set<number> = new Set();
    for (let i = 0, len = bros.length; i < len; i++) {
        const n = bros[i].symtags?.get(variable.id);
        if (n && reg.test(n)) {
            const num = Number(n.split(dlt)[1]);
            number_set.add(num);
            if (num > max) max = num;
        }
    }
    while (index <= max) {
        if (!number_set.has(index)) break;
        index++;
    }
    return `${type_name}${index}`;
}

export function make_union(op: Operator, document: Document, page: Page, symbol: SymbolShape, attri_name: string) {
    const p = symbol.parent;
    if (!p || (p instanceof SymbolUnionShape)) {
        return false;
    }

    const symIndex = (p as GroupShape).indexOfChild(symbol);
    if (symIndex < 0) {
        return false;
    }

    const box = symbol.boundingBox();
    const state_frame = new ShapeFrame(box.x - 20, box.y - 20, box.width + 40, box.height + 40);

    let union = newSymbolShapeUnion(symbol.name, state_frame, document.stylesMgr);

    const _origin_vars = symbol.variables;
    _origin_vars.forEach((v, k) => {
        union.variables.set(k, v);
    });

    union.fixedRadius = 4;
    const side = new BorderSideSetting(SideType.Normal, 2, 2, 2, 2);
    const border_style = new BorderStyle(5, 5);

    const strokePaints = new BasicArray<Fill>();
    const strokePaint = new Fill([0] as BasicArray<number>, uuid(), true, types.FillType.SolidColor, new Color(1, 127, 88, 249))
    strokePaints.push(strokePaint);
    const border = new Border(BorderPosition.Inner, border_style, types.CornerType.Miter, side, strokePaints);
    union.style.borders = border;

    const _var = new Variable(uuid(), VariableType.Status, attri_name, SymbolShape.Default_State); // default
    union.variables.set(_var.id, _var);

    const insert_result = op.shapeInsert(document, page, p as GroupShape, union, symIndex);
    if (!insert_result) {
        return false;
    }

    symbol.variables.forEach((_, k) => {
        op.shapeRemoveVariable(page, symbol, k);
    });

    union = insert_result as SymbolUnionShape;

    op.shapeMove(page, p as GroupShape, symIndex + 1, union, 0);
    op.shapeModifyXY(page, symbol, 20, 20);

    return union;
}

/**
 * @description 判断可变组件state是否为默认可变组件
 */
export function is_default_state(state: SymbolShape) {
    const parent = state.parent;
    if (!parent || !(parent instanceof SymbolUnionShape)) return false;
    const children = (parent as SymbolShape).childs;
    return children[0]?.id === state.id;
}


/**
 * @description 是否为可变组件
 * @param shape
 */
export function is_state(shape: Shape | ShapeView) {
    return shape.type === ShapeType.Symbol && (shape?.parent instanceof SymbolUnionShape);
}

function is_sym(shape: Shape | ShapeView) {
    return shape.type === ShapeType.Symbol;
}

/**
 * @description 仅为组件(不是union)
 * @param shape
 */
export function is_symbol_but_not_union(shape: Shape) {
    return shape.type === ShapeType.Symbol && !(shape instanceof SymbolUnionShape);
}

/**
 * @description 给一个变量的id(varid)，当前以组件(symbol)为范围查看有多少图层绑定了这个变量
 */
export function find_layers_by_varid(symbol: SymbolShape, var_id: string, type: OverrideType) {
    const shapes: Shape[] = [];
    if (symbol instanceof SymbolUnionShape) { // 存在可变组件
        const children = symbol.childs;
        for (let i = 0, len = children.length; i < len; i++) {
            const group = children[i];
            get_x_type_option(symbol, group, get_vt_by_ot(type)!, var_id, shapes);
        }
    } else { // 不存在可变组件
        get_x_type_option(symbol, symbol, get_vt_by_ot(type)!, var_id, shapes);
    }
    return shapes;
}

/**
 * @description 给一个图层，返回这个图层所在的组件，如果不是组件内的图层，则return undefined;
 */
export function get_symbol_by_layer(layer: ShapeView | Shape): SymbolShape | undefined {
    let s: Shape | ShapeView | undefined = layer;
    while (s && !is_sym(s)) {
        s = s.parent;
    }
    if (s) return is_state(s) ? s.parent as SymbolShape : s as SymbolShape;
}

function de_check(item: Shape) {
    return !(item as any).childs?.length || item.type === ShapeType.Table || item.type === ShapeType.SymbolRef
}

function is_bind_x_type_var(symbol: SymbolShape, shape: Shape, type: OverrideType, vari: string, container: Shape[]) {
    if (!shape.varbinds) return;
    shape.varbinds.forEach((v, k) => {
        if (!symbol.variables?.get(v)) return;
        if (vari === v) {
            container.push(shape);
            return;
        }
    })
}

function get_target_type_by_vt(vt: VariableType) {
    if (vt === VariableType.SymbolRef) return ShapeType.SymbolRef;
    if (vt === VariableType.Text) return ShapeType.Text;
}

function get_ot_by_vt(vt: VariableType) {
    if (vt === VariableType.SymbolRef) return OverrideType.SymbolID;
    if (vt === VariableType.Text) return OverrideType.Text;
}

function get_vt_by_ot(ot: OverrideType) {
    if (ot === OverrideType.Visible) return VariableType.Visible;
    if (ot === OverrideType.Text) return VariableType.Text;
    if (ot === OverrideType.SymbolID) return VariableType.SymbolRef;
}

function get_x_type_option(symbol: Shape, group: Shape, type: VariableType, variId: string, container: Shape[]) {
    const childs = (group as GroupShape).childs;
    if (!childs?.length) return;
    if (type === VariableType.Visible) {
        for (let i = 0, len = childs.length; i < len; i++) {
            const item = childs[i];
            is_bind_x_type_var(symbol as SymbolShape, item, OverrideType.Visible, variId, container);
            if ((item as GroupShape).childs && (item as GroupShape).childs.length && item.type !== ShapeType.Table) {
                get_x_type_option(symbol, item, type, variId, container)
            }
        }
    } else {
        if (de_check(group)) return;
        for (let i = 0, len = childs.length; i < len; i++) {
            const item = childs[i];
            if (item.type === get_target_type_by_vt(type)) {
                is_bind_x_type_var(symbol as SymbolShape, item, get_ot_by_vt(type)!, variId, container)
            } else if ((item as GroupShape).childs && (item as GroupShape).childs.length && item.type !== ShapeType.Table) {
                get_x_type_option(symbol, item, type, variId, container)
            }
        }
    }
}

/**
 * @description 删除图层在组件身上留下的影响
 */
export function clear_binds_effect(_page: PageView | Page, shape: ShapeView | Shape, symbol: SymbolShape, op: Operator) {
    const page = _page instanceof Page ? _page : _page.data;
    if (!shape.varbinds) return;
    const v1 = shape.varbinds.get(OverrideType.Visible);
    if (v1) {
        const layers = find_layers_by_varid(symbol, v1, OverrideType.Visible);
        if (layers.length < 2) op.shapeRemoveVariable(page, symbol, v1);
    }
    const v2 = shape.varbinds.get(OverrideType.SymbolID);
    if (v2) {
        const layers = find_layers_by_varid(symbol, v2, OverrideType.SymbolID);
        if (layers.length < 2) op.shapeRemoveVariable(page, symbol, v2);
    }
    const v3 = shape.varbinds.get(OverrideType.Text);
    if (v3) {
        const layers = find_layers_by_varid(symbol, v3, OverrideType.Text);
        if (layers.length < 2) op.shapeRemoveVariable(page, symbol, v3);
    }
}

export function modify_index(parent: GroupShape, s1: Shape, s2: Shape, index: number) {
    return (parent.indexOfChild(s1) < parent.indexOfChild(s2)) ? index - 1 : index;
}

export function after_remove(parent: GroupShape | ShapeView) {
    return parent instanceof Shape ? (((parent?.type === ShapeType.Group) || (parent instanceof SymbolUnionShape)) && !parent?.childs?.length) :
        (((parent?.type === ShapeType.Group) || (parent.data instanceof SymbolUnionShape)) && !(parent?.data as GroupShape).childs?.length);
}