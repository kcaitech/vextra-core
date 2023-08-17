import { Text } from "../../data/text";
import { TableCell, TableCellType, TableShape } from "../../data/table";
import { Border, Color, Fill, Page, ShapeFrame, ShapeType, StrikethroughType, Style, TextAttr, TextHorAlign, TextTransformType, TextVerAlign, UnderlineType } from "../../data/classes";
import { uuid } from "../../basic/uuid";
import { BasicArray } from "../../data/basic";

export function tableSetCellContentType(cell: TableCell, contentType: TableCellType | undefined) {
    cell.setContentType(contentType);
}

export function tableSetCellContentText(cell: TableCell, text: Text | undefined) {
    cell.setContentText(text);
}

export function tableSetCellContentImage(cell: TableCell, ref: string | undefined) {
    cell.setContentImage(ref);
}

export function tableModifyColWidth(table: TableShape, idx: number, width: number) {
    table.setColWidth(idx, width);
}

export function tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number) {
    table.setRowHeight(idx, height);
}

export function tableInsertRow(page: Page, table: TableShape, idx: number, height: number, data: TableCell[]) {
    table.insertRow(idx, height, data);
    data.forEach((cell) => {
        page.onAddShape(cell);
    })
}

export function tableRemoveRow(table: TableShape, idx: number) {
    return table.removeRow(idx);
}

export function tableInsertCol(page: Page, table: TableShape, idx: number, width: number, data: TableCell[]) {
    table.insertCol(idx, width, data);
    data.forEach((cell) => {
        page.onAddShape(cell);
    })
}

export function tableRemoveCol(table: TableShape, idx: number) {
    return table.removeCol(idx);
}

export function tableModifyCellSpan(cell: TableCell, rowSpan: number | undefined, colSpan: number | undefined) {
    cell.setCellSpan(rowSpan, colSpan);
}

// text
export function tableModifyTextColor(table: TableShape, color: Color | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.color = color;
}
export function tableModifyTextHighlightColor(table: TableShape, color: Color | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.highlight = color;
}
export function tableModifyTextFontName(table: TableShape, fontName: string) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.fontName = fontName;
}
export function tableModifyTextFontSize(table: TableShape, fontSize: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.fontSize = fontSize;
}
export function tableModifyTextVerAlign(table: TableShape, verAlign: TextVerAlign) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.verAlign = verAlign;
}
export function tableModifyTextHorAlign(table: TableShape, horAlign: TextHorAlign) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.alignment = horAlign;
}
export function tableModifyTextMinLineHeight(table: TableShape, lineHeight: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.minimumLineHeight = lineHeight;
}
export function tableModifyTextMaxLineHeight(table: TableShape, lineHeight: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.maximumLineHeight = lineHeight;
}
export function tableModifyTextKerning(table: TableShape, kerning: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.kerning = kerning;
}
export function tableModifyTextParaSpacing(table: TableShape, paraSpacing: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.paraSpacing = paraSpacing;
}
export function tableModifyTextUnderline(table: TableShape, underline: UnderlineType | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.underline = underline;
}
export function tableModifyTextStrikethrough(table: TableShape, strikethrough: StrikethroughType | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.strikethrough = strikethrough;
}
export function tableModifyTextBold(table: TableShape, bold: boolean) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.bold = bold;
}
export function tableModifyTextItalic(table: TableShape, italic: boolean) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.italic = italic;
}
export function tableModifyTextTransform(table: TableShape, transform: TextTransformType | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.transform = transform;
}