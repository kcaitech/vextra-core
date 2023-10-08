import { float_accuracy } from "../basic/consts";
import { TableShape, Page, Shape, Style, TextBehaviour, Text, TextShape, TableCell, SymbolShape, SymbolRefShape, ShapeType } from "../data/classes";
import { Api } from "./command/recordapi";

interface _Api {
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number): void;
    tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number): void;
}
const DefaultFontSize = Text.DefaultFontSize;
export function fixTextShapeFrameByLayout(api: _Api, page: Page, shape: TextShape) {
    const textBehaviour = shape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    switch (textBehaviour) {
        case TextBehaviour.FixWidthAndHeight: break;
        case TextBehaviour.Fixed:
            {
                const layout = shape.text.getLayout();
                const fontsize = shape.text.attr?.fontSize ?? DefaultFontSize;
                api.shapeModifyWH(page, shape, shape.frame.width, Math.max(fontsize, layout.contentHeight));
                break;
            }
        case TextBehaviour.Flexible:
            {
                const layout = shape.text.getLayout();
                const fontsize = shape.text.attr?.fontSize ?? DefaultFontSize;
                api.shapeModifyWH(page, shape, Math.max(fontsize, layout.contentWidth), Math.max(fontsize, layout.contentHeight));
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

    let widthWeight = table.colWidths[indexCell.colIdx];
    for (let i = 1; i < colSpan; ++i) {
        widthWeight += table.colWidths[indexCell.colIdx + i];
    }
    let heightWeight = table.rowHeights[indexCell.rowIdx];
    for (let i = 1; i < rowSpan; ++i) {
        heightWeight += table.rowHeights[indexCell.rowIdx + i];
    }

    const width = widthWeight / table.widthTotalWeights * table.frame.width;
    const height = heightWeight / table.heightTotalWeights * table.frame.height;
    shape.text.updateSize(width, height);
    const layout = shape.text.getLayout();
    if (layout.contentHeight > (height + float_accuracy)) {
        // set row height
        const rowIdx = indexCell.rowIdx + rowSpan - 1;
        const curHeight = table.rowHeights[rowIdx] / table.heightTotalWeights * table.frame.height;
        const weight = (curHeight + layout.contentHeight - height) / curHeight * table.rowHeights[rowIdx];
        api.tableModifyRowHeight(page, table, rowIdx, weight);
        api.shapeModifyWH(page, table, table.frame.width, table.frame.height + layout.contentHeight - height);
    }
}
export function find_state_space(union: SymbolShape) {
    if (!union.isUnionSymbolShape) return -1;
    const childs = union.childs;
    if (!childs.length) return -1;
    let y = -1;
    for (let i = 0, len = childs.length; i < len; i++) {
        const child = childs[i];
        const m2p = child.matrix2Parent(), f = child.frame;
        const point = [{ x: 0, y: 0 }, { x: f.width, y: 0 }, { x: f.width, y: f.height }, { x: 0, y: f.height }].map(p => m2p.computeCoord3(p));
        for (let j = 0; j < 4; j++) {
            if (point[j].y > y) y = point[j].y;
        }
    }
    return y;
}
export function modify_frame_after_inset_state(page: Page, api: Api, union: SymbolShape) {
    const y = find_state_space(union);
    const delta = union.frame.height - y;
    if (delta <= 0) {
        api.shapeModifyHeight(page, union, union.frame.height - delta + 20)
    }
}
function get_topology_map(shape: Shape, init?: { shape: string, ref: string }[]) {
    let deps: { shape: string, ref: string }[] = init || [];
    const childs = shape.type === ShapeType.SymbolRef ? shape.naviChilds : shape.childs;
    if (!childs || childs.length === 0) return [];
    for (let i = 0, len = childs.length; i < len; i++) {
        const child = childs[i];
        deps.push({ shape: shape.id, ref: childs[i].type === ShapeType.SymbolRef ? childs[i].refId : childs[i].id });
        const c_childs = child.type === ShapeType.SymbolRef ? child.naviChilds : child.childs;
        if (c_childs && c_childs.length) deps = [...get_topology_map(child, deps)];
    }
    return deps;
}

function filter_deps(deps: { shape: string, ref: string }[], key1: 'shape' | 'ref', key2: 'shape' | 'ref') {
    const result: { shape: string, ref: string }[] = [];
    const _checked: Set<string> = new Set();
    const _checked_invalid: Set<string> = new Set();
    for (let i = 0, len = deps.length; i < len; i++) {
        const d = deps[i];
        if (_checked.has(d[key1])) {
            result.push(d);
            continue;
        }
        if (_checked_invalid.has(d[key1])) continue;
        let invalid: boolean = true;
        for (let j = 0, len = deps.length; j < len; j++) {
            if (deps[j][key2] === d[key1]) {
                result.push(d);
                _checked.add(d[key1]);
                invalid = false;
                break;
            }
        }
        if (invalid) _checked_invalid.add(d[key1]);
    }
    return result;
}
/**
 * @description 检查symbol与ref之间是否存在循环引用
 * @param symbol 任意存在子元素的图形
 * @param ref 想去引用的组件
 * @returns 
 */
export function is_circular_ref(symbol: Shape, ref: SymbolRefShape): boolean {
    let deps: { shape: string, ref: string }[] = [...get_topology_map(symbol), { shape: symbol.id, ref: ref.refId }];
    if (deps.length < 2) return false;
    // 过滤左侧
    deps = filter_deps(deps, 'shape', 'ref');
    // 过滤右侧
    deps = filter_deps(deps, 'ref', 'shape');
    return !!deps.length;
}
