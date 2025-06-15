/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { TableCell, TableCellType, TableShape } from "../../data/table";
import { Border, BorderPosition, BorderSideSetting, BorderStyle, Color, CornerType, CrdtNumber, Fill, FillType, Gradient, Page, ShapeSize, ShapeType, SideType, StrikethroughType, Style, TextAttr, TextHorAlign, TextTransformType, TextVerAlign, Transform, UnderlineType } from "../../data/classes";
import { crdtArrayInsert, crdtArrayRemove, crdtSetAttr } from "./basic";
import { uuid } from "../../basic/uuid";
import { BasicArray } from "../../data/basic";
import { Op } from "../basic/op";
import { newTableCellText } from "../../data/text/textutils";

export function tableInitCell(table: TableShape, rowIdx: number, colIdx: number) {
    const cellId = table.rowHeights[rowIdx].id + "," + table.colWidths[colIdx].id;
    if (table.cells.has(cellId)) return;
    const size = new ShapeSize();
    const trans = new Transform();
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(BorderPosition.Inner, new BorderStyle(0, 0), CornerType.Miter, side, strokePaints);
    const cell = new TableCell(new BasicArray(),
        cellId,
        "",
        ShapeType.TableCell,
        trans,
        new Style(new BasicArray(), new BasicArray(), border),
        TableCellType.Text,
        newTableCellText(table.textAttr));
    return crdtSetAttr(table.cells, cellId, cell);
}

export function tableSetCellContentType(cell: TableCell, contentType: TableCellType | undefined) {
    contentType = contentType === TableCellType.None ? undefined : contentType;
    if (cell.cellType === contentType) return;
    return crdtSetAttr(cell, "cellType", contentType);
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

export function tableInsertRow(table: TableShape, idx: number, height: number) {
    return crdtArrayInsert(table.rowHeights, idx, new CrdtNumber(uuid(), new BasicArray(), height))
}

export function tableRemoveRow(table: TableShape, idx: number) {
    // remove cells
    const rowId = table.rowHeights[idx].id;
    const cellIds: string[] = [];
    table.cells.forEach((_, cellId) => {
        if (cellId.startsWith(rowId)) cellIds.push(cellId);
    });
    const ops: Op[] = cellIds.map(cellId => crdtSetAttr(table.cells, cellId, undefined));
    const op = crdtArrayRemove(table.rowHeights, idx);
    if (op) ops.push(op);
    return ops;
}

export function tableInsertCol(table: TableShape, idx: number, width: number) {
    return crdtArrayInsert(table.colWidths, idx, new CrdtNumber(uuid(), new BasicArray(), width))
}

export function tableRemoveCol(table: TableShape, idx: number) {
    // remove cells
    const colId = table.colWidths[idx].id;
    const cellIds: string[] = [];
    table.cells.forEach((_, cellId) => {
        if (cellId.endsWith(colId)) cellIds.push(cellId);
    });
    const ops: Op[] = cellIds.map(cellId => crdtSetAttr(table.cells, cellId, undefined));
    const op = crdtArrayRemove(table.colWidths, idx);
    if (op) ops.push(op);
    return ops;
}

export function tableModifyCellSpan(cell: TableCell, rowSpan: number | undefined, colSpan: number | undefined) {
    // cell!.setCellSpan(rowSpan, colSpan);
    rowSpan = rowSpan && rowSpan <= 1 ? undefined : rowSpan;
    colSpan = colSpan && colSpan <= 1 ? undefined : colSpan;
    return [crdtSetAttr(cell, "rowSpan", rowSpan), crdtSetAttr(cell, "colSpan", colSpan)]
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

export function tableModifyTextAutoLineHeight(table: TableShape, autoLineHeight: boolean) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "autoLineHeight", autoLineHeight);
}

export function tableModifyTextMinLineHeight(table: TableShape, lineHeight: number | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "minimumLineHeight", lineHeight);
}

export function tableModifyTextMaxLineHeight(table: TableShape, lineHeight: number | undefined) {
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
export function tableModifyTextWeight(table: TableShape, weight: number) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "weight", weight);
}

export function tableModifyTextItalic(table: TableShape, italic: boolean) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "italic", italic);
}

export function tableModifyTextTransform(table: TableShape, transform: TextTransformType | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "transform", transform);
}

export function tableModifyTextFillType(table: TableShape, filltype: FillType | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "filltype", filltype);
}

export function tableModifyTextGradient(table: TableShape, gradient: Gradient | undefined) {
    if (!table.textAttr) table.textAttr = new TextAttr();
    return crdtSetAttr(table.textAttr, "gradient", gradient);
}