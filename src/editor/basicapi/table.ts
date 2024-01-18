import { Para, Span, Text } from "../../data/text";
import { TableCell, TableCellType, TableShape } from "../../data/table";
import { Color, Page, StrikethroughType, TextAttr, TextHorAlign, TextTransformType, TextVerAlign, UnderlineType } from "../../data/classes";
import { crdtSetAttr } from "./basic";
import { BasicArray } from "../../data/basic";

export function tableSetCellContentType(cell: TableCell, contentType: TableCellType | undefined) {
    contentType = contentType === TableCellType.None ? undefined : contentType;
    return crdtSetAttr(cell, "cellType", contentType);
}

const newText = (content: string): Text => {
    const text = new Text(new BasicArray());
    const para = new Para(content + '\n', new BasicArray());
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    return text;
}

export function tableSetCellContentText(cell: TableCell, text: Text | undefined) {
    // todo 不可以重置text
    if (!cell.text) cell.text = newText("");
    if (cell.text.length > 1) {
        // 
    }
    cell!.setContentText(text);
}

export function tableSetCellContentImage(cell: TableCell, ref: string | undefined) {
    return crdtSetAttr(cell, "imageRef", ref);
}

export function tableModifyColWidth(page: Page, table: TableShape, idx: number, width: number) {
    table.setColWidth(idx, width);
}

export function tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number) {
    table.setRowHeight(idx, height);
}

export function tableInsertRow(page: Page, table: TableShape, idx: number, height: number, data: (TableCell | undefined)[]) {
    table.insertRow(idx, height, data);
    // data.forEach((cell) => {
    //     if (cell) page.onAddShape(cell);
    // })
}

export function tableRemoveRow(page: Page, table: TableShape, idx: number) {
    const ret = table.removeRow(idx);
    // ret.forEach((cell) => {
    //     if (cell) page.onRemoveShape(cell);
    // })
    return ret;
}

export function tableInsertCol(page: Page, table: TableShape, idx: number, width: number, data: (TableCell | undefined)[]) {
    table.insertCol(idx, width, data);
    // data.forEach((cell) => {
    //     if (cell) page.onAddShape(cell);
    // })
}

export function tableRemoveCol(page: Page, table: TableShape, idx: number) {
    const ret = table.removeCol(idx);
    // ret.forEach((cell) => {
    //     if (cell) page.onRemoveShape(cell);
    // })
    return ret;
}

export function tableModifyCellSpan(cell: TableCell, rowSpan: number | undefined, colSpan: number | undefined) {
    // const cell = table.getCellAt(rowIdx, colIdx, true);
    cell!.setCellSpan(rowSpan, colSpan);
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
export function tableModifyTextFontName(table: TableShape, fontName: string | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.fontName = fontName;
}
export function tableModifyTextFontSize(table: TableShape, fontSize: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    table.textAttr.fontSize = fontSize;
}
export function tableModifyTextVerAlign(table: TableShape, verAlign: TextVerAlign | undefined) {
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