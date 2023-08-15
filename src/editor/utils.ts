import { TableShape, Page, Shape, Style, TextBehaviour, Text, TextShape, TableCell } from "../data/classes";

interface _Api {
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number): void;
    tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number): void;
}
const defaultFontSize = 12;
export function fixTextShapeFrameByLayout(api: _Api, page: Page, shape: TextShape) {
    const textBehaviour = shape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    switch (textBehaviour) {
        case TextBehaviour.FixWidthAndHeight: break;
        case TextBehaviour.Fixed:
            {
                const layout = shape.text.getLayout();
                const fontsize = shape.text.attr?.fontSize ?? defaultFontSize;
                api.shapeModifyWH(page, shape, shape.frame.width, Math.max(fontsize, layout.contentHeight));
                break;
            }
        case TextBehaviour.Flexible:
            {
                const layout = shape.text.getLayout();
                const fontsize = shape.text.attr?.fontSize ?? defaultFontSize;
                api.shapeModifyWH(page, shape, Math.max(fontsize, layout.contentWidth), Math.max(fontsize, layout.contentHeight));
                break;
            }
    }
}

export function fixTableShapeFrameByLayout(api: _Api, page: Page, shape: TableCell) {
    if (!shape.text) return;
    const table = shape.parent as TableShape;
    const indexCell = table.indexOfCell(shape);
    if (!indexCell || !indexCell.visible) return;

    const total = table.rowHeights.reduce((pre, cur) => pre + cur, 0);
    const rowSpan = shape.rowSpan ?? 1;
    let weight = table.rowHeights[indexCell.rowIdx];
    for (let i = 1; i < rowSpan; ++i) {
        weight += table.rowHeights[indexCell.rowIdx + i];
    }
    const height = weight / total * table.frame.height;

    const layout = shape.text.getLayout();
    if (layout.contentHeight > height) {
        // set row height
        const rowIdx = indexCell.rowIdx + rowSpan - 1;
        const curHeight = table.rowHeights[rowIdx] / total * table.frame.height;
        const weight = (curHeight + layout.contentHeight - height) / curHeight * table.rowHeights[rowIdx];
        api.tableModifyRowHeight(page, table, rowIdx, weight);
        api.shapeModifyWH(page, table, table.frame.width, table.frame.height + layout.contentHeight - height);
    }
}