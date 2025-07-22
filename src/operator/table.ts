/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { TableCell, TableCellType, TableShape } from "../data/table";
import { Border, BorderPosition, BorderSideSetting, BorderStyle, Color, CornerType, CrdtNumber, Fill, FillType, Gradient, Page, ShapeSize, ShapeType, SideType, StrikethroughType, Style, TextAttr, TextHorAlign, TextTransformType, TextVerAlign, Transform, UnderlineType } from "../data/classes";
import { BasicArray } from "../data/basic";
import { BasicOp } from "./basicop";
import { newTableCellText } from "../data/text/textutils";
import { uuid } from "../basic/uuid";

export class TableOp {
    constructor(private _basicop: BasicOp) { }
    
    tableInitCell(table: TableShape, rowIdx: number, colIdx: number): boolean {
        const cellId = table.rowHeights[rowIdx].id + "," + table.colWidths[colIdx].id;
        if (table.cells.has(cellId)) return false;
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
        this._basicop.crdtSetAttr(table.cells, cellId, cell);
        return true;
    }
    
    tableSetCellContentType(cell: TableCell, contentType: TableCellType | undefined) {
        contentType = contentType === TableCellType.None ? undefined : contentType;
        if (cell.cellType === contentType) return;
        return this._basicop.crdtSetAttr(cell, "cellType", contentType);
    }
    
    tableSetCellContentImage(cell: TableCell, ref: string | undefined) {
        return this._basicop.crdtSetAttr(cell, "imageRef", ref);
    }
    
    tableModifyColWidth(page: Page, table: TableShape, idx: number, width: number) {
        const colWidths = table.colWidths;
        return colWidths[idx] && this._basicop.crdtSetAttr(colWidths[idx], "value", width); // todo table layout
    }
    
    tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number) {
        // table.setRowHeight(idx, height);
        const rowHeights = table.rowHeights;
        return rowHeights[idx] && this._basicop.crdtSetAttr(rowHeights[idx], "value", height);
    }
    
    tableInsertRow(table: TableShape, idx: number, height: number) {
        return this._basicop.crdtArrayInsert(table.rowHeights, idx, new CrdtNumber(uuid(), new BasicArray(), height))
    }
    
    tableRemoveRow(table: TableShape, idx: number) {
        // remove cells
        const rowId = table.rowHeights[idx].id;
        const cellIds: string[] = [];
        table.cells.forEach((_, cellId) => {
            if (cellId.startsWith(rowId)) cellIds.push(cellId);
        });
        cellIds.map(cellId => this._basicop.crdtSetAttr(table.cells, cellId, undefined));
        this._basicop.crdtArrayRemove(table.rowHeights, idx);
    }
    
    tableInsertCol(table: TableShape, idx: number, width: number) {
        return this._basicop.crdtArrayInsert(table.colWidths, idx, new CrdtNumber(uuid(), new BasicArray(), width))
    }
    
    tableRemoveCol(table: TableShape, idx: number) {
        // remove cells
        const colId = table.colWidths[idx].id;
        const cellIds: string[] = [];
        table.cells.forEach((_, cellId) => {
            if (cellId.endsWith(colId)) cellIds.push(cellId);
        });
        cellIds.map(cellId => this._basicop.crdtSetAttr(table.cells, cellId, undefined));
        this._basicop.crdtArrayRemove(table.colWidths, idx);
    }
    
    tableModifyCellSpan(cell: TableCell, rowSpan: number | undefined, colSpan: number | undefined) {
        // cell!.setCellSpan(rowSpan, colSpan);
        rowSpan = rowSpan && rowSpan <= 1 ? undefined : rowSpan;
        colSpan = colSpan && colSpan <= 1 ? undefined : colSpan;
        this._basicop.crdtSetAttr(cell, "rowSpan", rowSpan)
        this._basicop.crdtSetAttr(cell, "colSpan", colSpan)
    }
    
    // text
    tableModifyTextColor(table: TableShape, color: Color | undefined) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "color", color);
    }
    
    tableModifyTextHighlightColor(table: TableShape, color: Color | undefined) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "highlight", color);
    }
    
    tableModifyTextFontName(table: TableShape, fontName: string | undefined) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "fontName", fontName);
    }
    
    tableModifyTextFontSize(table: TableShape, fontSize: number) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "fontSize", fontSize);
    }
    
    tableModifyTextVerAlign(table: TableShape, verAlign: TextVerAlign | undefined) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "verAlign", verAlign);
    }
    
    tableModifyTextHorAlign(table: TableShape, horAlign: TextHorAlign) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "alignment", horAlign);
    }
    
    tableModifyTextAutoLineHeight(table: TableShape, autoLineHeight: boolean) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "autoLineHeight", autoLineHeight);
    }
    
    tableModifyTextMinLineHeight(table: TableShape, lineHeight: number | undefined) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "minimumLineHeight", lineHeight);
    }
    
    tableModifyTextMaxLineHeight(table: TableShape, lineHeight: number | undefined) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "maximumLineHeight", lineHeight);
    }
    
    tableModifyTextKerning(table: TableShape, kerning: number) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "kerning", kerning);
    }
    
    tableModifyTextParaSpacing(table: TableShape, paraSpacing: number) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "paraSpacing", paraSpacing);
    }
    
    tableModifyTextUnderline(table: TableShape, underline: UnderlineType | undefined) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "underline", underline);
    }
    
    tableModifyTextStrikethrough(table: TableShape, strikethrough: StrikethroughType | undefined) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "strikethrough", strikethrough);
    }
    tableModifyTextWeight(table: TableShape, weight: number) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "weight", weight);
    }
    
    tableModifyTextItalic(table: TableShape, italic: boolean) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "italic", italic);
    }
    
    tableModifyTextTransform(table: TableShape, transform: TextTransformType | undefined) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "transform", transform);
    }
    
    tableModifyTextFillType(table: TableShape, filltype: FillType | undefined) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "filltype", filltype);
    }
    
    tableModifyTextGradient(table: TableShape, gradient: Gradient | undefined) {
        if (!table.textAttr) table.textAttr = new TextAttr();
        return this._basicop.crdtSetAttr(table.textAttr, "gradient", gradient);
    }
}