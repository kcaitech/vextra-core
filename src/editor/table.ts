/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { TableCell, TableShape } from "../data/table";
import { ShapeEditor } from "./shape";
import { Page } from "../data/page";
import { IRepository } from "../repo";
import { BorderPosition, BorderStyle, StrikethroughType, TableCellType, TextHorAlign, TextTransformType, TextVerAlign, UnderlineType, FillType, ImageScaleMode, BorderSideSetting, SideType, CornerType } from "../data/baseclasses";
import { adjColum, adjRow } from "./tableadjust";
import { Border, Fill, Gradient } from "../data/style";
import { fixTableShapeFrameByLayout } from "./utils/other";
import { Operator, TextShapeLike } from "../operator/operator";
import { importBorder, importFill, importGradient } from "../data/baseimport";
import { Document, Color } from "../data/classes";
import { AsyncBorderThickness, AsyncGradientEditor, Status } from "./controller";
import { PageView, TableCellView, TableView } from "../dataview";
import { cell4edit } from "./symbol";
import { AsyncTextAttrEditor } from "./textshape";
import { BasicArray } from "../data";

const MinCellSize = TableShape.MinCellSize;
const MaxColCount = TableShape.MaxColCount;
const MaxRowCount = TableShape.MaxRowCount;


export class TableEditor extends ShapeEditor {

    constructor(shape: TableView, page: PageView, repo: IRepository, document: Document) {
        super(shape, page, repo, document)
    }

    get view() {
        return this.__shape as TableView;
    }

    get shape(): TableShape {
        return this.__shape.data as TableShape;
    }

    cell4edit(rowIdx: number, colIdx: number, op: Operator): TableCellView {
        return cell4edit(this._page, this.view, rowIdx, colIdx, op);
    }

    // 水平拆分单元格
    horSplitCell(rowIdx: number, colIdx: number) {

        const layout = this.view.getLayout();
        const cellLayout = layout.grid.get(rowIdx, colIdx);
        const cell = this.view.getCellAt(cellLayout.index.row, cellLayout.index.col);
        const op = this.__repo.start("horSplitCell");
        try {

            if (cell && (cell.rowSpan ?? 1) > 1) {
                // const cell = cellLayout.cell;
                const rowSpan = cell.rowSpan ?? 1;
                if (rowSpan > 2) {
                    // 找到比较居中的分隔线
                    let total = 0;
                    const rowStart = cellLayout.index.row;
                    for (let i = rowStart, end = rowStart + rowSpan; i < end; ++i) {
                        total += this.shape.rowHeights[i].value;
                    }
                    total /= 2;
                    let topSpan = 0;
                    let cur = 0;
                    for (let i = rowStart, end = rowStart + rowSpan; i < end; ++i) {
                        cur += this.shape.rowHeights[i].value;
                        if (cur >= total) {
                            topSpan = i - rowStart + 1;
                            break;
                        }
                    }

                    topSpan = Math.min(topSpan, rowSpan - 1);
                    op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), topSpan, cell.colSpan ?? 1);

                    const bottomSpan = rowSpan - topSpan;
                    const colSpan = cell.colSpan || 1;
                    if (bottomSpan > 1 || colSpan > 1) {
                        const rowIdx = cellLayout.index.row + topSpan;
                        const colIdx = cellLayout.index.col;

                        op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), bottomSpan, colSpan);
                    }
                }
                else {
                    op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), rowSpan - 1, cell.colSpan ?? 1);
                    if ((cell.colSpan ?? 1) > 1) {
                        op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(rowIdx + 1, colIdx, op), 1, cell.colSpan ?? 1);
                    }
                }
            }
            else {
                // 当前行后插入行
                // 将当前行可见的单元格，rowSpan+1
                // 当前单元格rowSpan-1

                const weight = this.shape.rowHeights[rowIdx].value / 2;

                op.tableInsertRow(this.__page, this.shape, rowIdx + 1, weight);
                op.tableModifyRowHeight(this.__page, this.shape, rowIdx, weight);
                const cells = this.view._getVisibleCells(rowIdx, rowIdx, 0, this.shape.colWidths.length);
                cells.forEach((c) => {
                    if (c.rowIdx !== rowIdx || c.colIdx !== colIdx) {
                        op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(c.rowIdx, c.colIdx, op), (c.cell?.rowSpan ?? 1) + 1, c.cell?.colSpan ?? 1);
                    }
                });
                const cell = this.view.getCellAt(rowIdx, colIdx);
                op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(rowIdx + 1, colIdx, op), 1, cell?.colSpan ?? 1);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }
    // 垂直拆分单元格
    verSplitCell(rowIdx: number, colIdx: number) {
        const layout = this.view.getLayout();
        const cellLayout = layout.grid.get(rowIdx, colIdx);
        const cell = this.view.getCellAt(cellLayout.index.row, cellLayout.index.col);
        const op = this.__repo.start("verSplitCell");
        try {
            if (cell && (cell.colSpan ?? 1) > 1) {
                // const cell = cellLayout.cell;
                const colSpan = cell.colSpan ?? 1;
                if (colSpan > 2) {
                    // 找到比较居中的分隔线
                    let total = 0;
                    const colStart = cellLayout.index.col;
                    for (let i = colStart, end = colStart + colSpan; i < end; ++i) {
                        total += this.shape.colWidths[i].value;
                    }
                    total /= 2;
                    let leftSpan = 0;
                    let cur = 0;
                    for (let i = colStart, end = colStart + colSpan; i < end; ++i) {
                        cur += this.shape.rowHeights[i].value;
                        if (cur >= total) {
                            leftSpan = i - colStart + 1;
                            break;
                        }
                    }

                    leftSpan = Math.min(leftSpan, colSpan - 1);
                    op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), cell.rowSpan ?? 1, leftSpan);

                    const rightSpan = colSpan - leftSpan;
                    const rowSpan = cell.rowSpan || 1;
                    if (rightSpan > 1 || rowSpan > 1) {
                        const rowIdx = cellLayout.index.row;
                        const colIdx = cellLayout.index.col + leftSpan;

                        op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), rowSpan, rightSpan);
                    }
                }
                else {
                    op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), cell.rowSpan ?? 1, colSpan - 1);
                    if ((cell.rowSpan ?? 1) > 1) {
                        op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(rowIdx, colIdx + 1, op), (cell.rowSpan ?? 1), 1);
                    }
                }
            }
            else {
                // 当前列后插入列
                // 将当前列可见的单元格，colSpan+1
                // 当前单元格colSpan-1
                const weight = this.shape.colWidths[colIdx].value / 2;

                op.tableInsertCol(this.__page, this.shape, colIdx + 1, weight);
                op.tableModifyColWidth(this.__page, this.shape, colIdx, weight);
                const cells = this.view._getVisibleCells(0, this.shape.rowCount, colIdx, colIdx);
                cells.forEach((c) => {
                    if (c.rowIdx !== rowIdx || c.colIdx !== colIdx) {
                        op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(c.rowIdx, c.colIdx, op), (c.cell?.rowSpan ?? 1), (c.cell?.colSpan ?? 1) + 1);
                    }
                });
                const cell = this.view.getCellAt(rowIdx, colIdx);
                op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(rowIdx, colIdx + 1, op), (cell?.rowSpan ?? 1), 1);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // 合并单元格
    mergeCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
        const op = this.__repo.start('mergeCells');
        try {
            const cells = this.view.getCells(rowStart, rowStart, colStart, colStart);
            const cellsVisible = this.view._getVisibleCells(rowStart, rowEnd, colStart, colEnd);

            if (cells.length === 0) {
                throw new Error("not find cell")
            }
            if (cellsVisible.length === 0 || (cellsVisible[0].rowIdx !== cells[0].rowIdx && cellsVisible[0].colIdx !== cells[0].colIdx)) {
                throw new Error("cell not visible")
            }

            const cell = cells[0];
            op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(rowStart, colStart, op), rowEnd - rowStart + 1, colEnd - colStart + 1);
            // merge content
            cellsVisible.forEach((c) => {
                if (!c.cell || (c.cell.cellType ?? TableCellType.None) === TableCellType.None) return;
                if (c.rowIdx === cell.rowIdx && c.colIdx === cell.colIdx) return;
                if (c.cell.cellType === TableCellType.Image) {
                    // 图片咋搞？
                    if ((cell.cell?.cellType ?? TableCellType.None) === TableCellType.None) {
                        op.tableSetCellContentType(this.__page, this.shape, this.cell4edit(cell.rowIdx, cell.colIdx, op), TableCellType.Image);
                        op.tableSetCellContentImage(this.__page, this.shape, this.cell4edit(cell.rowIdx, cell.colIdx, op), c.cell.imageRef);
                    }
                }
                else if (c.cell.cellType === TableCellType.Text) {
                    if ((cell.cell?.cellType ?? TableCellType.None) === TableCellType.None) {
                        // op.tableSetCellContentType(this.__page, this.shape, cell.rowIdx, cell.colIdx, TableCellType.Text);
                        // const _text = newText(this.shape.textAttr);
                        // _text.setTextBehaviour(TextBehaviour.Fixed);
                        // _text.setPadding(5, 0, 3, 0);
                        op.tableSetCellContentType(this.__page, this.shape, this.cell4edit(cell.rowIdx, cell.colIdx, op), TableCellType.Text);
                        // op.tableSetCellContentText(this.__page, this.shape, this.cell4edit(cell.rowIdx, cell.colIdx, op), _text);
                    }
                    if (cell.cell?.cellType === TableCellType.Text) {
                        if (c.cell.text) {
                            const clen = c.cell.text.length;
                            if (clen > 1) op.insertComplexText(this.__page, cell.cell as TextShapeLike, cell.cell.text!.length - 1, c.cell.text!);
                        }
                    }
                }
                op.tableSetCellContentType(this.__page, this.shape, this.cell4edit(c.rowIdx, c.colIdx, op), undefined);
                op.tableSetCellContentImage(this.__page, this.shape, this.cell4edit(c.rowIdx, c.colIdx, op), undefined);
                // op.tableSetCellContentText(this.__page, this.shape, this.cell4edit(c.rowIdx, c.colIdx, op), undefined);
            })

            // 清除被合并的单元格的span
            for (let i = 1; i < cells.length; ++i) {
                const cell = cells[0];
                if (cell.cell) {
                    const colSpan = cell.cell.colSpan ?? 1;
                    const rowSpan = cell.cell.rowSpan ?? 1;
                    if (colSpan > 1 || rowSpan > 1) {
                        op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(cell.rowIdx, cell.colIdx, op), 1, 1);
                    }
                }
            }
            // todo 删除完全被覆盖的行列

            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    setCellContentImage(rowIdx: number, colIdx: number, ref: string) {
        const op = this.__repo.start('setCellContentImage');
        try {
            op.tableSetCellContentType(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), TableCellType.Image);
            op.tableSetCellContentImage(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), ref);
            // op.tableSetCellContentText(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), undefined);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // setCellContentText(rowIdx: number, colIdx: number, text?: string) {
    //     const _text = newText(this.shape.textAttr);
    //     _text.setTextBehaviour(TextBehaviour.Fixed);
    //     _text.setPadding(5, 0, 3, 0);
    //     if (text && text.length > 0) _text.insertText(text, 0);
    //     const op = this.__repo.start('setCellContentText');
    //     try {
    //         op.tableSetCellContentType(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), TableCellType.Text);
    //         op.tableSetCellContentText(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), _text);
    //         op.tableSetCellContentImage(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), undefined);
    //         this.__repo.commit();
    //     } catch (e) {
    //         console.error(e);
    //         this.__repo.rollback();
    //     }
    // }
    // 批量初始化单元格
    initCells(rs: number, re: number, cs: number, ce: number) {
        const op = this.__repo.start('initCells');
        try {
            this._initCells(rs, re, cs, ce, op);
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    // 批量初始化单元格
    private _initCells(rs: number, re: number, cs: number, ce: number, op: Operator) {
        for (let r = rs; r <= re; r++) {
            for (let c = cs; c <= ce; c++) {
                const cell = this.view._getCellAt2(r, c);
                if (cell && cell.cellType && cell.cellType !== TableCellType.None) continue;
                const cellview = this.cell4edit(r, c, op);
                op.tableSetCellContentType(this.__page, this.shape, cellview, TableCellType.Text);
            }
        }
    }
    // 重置单元格内容
    resetCells(rs: number, re: number, cs: number, ce: number) {
        const op = this.__repo.start('resetCells');
        try {
            this._resetCells(rs, re, cs, ce, op);
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    resetTextCells(rs: number, re: number, cs: number, ce: number) {
        const op = this.__repo.start('resetCells');
        try {
            this._resetTextCells(rs, re, cs, ce, op);
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    private _resetCells(rs: number, re: number, cs: number, ce: number, op: Operator) {
        for (let r = rs; r <= re; r++) {
            for (let c = cs; c <= ce; c++) {
                const cell = this.view.getCellAt(r, c);
                if (!cell) continue;
                const _cell = this.cell4edit(r, c, op);
                if (_cell.cellType === TableCellType.Image) {
                    op.tableSetCellContentType(this.__page, this.shape, _cell, TableCellType.Text);
                }
                else if (_cell.cellType === TableCellType.Text) {
                    const len = cell.text?.length || 0;
                    if (len <= 1) continue;
                    const _cell = this.cell4edit(r, c, op);
                    op.deleteText(this.__page, _cell as TextShapeLike, 0, len - 1);
                }
            }
        }
    }

    private _resetTextCells(rs: number, re: number, cs: number, ce: number, op: Operator) {
        for (let r = rs; r <= re; r++) {
            for (let c = cs; c <= ce; c++) {
                const cell = this.view.getCellAt(r, c);
                if (!cell || cell.cellType !== TableCellType.Text) continue;
                const len = cell.text?.length || 0;
                if (len <= 1) continue;
                const _cell = this.cell4edit(r, c, op);
                op.deleteText(this.__page, _cell as TextShapeLike, 0, len - 1);
            }
        }
    }

    // 调整列宽
    setColWidth(idx: number, width: number) {
        const total = this.shape.colWidths.reduce((pre, w) => pre + w.value, 0);
        const curWidth = this.shape.colWidths[idx].value / total * this.shape.size.width;
        if (width === curWidth) return;
        const weight = this.shape.colWidths[idx].value * width / curWidth;
        const op = this.__repo.start('setColWidth');
        try {
            op.tableModifyColWidth(this.__page, this.shape, idx, weight);
            op.shapeModifyWH(this.__page, this.shape, this.shape.size.width - curWidth + width, this.shape.size.height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    /**
     * 
     * @param fromIdx 
     * @param toIdx 
     * @param width table坐标系空间宽度
     */
    adjColWidth(fromIdx: number, toIdx: number, width: number) {
        const op = this.__repo.start('adjColWidth');
        try {
            adjColum(this.__page, this.view, fromIdx, toIdx, width, op);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // 调整行高
    setRowHeight(idx: number, height: number) {
        const total = this.view.heightTotalWeights;
        const curHeight = this.shape.rowHeights[idx].value / total * this.shape.size.height;
        if (height === curHeight) return;
        const weight = this.shape.rowHeights[idx].value * height / curHeight;
        const op = this.__repo.start('setRowHeight');
        try {
            op.tableModifyRowHeight(this.__page, this.shape, idx, weight);
            op.shapeModifyWH(this.__page, this.shape, this.shape.size.width, this.shape.size.height - curHeight + height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    /**
     * 
     * @param fromIdx 
     * @param toIdx 
     * @param height table坐标系空间长度
     */
    adjRowHeight(fromIdx: number, toIdx: number, height: number) {
        const op = this.__repo.start('adjRowHeight');
        try {
            adjRow(this.__page, this.view, fromIdx, toIdx, height, op);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    insertRow(idx: number, height: number) {
        const total = this.view.heightTotalWeights;
        const weight = height / this.shape.size.height * total;
        const op = this.__repo.start('insertRow');
        try {
            op.tableInsertRow(this.__page, this.shape, idx, weight);
            op.shapeModifyWH(this.__page, this.shape, this.shape.size.width, this.shape.size.height + height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    insertMultiRow(idx: number, height: number, count: number) {
        const total = this.view.heightTotalWeights;
        const weight = height / this.shape.size.height * total;
        const op = this.__repo.start('insertMultiRow');
        try {
            for (let i = 0; i < count; ++i) {
                op.tableInsertRow(this.__page, this.shape, idx + i, weight);
            }
            op.shapeModifyWH(this.__page, this.shape, this.shape.size.width, this.shape.size.height + height * count);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    removeRow(idx: number, idxEnd?: number) {
        idxEnd = idxEnd ?? idx;
        const count = idxEnd - idx + 1;
        if (count >= this.shape.rowHeights.length) {
            super.delete();
            return 1;
        }

        const total = this.view.heightTotalWeights;
        const op = this.__repo.start('removeRow');
        try {
            let removeWeight = 0;
            for (let i = 0; i < count; ++i) {
                removeWeight += this.shape.rowHeights[idx].value;
                op.tableRemoveRow(this.__page, this.shape, idx);
            }
            // modify rowSpan
            if (idx < this.shape.rowCount) {
                const cells = this.view._getVisibleCells(idx, idx, 0, this.shape.colCount);
                cells.forEach((val) => {
                    if (val.cell) {
                        let rowSpan = val.cell.rowSpan ?? 1;
                        if (rowSpan > 1) {
                            rowSpan = Math.max(1, rowSpan - count);
                            op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(val.rowIdx, val.colIdx, op), rowSpan, val.cell.colSpan ?? 1);
                        }
                    }
                })
            }
            const curHeight = removeWeight / total * this.shape.size.height;
            op.shapeModifyWH(this.__page, this.shape, this.shape.size.width, this.shape.size.height - curHeight);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    insertCol(idx: number, width: number) {
        const total = this.view.widthTotalWeights;
        const weight = width / this.shape.size.width * total;
        const op = this.__repo.start('insertCol');
        try {
            op.tableInsertCol(this.__page, this.shape, idx, weight);
            op.shapeModifyWH(this.__page, this.shape, this.shape.size.width + width, this.shape.size.height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    insertMultiCol(idx: number, width: number, count: number) {
        const total = this.view.widthTotalWeights;
        const weight = width / this.shape.size.width * total;
        const op = this.__repo.start('insertMultiCol');
        try {
            for (let i = 0; i < count; ++i) {
                op.tableInsertCol(this.__page, this.shape, idx + i, weight);
            }
            op.shapeModifyWH(this.__page, this.shape, this.shape.size.width + width * count, this.shape.size.height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    removeCol(idx: number, idxEnd?: number) {
        idxEnd = idxEnd ?? idx;
        const count = idxEnd - idx + 1;

        if (count >= this.shape.colWidths.length) {
            super.delete();
            return 1;
        }

        const total = this.view.widthTotalWeights;
        const op = this.__repo.start('removeCol');
        try {
            let removeWeight = 0;
            for (let i = 0; i < count; ++i) {
                removeWeight += this.shape.colWidths[idx].value;
                op.tableRemoveCol(this.__page, this.shape, idx);
            }
            // modify colSpan
            if (idx < this.shape.colCount) {
                const cells = this.view._getVisibleCells(0, this.shape.rowCount, idx, idx);
                cells.forEach((val) => {
                    if (val.cell) {
                        let colSpan = val.cell.colSpan ?? 1;
                        if (colSpan > 1) {
                            colSpan = Math.max(1, colSpan - count);
                            op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(val.rowIdx, val.colIdx, op), val.cell.rowSpan ?? 1, colSpan);
                        }
                    }
                })
            }
            const curWidth = removeWeight / total * this.shape.size.width;
            op.shapeModifyWH(this.__page, this.shape, this.shape.size.width - curWidth, this.shape.size.height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    removeRowAndCol(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {

        const rowCount = rowEnd - rowStart + 1;
        if (rowCount >= this.shape.rowHeights.length) {
            super.delete();
            return 1;
        }

        const colCount = colEnd - colStart + 1;
        if (colCount >= this.shape.colWidths.length) {
            super.delete();
            return 1;
        }

        const colTotal = this.view.widthTotalWeights;
        const rowTotal = this.view.heightTotalWeights;

        const op = this.__repo.start('removeRowAndCol');
        try {
            let removeColWeight = 0;
            for (let i = 0; i < colCount; ++i) {
                removeColWeight += this.shape.colWidths[colStart].value;
                op.tableRemoveCol(this.__page, this.shape, colStart);
            }
            const removeWidth = removeColWeight / colTotal * this.shape.size.width;
            if (colStart < this.shape.colCount) {
                const idx = colStart;
                const count = colCount;
                const cells = this.view._getVisibleCells(0, this.shape.rowCount, idx, idx);
                cells.forEach((val) => {
                    if (val.cell) {
                        let colSpan = val.cell.colSpan ?? 1;
                        if (colSpan > 1) {
                            colSpan = Math.max(1, colSpan - count);
                            op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(val.rowIdx, val.colIdx, op), val.cell.rowSpan ?? 1, colSpan);
                        }
                    }
                })
            }

            let removeRowWeight = 0;
            for (let i = 0; i < rowCount; ++i) {
                removeRowWeight += this.shape.rowHeights[rowStart].value;
                op.tableRemoveRow(this.__page, this.shape, rowStart);
            }
            const removeHeight = removeRowWeight / rowTotal * this.shape.size.height;
            if (rowStart < this.shape.rowCount) {
                const idx = rowStart;
                const count = rowCount;
                const cells = this.view._getVisibleCells(idx, idx, 0, this.shape.colCount);
                cells.forEach((val) => {
                    if (val.cell) {
                        let rowSpan = val.cell.rowSpan ?? 1;
                        if (rowSpan > 1) {
                            rowSpan = Math.max(1, rowSpan - count);
                            op.tableModifyCellSpan(this.__page, this.shape, this.cell4edit(val.rowIdx, val.colIdx, op), rowSpan, val.cell.colSpan ?? 1);
                        }
                    }
                })
            }

            op.shapeModifyWH(this.__page, this.shape, this.shape.size.width - removeWidth, this.shape.size.height - removeHeight);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    private fixFrameByLayout(cell: TableCellView | TableCell, table: TableView, op: Operator) {
        fixTableShapeFrameByLayout(op, this.__page, cell, table);
    }

    // text attr
    public setTextColor(color: Color | undefined, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextColor");
        try {
            let cells;
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).map((v) => v.cell)
            } else {
                op.tableModifyTextColor(this.__page, this.shape, color);
                cells = this.view.childs as TableCellView[];
            }
            cells.forEach((cell) => {
                if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                    op.textModifyColor(this.__page, cell as TextShapeLike, 0, cell.text.length, color);
                }
            })

            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextHighlightColor(color: Color | undefined, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextHighlightColor");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyHighlightColor(this.__page, cell as TextShapeLike, 0, cell.text.length, color);
                    }
                })
            }
            else {
                op.tableModifyTextHighlightColor(this.__page, this.shape, color);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyHighlightColor(this.__page, cell as TextShapeLike, 0, cell.text.length, color);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFontName(fontName: string, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextFontName");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyFontName(this.__page, cell as TextShapeLike, 0, cell.text.length, fontName);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            else {
                op.tableModifyTextFontName(this.__page, this.shape, fontName);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyFontName(this.__page, cell as TextShapeLike, 0, cell.text.length, fontName);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFontSize(fontSize: number, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextFontSize");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyFontSize(this.__page, cell as TextShapeLike, 0, cell.text.length, fontSize);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            else {
                op.tableModifyTextFontSize(this.__page, this.shape, fontSize);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyFontSize(this.__page, cell as TextShapeLike, 0, cell.text.length, fontSize);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    // 对象属性
    public setTextVerAlign(verAlign: TextVerAlign, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextVerAlign");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.shapeModifyTextVerAlign(this.__page, cell as TextShapeLike, verAlign);
                    }
                })
            }
            else {

                op.tableModifyTextVerAlign(this.__page, this.shape, verAlign);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.shapeModifyTextVerAlign(this.__page, cell as TextShapeLike, verAlign);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    // 段属性
    public setTextHorAlign(horAlign: TextHorAlign, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextHorAlign");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyHorAlign(this.__page, cell as TextShapeLike, horAlign, 0, cell.text.length);
                    }
                })
            }
            else {

                op.tableModifyTextHorAlign(this.__page, this.shape, horAlign);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyHorAlign(this.__page, cell as TextShapeLike, horAlign, 0, cell.text.length);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setLineHeight(lineHeight: number | undefined, isAuto: boolean, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setLineHeight");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        const length = cell.text.length;
                        op.textModifyAutoLineHeight(this.__page, cell as TextShapeLike, isAuto, 0, length)
                        op.textModifyMinLineHeight(this.__page, cell as TextShapeLike, lineHeight, 0, length);
                        op.textModifyMaxLineHeight(this.__page, cell as TextShapeLike, lineHeight, 0, length);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            else {
                op.tableModifyTextAutoLineHeight(this.__page, this.shape, isAuto);
                op.tableModifyTextMinLineHeight(this.__page, this.shape, lineHeight);
                op.tableModifyTextMaxLineHeight(this.__page, this.shape, lineHeight);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        const length = cell.text.length;
                        op.textModifyAutoLineHeight(this.__page, cell as TextShapeLike, isAuto, 0, length)
                        op.textModifyMinLineHeight(this.__page, cell as TextShapeLike, lineHeight, 0, length);
                        op.textModifyMaxLineHeight(this.__page, cell as TextShapeLike, lineHeight, 0, length);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    // 字间距 段属性
    public setCharSpacing(kerning: number, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableCharSpace");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyKerning(this.__page, cell as TextShapeLike, kerning, 0, cell.text.length);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            else {
                op.tableModifyTextKerning(this.__page, this.shape, kerning);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyKerning(this.__page, cell as TextShapeLike, kerning, 0, cell.text.length);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    // 段间距 段属性
    public setParaSpacing(paraSpacing: number, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableParaSpacing");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyParaSpacing(this.__page, cell as TextShapeLike, paraSpacing, 0, cell.text.length);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            else {
                op.tableModifyTextParaSpacing(this.__page, this.shape, paraSpacing);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyParaSpacing(this.__page, cell as TextShapeLike, paraSpacing, 0, cell.text.length);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextUnderline(underline: boolean, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextUnderline");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyUnderline(this.__page, cell as TextShapeLike, underline ? UnderlineType.Single : UnderlineType.None, 0, cell.text.length);
                    }
                })
            }
            else {
                op.tableModifyTextUnderline(this.__page, this.shape, underline ? UnderlineType.Single : UnderlineType.None);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyUnderline(this.__page, cell as TextShapeLike, underline ? UnderlineType.Single : UnderlineType.None, 0, cell.text.length);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextStrikethrough(strikethrough: boolean, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextStrikethrough");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyStrikethrough(this.__page, cell as TextShapeLike, strikethrough ? StrikethroughType.Single : StrikethroughType.None, 0, cell.text.length);
                    }
                })
            }
            else {
                op.tableModifyTextStrikethrough(this.__page, this.shape, strikethrough ? StrikethroughType.Single : StrikethroughType.None);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyStrikethrough(this.__page, cell as TextShapeLike, strikethrough ? StrikethroughType.Single : StrikethroughType.None, 0, cell.text.length);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextWeight(weight: number, italic: boolean, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextWeight");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyWeight(this.__page, cell as TextShapeLike, weight, 0, cell.text.length);
                        op.textModifyItalic(this.__page, cell as TextShapeLike, italic, 0, cell.text.length);
                    }
                })
            }
            else {
                op.tableModifyTextWeight(this.__page, this.shape, weight);
                op.tableModifyTextItalic(this.__page, this.shape, italic);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyWeight(this.__page, cell as TextShapeLike, weight, 0, cell.text.length);
                        op.textModifyItalic(this.__page, cell as TextShapeLike, italic, 0, cell.text.length);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextTransform(transform: TextTransformType | undefined, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextTransform");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyTransform(this.__page, cell as TextShapeLike, transform, 0, cell.text.length);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            else {
                op.tableModifyTextTransform(this.__page, this.shape, transform);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyTransform(this.__page, cell as TextShapeLike, transform, 0, cell.text.length);
                        this.fixFrameByLayout(cell, this.view, op);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFillType(fillType: FillType, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextFillType");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyFillType(this.__page, cell as TextShapeLike, fillType, 0, cell.text.length);
                    }
                })
            } else {
                op.tableModifyTextFillType(this.__page, this.shape, fillType);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.textModifyFillType(this.__page, cell as TextShapeLike, fillType, 0, cell.text.length);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextGradient(gradient: Gradient | undefined, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setTableTextGradient");
        try {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.setTextGradient(this.__page, cell as TextShapeLike, gradient, 0, cell.text.length);
                    }
                })
            }
            else {
                op.tableModifyTextGradient(this.__page, this.shape, gradient);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.setTextGradient(this.__page, cell as TextShapeLike, gradient, 0, cell.text.length);
                    }
                })
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public asyncSetTextGradient(gradient: Gradient | undefined, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }): AsyncGradientEditor {
        const op = this.__repo.start("asyncSetTextGradient");
        let status: Status = Status.Pending;
        const execute_from = (from: { x: number, y: number }) => {
            status = Status.Pending;
            try {
                const new_gradient = importGradient(gradient!);
                new_gradient.from.x = from.x;
                new_gradient.from.y = from.y;
                set_gradient(new_gradient);
                this.__repo.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute_to = (to: { x: number, y: number }) => {
            status = Status.Pending;
            try {
                const new_gradient = importGradient(gradient!);
                new_gradient.to.x = to.x;
                new_gradient.to.y = to.y;
                set_gradient(new_gradient);
                this.__repo.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute_elipselength = (length: number) => {
            status = Status.Pending;
            try {
                const new_gradient = importGradient(gradient!);
                new_gradient.elipseLength = length;
                set_gradient(new_gradient);
                this.__repo.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute_stop_position = (position: number, id: string) => {
            status = Status.Pending;
            try {
                const new_gradient = importGradient(gradient!);
                const i = new_gradient.stops.findIndex((item) => item.id === id);
                new_gradient.stops[i].position = position;
                const g_s = new_gradient.stops;
                g_s.sort((a, b) => {
                    if (a.position > b.position) {
                        return 1;
                    } else if (a.position < b.position) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                set_gradient(new_gradient);
                this.__repo.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        const set_gradient = (new_gradient: Gradient) => {
            if (range) {
                this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.setTextGradient(this.__page, cell as TextShapeLike, new_gradient, 0, cell.text.length);
                    }
                })
            }
            else {
                op.tableModifyTextGradient(this.__page, this.shape, new_gradient);
                const cells = this.view.childs as TableCellView[];
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                        op.setTextGradient(this.__page, cell as TextShapeLike, new_gradient, 0, cell.text.length);
                    }
                })
            }
        }
        return { execute_from, execute_to, execute_elipselength, execute_stop_position, close }
    }

    // todo 考虑去掉。
    // public initTextCell(rowIdx: number, colIdx: number) { // 初始化为文本单元格
    //     const op = this.__repo.start("initCell");
    //     try {
    //         this.cell4edit(rowIdx, colIdx, op);
    //         // const text = newText(this.shape.textAttr);
    //         // text.setTextBehaviour(TextBehaviour.Fixed);
    //         // text.setPadding(5, 0, 3, 0);
    //         // op.tableSetCellContentType(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), TableCellType.Text);
    //         // op.tableSetCellContentText(this.__page, this.shape, this.cell4edit(rowIdx, colIdx, op), text);
    //         this.__repo.commit();
    //     } catch (error) {
    //         console.error(error);
    //         this.__repo.rollback();
    //     }
    // }

    // fill
    public addFill4Cell(fill: Fill, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }, delOlds: boolean) {
        const op = this.__repo.start("addFill");
        try {
            this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
            const imageMgr = fill.getImageMgr();
            const cells = this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd);
            cells.forEach((cell) => {
                const newfill = importFill(fill);
                if (imageMgr) newfill.setImageMgr(imageMgr);
                if (!cell.cell) throw new Error("init cell fail?");
                const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                // if (delOlds) op.deleteFills(this.__page, c.data, 0, c.style.fills.length);
                // op.addFillAt(this.__page, c.data, newfill, cell.cell.style.fills.length);
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public setFillColor4Cell(idx: number, color: Color, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setFillColor");
        try {
            this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    // const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                    // op.setFillColor(this.__page, c.data, idx, color)
                }
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public setFillEnable4Cell(idx: number, value: boolean, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setFillEnable");
        try {
            this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                    // op.setFillEnable(this.__page, c.data, idx, value);
                }
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public setFillType4Cell(idx: number, type: FillType, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setFillType");
        try {
            this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                    // op.setFillType(this.__page, c.data, idx, type);
                    if (!c.data.style.fills[idx].imageScaleMode) {
                        // op.setFillScaleMode(this.__page, c.data, idx, ImageScaleMode.Fill);
                    }
                }
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    public deleteFill4Cell(idx: number, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("deleteFill");
        try {
            this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                    // op.deleteFillAt(this.__page, c.data, idx);
                }
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    // border
    public setBorderEnable4Cell(idx: number, isEnabled: boolean, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setBorderEnable");
        try {
            this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                    op.setBorderEnable(this.__page, c.data, idx, isEnabled);
                }
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public setBorderColor4Cell(idx: number, color: Color, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setBorderColor");
        try {
            this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                    op.setBorderColor(this.__page, c.data, idx, color);
                }
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public setBorderThickness4Cell(thickness: number, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setBorderThickness4Cell");
        try {
            this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                    op.setBorderSide(c.data.getBorders(), new BorderSideSetting(SideType.Normal, thickness, thickness, thickness, thickness));
                }
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public asyncBorderThickness4Cell(range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }): AsyncBorderThickness {
        const op = this.__repo.start("asyncBorderThickness4Cell");
        let status: Status = Status.Pending
        const execute = (contextSettingThickness: number) => {
            status = Status.Pending;
            try {
                this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                    if (cell.cell) {
                        const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                        op.setBorderSide(c.data.getBorders(), new BorderSideSetting(SideType.Normal, contextSettingThickness, contextSettingThickness, contextSettingThickness, contextSettingThickness));
                    }
                })
                this.__repo.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { execute, close }
    }
    public setBorderStyle4Cell(borderStyle: BorderStyle, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("setBorderStyle");
        try {
            this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                    op.setBorderStyle(this.__page, c.data, borderStyle);
                }
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    public deleteBorder4Cell(idx: number, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("deleteBorder");
        try {
            this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                    op.deleteStrokePaintAt(this.__page, c.data, idx)
                }
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public deleteBorders4Cell(range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const op = this.__repo.start("deleteBorders4Cell");
        try {
            this.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                    op.deleteStrokePaints(this.__page, c.data, 0, c.style.borders.strokePaints.length)
                }
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public addBorder4Cell(strokePaint: Fill, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }, delOlds: boolean) {
        const op = this.__repo.start("addBorder");
        try {
            this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
            const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd);
            cells.forEach((cell) => {
                const newPaint = importFill(strokePaint);
                if (cell.cell) {
                    const c = this.cell4edit(cell.rowIdx, cell.colIdx, op);
                    if (delOlds) op.deleteStrokePaints(this.__page, c.data, 0, c.style.borders.strokePaints.length);
                    const len = c.style.borders.strokePaints.length;
                    if (len > 0) {
                        op.addStrokePaint(this.__page, c.data, newPaint, c.style.borders.strokePaints.length);
                    } else {
                        const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
                        const strokePaints = new BasicArray<Fill>(newPaint);
                        const border = new Border(BorderPosition.Inner, new BorderStyle(0, 0), CornerType.Miter, side, strokePaints);
                        // op.addBorder(this.__page, c.data, border);
                    }
                }
                else {
                    throw new Error("init cell fail?");
                }
            })
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public asyncSetTableAttr(range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }): AsyncTextAttrEditor {
        const op = this.__repo.start("asyncSetTableAttr");
        let status: Status = Status.Pending;
        const execute_char_spacing = (kerning: number) => {
            status = Status.Pending;
            try {
                if (range) {
                    this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                    const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                    cells.forEach((c) => {
                        const cell = c.cell;
                        if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                            op.textModifyKerning(this.__page, cell as TextShapeLike, kerning, 0, cell.text.length);
                            this.fixFrameByLayout(cell, this.view, op);
                        }
                    })
                }
                else {
                    op.tableModifyTextKerning(this.__page, this.shape, kerning);
                    const cells = this.view.childs as TableCellView[];
                    cells.forEach((cell) => {
                        if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                            op.textModifyKerning(this.__page, cell as TextShapeLike, kerning, 0, cell.text.length);
                            this.fixFrameByLayout(cell, this.view, op);
                        }
                    })
                }
                this.__repo.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute_line_height = (lineHeight: number) => {
            status = Status.Pending;
            try {
                if (range) {
                    this._initCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd, op);
                    const cells = this.view.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                    cells.forEach((c) => {
                        const cell = c.cell;
                        if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                            const length = cell.text.length;
                            op.textModifyMinLineHeight(this.__page, cell as TextShapeLike, lineHeight, 0, length);
                            op.textModifyMaxLineHeight(this.__page, cell as TextShapeLike, lineHeight, 0, length);
                            this.fixFrameByLayout(cell, this.view, op);
                        }
                    })
                }
                else {
                    op.tableModifyTextMinLineHeight(this.__page, this.shape, lineHeight);
                    op.tableModifyTextMaxLineHeight(this.__page, this.shape, lineHeight);
                    const cells = this.view.childs as TableCellView[];
                    cells.forEach((cell) => {
                        if (cell && cell.cellType === TableCellType.Text && cell.data.parent) {
                            const length = cell.text.length;
                            op.textModifyMinLineHeight(this.__page, cell as TextShapeLike, lineHeight, 0, length);
                            op.textModifyMaxLineHeight(this.__page, cell as TextShapeLike, lineHeight, 0, length);
                            this.fixFrameByLayout(cell, this.view, op);
                        }
                    })
                }
                this.__repo.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { execute_char_spacing, execute_line_height, close }
    }
}