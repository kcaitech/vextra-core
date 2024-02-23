import { float_accuracy } from "../../basic/consts";
import {
    Border,
    BorderPosition,
    BorderStyle,
    Color,
    Document, Fill,
    GroupShape,
    OverrideType,
    Page,
    Shape,
    ShapeFrame,
    ShapeType,
    SymbolUnionShape,
    SymbolRefShape,
    SymbolShape,
    TableCell,
    TableShape,
    Text,
    TextBehaviour,
    TextShape,
    Variable,
    VariableType,
} from "../../data/classes";
import { Api } from "../coop/recordapi";
import { BasicArray, BasicMap } from "../../data/basic";
import { newSymbolRefShape, newSymbolShape, newSymbolShapeUnion } from "../creator";
import { uuid } from "../../basic/uuid";
import * as types from "../../data/typesdefine";
import { expandTo, translateTo } from "../frame";
import { exportStyle } from "../../data/baseexport";
import { importStyle } from "../../data/baseimport";

interface _Api {
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number): void;

    tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number): void;
}

// const DefaultFontSize = Text.DefaultFontSize;

export function fixTextShapeFrameByLayout(api: _Api, page: Page, shape: TextShape) {
    const textBehaviour = shape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    switch (textBehaviour) {
        case TextBehaviour.FixWidthAndHeight:
            break;
        case TextBehaviour.Fixed: {
            const layout = shape.getLayout();
            const fontsize = shape.text.attr?.fontSize ?? Text.DefaultFontSize;
            // expandTo(api as Api, page, shape, shape.frame.width, Math.max(fontsize, layout.contentHeight));
            api.shapeModifyWH(page, shape, shape.frame.width, Math.max(fontsize, layout.contentHeight));
            break;
        }
        case TextBehaviour.Flexible: {
            const layout = shape.getLayout();
            const fontsize = shape.text.attr?.fontSize ?? Text.DefaultFontSize;
            api.shapeModifyWH(page, shape, Math.max(fontsize, layout.contentWidth), Math.max(fontsize, layout.contentHeight));
            // expandTo(api as Api, page, shape, Math.max(fontsize, layout.contentWidth), Math.max(fontsize, layout.contentHeight));
            break;
        }
    }
}

export function fixTableShapeFrameByLayout(api: _Api, page: Page, shape: TableCell) {
    if (!shape.text) return;
    const table = shape.parent as TableShape;
    const indexCell = table.indexOfCell2(shape);
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
    const layout1 = shape.text.getLayout3(width, height, shape.id, undefined); // 按理这里应该取的是个已有的layout
    shape.text.dropLayout(layout1.token, shape.id);
    const layout = layout1.layout;
    if (layout.contentHeight > (height + float_accuracy)) {
        // set row height
        const rowIdx = indexCell.rowIdx + rowSpan - 1;
        const curHeight = table.rowHeights[rowIdx].value / table.heightTotalWeights * table.frame.height;
        const weight = (curHeight + layout.contentHeight - height) / curHeight * table.rowHeights[rowIdx].value;
        api.tableModifyRowHeight(page, table, rowIdx, weight);
        api.shapeModifyWH(page, table, table.frame.width, table.frame.height + layout.contentHeight - height);
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
        const m2p = child.matrix2Parent(), f = child.frame;
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

export function modify_frame_after_inset_state(page: Page, api: Api, union: SymbolShape) {
    const space = find_state_space(union)
    if (!space) return;
    const delta_x = union.frame.width - space.x;
    const delta_y = union.frame.height - space.y;
    if (delta_x <= 0) {
        api.shapeModifyWidth(page, union, union.frame.width - delta_x + 20)
    }
    if (delta_y <= 0) {
        api.shapeModifyHeight(page, union, union.frame.height - delta_y + 20)
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
export function init_state(api: Api, page: Page, symbol: SymbolShape, dlt: string) {
    if (!symbol.parent) return;
    const union = symbol.parent as SymbolShape;
    if (!union.variables) return;
    const variables: Variable[] = Array.from(union.variables.values());
    for (let i = 0, len = variables.length; i < len; i++) {
        const v = variables[i];
        if (v.type !== VariableType.Status) continue;
        const special_name = gen_special_value_for_state(symbol, v, dlt) || dlt;
        api.shapeModifyVartag(page, symbol, v.id, special_name);
        break;
    }
    const name = gen_name_for_state(symbol);
    if (!name) return;
    api.shapeModifyName(page, symbol, name);
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

export function make_union(api: Api, page: Page, symbol: SymbolShape, attri_name: string) {
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

    let union = newSymbolShapeUnion(symbol.name, state_frame);

    const _origin_vars = symbol.variables;
    _origin_vars.forEach((v, k) => {
        union.variables.set(k, v);
    });

    union.fixedRadius = 4;

    const border_style = new BorderStyle(5, 5);
    const border = new Border(
        ([union.style.borders.length] as BasicArray<number>),
        uuid(),
        true,
        types.FillType.SolidColor,
        new Color(1, 127, 88, 249),
        BorderPosition.Inner,
        2,
        border_style
    );
    union.style.borders.push(border);

    const _var = new Variable(uuid(), VariableType.Status, attri_name, SymbolShape.Default_State); // default
    union.variables.set(_var.id, _var);

    const insert_result = api.shapeInsert(page, p as GroupShape, union, symIndex);
    if (!insert_result) {
        return false;
    }

    symbol.variables.forEach((_, k) => {
        api.shapeRemoveVariable(page, symbol, k);
    });

    union = insert_result as SymbolUnionShape;

    api.shapeMove(page, p as GroupShape, symIndex + 1, union, 0);
    api.shapeModifyX(page, symbol, 20);
    api.shapeModifyY(page, symbol, 20);

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
export function is_state(shape: Shape) {
    return shape.type === ShapeType.Symbol && (shape?.parent instanceof SymbolUnionShape);
}

function is_sym(shape: Shape) {
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
export function get_symbol_by_layer(layer: Shape): SymbolShape | undefined {
    let s: Shape | undefined = layer;
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
export function clear_binds_effect(page: Page, shape: Shape, symbol: SymbolShape, api: Api) {
    if (!shape.varbinds) return;
    const v1 = shape.varbinds.get(OverrideType.Visible);
    if (v1) {
        const layers = find_layers_by_varid(symbol, v1, OverrideType.Visible);
        if (layers.length < 2) api.shapeRemoveVariable(page, symbol, v1);
    }
    const v2 = shape.varbinds.get(OverrideType.SymbolID);
    if (v2) {
        const layers = find_layers_by_varid(symbol, v2, OverrideType.SymbolID);
        if (layers.length < 2) api.shapeRemoveVariable(page, symbol, v2);
    }
    const v3 = shape.varbinds.get(OverrideType.Text);
    if (v3) {
        const layers = find_layers_by_varid(symbol, v3, OverrideType.Text);
        if (layers.length < 2) api.shapeRemoveVariable(page, symbol, v3);
    }
}

/**
 * @description 整理用于创建组件的选区数据
 */
export function adjust_selection_before_group(document: Document, page: Page, shapes: Shape[], api: Api, need_trans_data: Shape[]) {
    for (let i = 0, l = shapes.length; i < l; i++) {
        let shape = shapes[i];
        if (shape.type === ShapeType.Symbol) {
            need_trans_data.push(shape);
            const parent: GroupShape | undefined = shape.parent as GroupShape;
            if (!parent) throw new Error('wrong data: invaild parent');
            const insert_index = parent.indexOfChild(shape);
            api.shapeMove(page, parent, insert_index, page, page.childs.length); // 把组件移到页面下
            if (shape instanceof SymbolUnionShape) continue;
            const { x, y, width, height } = shape.frame;
            const f = new ShapeFrame(x, y, width, height);
            const refShape: SymbolRefShape = newSymbolRefShape(shape.name, f, shape.id, document.symbolsMgr);
            shapes[i] = api.shapeInsert(page, parent, refShape, insert_index) as SymbolRefShape;
            continue;
        }
        const childs = (shape as GroupShape).childs;
        if (shape.type === ShapeType.Table || !childs?.length) continue;
        handler_childs(document, page, (shape as GroupShape).childs, api, need_trans_data);
    }
}

function handler_childs(document: Document, page: Page, shapes: Shape[], api: Api, need_trans_data: Shape[]) {
    for (let i = 0, l = shapes.length; i < l; i++) {
        let shape = shapes[i];
        if (shape.type === ShapeType.Symbol) {
            need_trans_data.push(shape);
            const parent: GroupShape | undefined = shape.parent as GroupShape;
            if (!parent) throw new Error('wrong data: invaild parent');
            const insert_index = parent.indexOfChild(shape);
            api.shapeMove(page, parent, insert_index, page, page.childs.length); // 把组件移到页面下
            if (shape instanceof SymbolUnionShape) continue;
            const { x, y, width, height } = shape.frame;
            const f = new ShapeFrame(x, y, width, height);
            const refShape: SymbolRefShape = newSymbolRefShape(shape.name, f, shape.id, document.symbolsMgr);
            api.shapeInsert(page, parent, refShape, insert_index) as SymbolRefShape;
            continue;
        }
        const childs = (shape as GroupShape).childs;
        if (shape.type === ShapeType.Table || !childs?.length) continue;
        handler_childs(document, page, (shape as GroupShape).childs, api, need_trans_data);
    }
}

export function trans_after_make_symbol(page: Page, symbol: SymbolShape, need_trans_data: Shape[], api: Api) {
    const p = symbol.parent;
    if (!p) return;
    const p2r = p.matrix2Root();
    const box = symbol.boundingBox();
    const right = p2r.computeCoord2(box.x + box.width, box.y).x;

    for (let i = 0, l = need_trans_data.length; i < l; i++) {
        const s = need_trans_data[i];
        const lt = s.matrix2Root().computeCoord2(0, 0);
        translateTo(api, page, s, right + 36, lt.y);
    }
}

export function modify_index(parent: GroupShape, s1: Shape, s2: Shape, index: number) {
    return (parent.indexOfChild(s1) < parent.indexOfChild(s2)) ? index - 1 : index;
}

export function after_remove(parent: GroupShape) {
    return ((parent?.type === ShapeType.Group) || (parent instanceof SymbolUnionShape)) && !parent?.childs?.length;
}