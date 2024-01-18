import { Text } from "../../data/text";
import { TableCell, TableCellType, TableShape } from "../../data/table";
import { Color, CrdtIndex, CrdtNumber, Page, StrikethroughType, TextAttr, TextHorAlign, TextTransformType, TextVerAlign, UnderlineType } from "../../data/classes";
import { crdtArrayInsert, crdtArrayRemove, crdtSetAttr, newText } from "./basic";
import { deleteText, insertComplexText } from "./text";
import { uuid } from "../../basic/uuid";

export function tableSetCellContentType(cell: TableCell, contentType: TableCellType | undefined) {
    contentType = contentType === TableCellType.None ? undefined : contentType;
    return crdtSetAttr(cell, "cellType", contentType);
}

export function tableSetCellContentText(cell: TableCell, text: Text | undefined) {
    // 不可以重置text
    if (!cell.text) cell.text = newText("");
    let ops = [];
    if (cell.text.length > 1) {
        const op = deleteText(cell, cell.text, 0, cell.text.length - 1);
        if (op) ops.push(op);
    }
    if (text) {
        const op = insertComplexText(cell, cell.text, text, 0);
        if (op) ops.push(op);
    }
    return ops;
}

export function tableSetCellContentImage(cell: TableCell, ref: string | undefined) {
    return crdtSetAttr(cell, "imageRef", ref);
}

export function tableModifyColWidth(page: Page, table: TableShape, idx: number, width: number) {
    const colWidths = table.colWidths;
    return colWidths[idx] && crdtSetAttr(colWidths[idx], "value", width); // todo table layout
}

export function tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number) {
    // table.setRowHeight(idx, height);
    const rowHeights = table.rowHeights;
    return rowHeights[idx] && crdtSetAttr(rowHeights[idx], "value", height);
}

export function tableInsertRow(uid: string, table: TableShape, idx: number, height: number) {
    return crdtArrayInsert(uid, table.rowHeights, idx, new CrdtNumber(uuid(), new CrdtIndex("", 0, ""), height))
}

export function tableRemoveRow(uid: string, table: TableShape, idx: number) {
    return crdtArrayRemove(uid, table.rowHeights, idx);
}

export function tableInsertCol(uid: string, table: TableShape, idx: number, width: number) {
    return crdtArrayInsert(uid, table.colWidths, idx, new CrdtNumber(uuid(), new CrdtIndex("", 0, ""), width))
}

export function tableRemoveCol(uid: string, table: TableShape, idx: number) {
    return crdtArrayRemove(uid, table.colWidths, idx);
}

export function tableModifyCellSpan(cell: TableCell, rowSpan: number | undefined, colSpan: number | undefined) {
    // cell!.setCellSpan(rowSpan, colSpan);
    rowSpan = rowSpan && rowSpan <= 1 ? undefined : rowSpan;
    colSpan = colSpan && colSpan <= 1 ? undefined : colSpan;
    return [ crdtSetAttr(cell, "rowSpan", rowSpan), crdtSetAttr(cell, "colSpan", colSpan) ]
}

// text
export function tableModifyTextColor(table: TableShape, color: Color | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "color", color);
}
export function tableModifyTextHighlightColor(table: TableShape, color: Color | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "highlight", color);
}
export function tableModifyTextFontName(table: TableShape, fontName: string | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "fontName", fontName);
}
export function tableModifyTextFontSize(table: TableShape, fontSize: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "fontSize", fontSize);
}
export function tableModifyTextVerAlign(table: TableShape, verAlign: TextVerAlign | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "verAlign", verAlign);
}
export function tableModifyTextHorAlign(table: TableShape, horAlign: TextHorAlign) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "alignment", horAlign);
}
export function tableModifyTextMinLineHeight(table: TableShape, lineHeight: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "minimumLineHeight", lineHeight);
}
export function tableModifyTextMaxLineHeight(table: TableShape, lineHeight: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "maximumLineHeight", lineHeight);
}
export function tableModifyTextKerning(table: TableShape, kerning: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "kerning", kerning);
}
export function tableModifyTextParaSpacing(table: TableShape, paraSpacing: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "paraSpacing", paraSpacing);
}
export function tableModifyTextUnderline(table: TableShape, underline: UnderlineType | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "underline", underline);
}
export function tableModifyTextStrikethrough(table: TableShape, strikethrough: StrikethroughType | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "strikethrough", strikethrough);
}
export function tableModifyTextBold(table: TableShape, bold: boolean) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "bold", bold);
}
export function tableModifyTextItalic(table: TableShape, italic: boolean) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "italic", italic);
}
export function tableModifyTextTransform(table: TableShape, transform: TextTransformType | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "transform", transform);
}