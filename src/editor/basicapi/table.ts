import { Text } from "../../data/text";
import { TableCell, TableCellType, TableShape } from "../../data/table";
import { Color, Page, StrikethroughType, TextAttr, TextHorAlign, TextTransformType, TextVerAlign, UnderlineType } from "../../data/classes";

export function tableSetCellContentType(table: TableShape, rowIdx: number, colIdx: number, contentType: TableCellType | undefined) {
    const cell = table.getCellAt(rowIdx, colIdx, true);
    cell!.setContentType(contentType);
}

export function tableSetCellContentText(table: TableShape, rowIdx: number, colIdx: number, text: Text | undefined) {
    const cell = table.getCellAt(rowIdx, colIdx, true);
    cell!.setContentText(text);
}

export function tableSetCellContentImage(table: TableShape, rowIdx: number, colIdx: number, ref: string | undefined) {
    const cell = table.getCellAt(rowIdx, colIdx, true);
    cell!.setContentImage(ref);
}

export function tableModifyColWidth(page: Page, table: TableShape, idx: number, width: number) {
    table.setColWidth(idx, width);
}

export function tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number) {
    table.setRowHeight(idx, height);
}

export function tableInsertRow(page: Page, table: TableShape, idx: number, height: number, data: (TableCell | undefined)[]) {
    table.insertRow(idx, height, data);
    data.forEach((cell) => {
        if (cell) page.onAddShape(cell);
    })
}

export function tableRemoveRow(page: Page, table: TableShape, idx: number) {
    const ret = table.removeRow(idx);
    ret.forEach((cell) => {
        if (cell) page.onRemoveShape(cell);
    })
    return ret;
}

export function tableInsertCol(page: Page, table: TableShape, idx: number, width: number, data: (TableCell | undefined)[]) {
    table.insertCol(idx, width, data);
    data.forEach((cell) => {
        if (cell) page.onAddShape(cell);
    })
}

export function tableRemoveCol(page: Page, table: TableShape, idx: number) {
    const ret = table.removeCol(idx);
    ret.forEach((cell) => {
        if (cell) page.onRemoveShape(cell);
    })
    return ret;
}

export function tableModifyCellSpan(table: TableShape, rowIdx: number, colIdx: number, rowSpan: number | undefined, colSpan: number | undefined) {
    if ((rowSpan ?? 1) > 1 || (colSpan ?? 1) > 1) {
        const cell = table.getCellAt(rowIdx, colIdx, true);
        cell!.setCellSpan(rowSpan, colSpan);
    }
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