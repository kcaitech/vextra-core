import { float_accuracy } from "../basic/consts";
import { TableShape, Page, Shape, Style, TextBehaviour, Text, TextShape, TableCell, SymbolShape } from "../data/classes";

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