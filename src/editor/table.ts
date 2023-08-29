import { TableCell, TableShape } from "../data/table";
import { ShapeEditor } from "./shape";
import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
import { newText } from "./creator";
import { BorderPosition, BorderStyle, StrikethroughType, TableCellType, TextBehaviour, TextHorAlign, TextTransformType, TextVerAlign, UnderlineType } from "../data/baseclasses";
import { adjColum, adjRow } from "./tableadjust";
import { Border, Color, Fill } from "../data/style";
import { fixTableShapeFrameByLayout } from "./utils";
import { Api } from "./command/recordapi";
import { importBorder, importFill } from "../io/baseimport";

const MinCellSize = TableShape.MinCellSize;
const MaxColCount = TableShape.MaxColCount;
const MaxRowCount = TableShape.MaxRowCount;

export class TableEditor extends ShapeEditor {

    constructor(shape: TableShape, page: Page, repo: CoopRepository) {
        super(shape, page, repo)
    }

    get shape(): TableShape {
        return this.__shape as TableShape;
    }

    // 水平拆分单元格
    horSplitCell(rowIdx: number, colIdx: number) {

        const layout = this.shape.getLayout();
        const cellLayout = layout.grid.get(rowIdx, colIdx);
        const cell = this.shape.getCellAt(cellLayout.index.row, cellLayout.index.col);
        const api = this.__repo.start("horSplitCell", {});
        try {

            if (cell && (cell.rowSpan ?? 1) > 1) {
                // const cell = cellLayout.cell;
                const rowSpan = cell.rowSpan ?? 1;
                if (rowSpan > 2) {
                    // 找到比较居中的分隔线
                    let total = 0;
                    const rowStart = cellLayout.index.row;
                    for (let i = rowStart, end = rowStart + rowSpan; i < end; ++i) {
                        total += this.shape.rowHeights[i];
                    }
                    total /= 2;
                    let topSpan = 0;
                    let cur = 0;
                    for (let i = rowStart, end = rowStart + rowSpan; i < end; ++i) {
                        cur += this.shape.rowHeights[i];
                        if (cur >= total) {
                            topSpan = i - rowStart + 1;
                            break;
                        }
                    }

                    topSpan = Math.min(topSpan, rowSpan - 1);
                    api.tableModifyCellSpan(this.__page, this.shape, rowIdx, colIdx, topSpan, cell.colSpan ?? 1);

                    const bottomSpan = rowSpan - topSpan;
                    const colSpan = cell.colSpan || 1;
                    if (bottomSpan > 1 || colSpan > 1) {
                        const rowIdx = cellLayout.index.row + topSpan;
                        const colIdx = cellLayout.index.col;

                        api.tableModifyCellSpan(this.__page, this.shape, rowIdx, colIdx, bottomSpan, colSpan);
                    }
                }
                else {
                    api.tableModifyCellSpan(this.__page, this.shape, rowIdx, colIdx, rowSpan - 1, cell.colSpan ?? 1);
                    if ((cell.colSpan ?? 1) > 1) {
                        api.tableModifyCellSpan(this.__page, this.shape, rowIdx + 1, colIdx, 1, cell.colSpan ?? 1);
                    }
                }
            }
            else {
                // 当前行后插入行
                // 将当前行可见的单元格，rowSpan+1
                // 当前单元格rowSpan-1

                const weight = this.shape.rowHeights[rowIdx] / 2;

                api.tableInsertRow(this.__page, this.shape, rowIdx + 1, weight, []);
                api.tableModifyRowHeight(this.__page, this.shape, rowIdx, weight);
                const cells = this.shape.getVisibleCells(rowIdx, rowIdx, 0, this.shape.colWidths.length);
                cells.forEach((c) => {
                    if (c.rowIdx !== rowIdx || c.colIdx !== colIdx) {
                        api.tableModifyCellSpan(this.__page, this.shape, c.rowIdx, c.colIdx, (c.cell?.rowSpan ?? 1) + 1, c.cell?.colSpan ?? 1);
                    }
                });
                const cell = this.shape.getCellAt(rowIdx, colIdx);
                api.tableModifyCellSpan(this.__page, this.shape, rowIdx + 1, colIdx, 1, cell?.colSpan ?? 1);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }
    // 垂直拆分单元格
    verSplitCell(rowIdx: number, colIdx: number) {
        const layout = this.shape.getLayout();
        const cellLayout = layout.grid.get(rowIdx, colIdx);
        const cell = this.shape.getCellAt(cellLayout.index.row, cellLayout.index.col);
        const api = this.__repo.start("verSplitCell", {});
        try {
            if (cell && (cell.colSpan ?? 1) > 1) {
                // const cell = cellLayout.cell;
                const colSpan = cell.colSpan ?? 1;
                if (colSpan > 2) {
                    // 找到比较居中的分隔线
                    let total = 0;
                    const colStart = cellLayout.index.col;
                    for (let i = colStart, end = colStart + colSpan; i < end; ++i) {
                        total += this.shape.colWidths[i];
                    }
                    total /= 2;
                    let leftSpan = 0;
                    let cur = 0;
                    for (let i = colStart, end = colStart + colSpan; i < end; ++i) {
                        cur += this.shape.rowHeights[i];
                        if (cur >= total) {
                            leftSpan = i - colStart + 1;
                            break;
                        }
                    }

                    leftSpan = Math.min(leftSpan, colSpan - 1);
                    api.tableModifyCellSpan(this.__page, this.shape, rowIdx, colIdx, cell.rowSpan ?? 1, leftSpan);

                    const rightSpan = colSpan - leftSpan;
                    const rowSpan = cell.rowSpan || 1;
                    if (rightSpan > 1 || rowSpan > 1) {
                        const rowIdx = cellLayout.index.row;
                        const colIdx = cellLayout.index.col + leftSpan;

                        api.tableModifyCellSpan(this.__page, this.shape, rowIdx, colIdx, rowSpan, rightSpan);
                    }
                }
                else {
                    api.tableModifyCellSpan(this.__page, this.shape, rowIdx, colIdx, cell.rowSpan ?? 1, colSpan - 1);
                    if ((cell.rowSpan ?? 1) > 1) {
                        api.tableModifyCellSpan(this.__page, this.shape, rowIdx, colIdx + 1, (cell.rowSpan ?? 1), 1);
                    }
                }
            }
            else {
                // 当前列后插入列
                // 将当前列可见的单元格，colSpan+1
                // 当前单元格colSpan-1
                const weight = this.shape.colWidths[colIdx] / 2;

                api.tableInsertCol(this.__page, this.shape, colIdx + 1, weight, []);
                api.tableModifyColWidth(this.__page, this.shape, colIdx, weight);
                const cells = this.shape.getVisibleCells(0, this.shape.rowCount, colIdx, colIdx);
                cells.forEach((c) => {
                    if (c.rowIdx !== rowIdx || c.colIdx !== colIdx) {
                        api.tableModifyCellSpan(this.__page, this.shape, c.rowIdx, c.colIdx, (c.cell?.rowSpan ?? 1), (c.cell?.colSpan ?? 1) + 1);
                    }
                });
                const cell = this.shape.getCellAt(rowIdx, colIdx);
                api.tableModifyCellSpan(this.__page, this.shape, rowIdx, colIdx + 1, (cell?.rowSpan ?? 1), 1);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // 合并单元格
    mergeCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
        const api = this.__repo.start('mergeCells', {});
        try {
            const cells = this.shape.getCells(rowStart, rowStart, colStart, colStart);
            const cellsVisible = this.shape.getVisibleCells(rowStart, rowEnd, colStart, colEnd);

            if (cells.length === 0) {
                throw new Error("not find cell")
            }
            if (cellsVisible.length === 0 || (cellsVisible[0].rowIdx !== cells[0].rowIdx && cellsVisible[0].colIdx !== cells[0].colIdx)) {
                throw new Error("cell not visible")
            }

            const cell = cells[0];
            api.tableModifyCellSpan(this.__page, this.shape, rowStart, colStart, rowEnd - rowStart + 1, colEnd - colStart + 1);
            // merge content
            cellsVisible.forEach((c) => {
                if (!c.cell || (c.cell.cellType ?? TableCellType.None) === TableCellType.None) return;
                if (c.rowIdx === cell.rowIdx && c.colIdx === cell.colIdx) return;
                if (c.cell.cellType === TableCellType.Image) {
                    // 图片咋搞？
                    if ((cell.cell?.cellType ?? TableCellType.None) === TableCellType.None) {
                        api.tableSetCellContentType(this.__page, this.shape, cell.rowIdx, cell.colIdx, TableCellType.Image);
                        api.tableSetCellContentImage(this.__page, this.shape, cell.rowIdx, cell.colIdx, c.cell.imageRef);
                    }
                }
                else if (c.cell.cellType === TableCellType.Text) {
                    if ((cell.cell?.cellType ?? TableCellType.None) === TableCellType.None) {
                        api.tableSetCellContentType(this.__page, this.shape, cell.rowIdx, cell.colIdx, TableCellType.Text);
                    }
                    if (cell.cell?.cellType === TableCellType.Text) {
                        if (c.cell.text) {
                            const clen = c.cell.text.length;
                            if (clen > 1) api.insertComplexText(this.__page, cell.cell as any, cell.cell.text!.length - 1, c.cell.text!);
                        }
                    }
                }
                api.tableSetCellContentType(this.__page, this.shape, c.rowIdx, c.colIdx, undefined);
                api.tableSetCellContentImage(this.__page, this.shape, c.rowIdx, c.colIdx, undefined);
                api.tableSetCellContentText(this.__page, this.shape, c.rowIdx, c.colIdx, undefined);
            })

            // 清除被合并的单元格的span
            for (let i = 1; i < cells.length; ++i) {
                const cell = cells[0];
                if (cell.cell) {
                    const colSpan = cell.cell.colSpan ?? 1;
                    const rowSpan = cell.cell.rowSpan ?? 1;
                    if (colSpan > 1 || rowSpan > 1) {
                        api.tableModifyCellSpan(this.__page, this.shape, cell.rowIdx, cell.colIdx, 1, 1);
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
        const api = this.__repo.start('setCellContentImage', {});
        try {
            api.tableSetCellContentType(this.__page, this.shape, rowIdx, colIdx, TableCellType.Image);
            api.tableSetCellContentImage(this.__page, this.shape, rowIdx, colIdx, ref);
            api.tableSetCellContentText(this.__page, this.shape, rowIdx, colIdx, undefined);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    setCellContentText(rowIdx: number, colIdx: number, text?: string) {
        const _text = newText(this.shape.textAttr);
        _text.setTextBehaviour(TextBehaviour.Fixed);
        _text.setPadding(5, 0, 3, 0);
        if (text && text.length > 0) _text.insertText(text, 0);
        const api = this.__repo.start('setCellContentText', {});
        try {
            api.tableSetCellContentType(this.__page, this.shape, rowIdx, colIdx, TableCellType.Text);
            api.tableSetCellContentText(this.__page, this.shape, rowIdx, colIdx, _text);
            api.tableSetCellContentImage(this.__page, this.shape, rowIdx, colIdx, undefined);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }
    // 批量初始化单元格
    initCells(rs: number, re: number, cs: number, ce: number) {
        const api = this.__repo.start('initCells', {});
        try {
            for (let r = rs; r <= re; r++) {
                for (let c = cs; c <= ce; c++) {
                    const _text = newText(this.shape.textAttr);
                    _text.setTextBehaviour(TextBehaviour.Fixed);
                    _text.setPadding(5, 0, 3, 0);
                    api.tableSetCellContentType(this.__page, this.shape, r, c, TableCellType.Text);
                    api.tableSetCellContentText(this.__page, this.shape, r, c, _text);
                    api.tableSetCellContentImage(this.__page, this.shape, r, c, undefined);
                }
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    // 调整列宽
    setColWidth(idx: number, width: number) {
        const total = this.shape.colWidths.reduce((pre, w) => pre + w, 0);
        const curWidth = this.shape.colWidths[idx] / total * this.shape.frame.width;
        if (width === curWidth) return;
        const weight = this.shape.colWidths[idx] * width / curWidth;
        const api = this.__repo.start('setColWidth', {});
        try {
            api.tableModifyColWidth(this.__page, this.shape, idx, weight);
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width - curWidth + width, this.shape.frame.height);
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
        const api = this.__repo.start('adjColWidth', {});
        try {
            adjColum(this.__page, this.shape, fromIdx, toIdx, width, api);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // 调整行高
    setRowHeight(idx: number, height: number) {
        const total = this.shape.heightTotalWeights;
        const curHeight = this.shape.rowHeights[idx] / total * this.shape.frame.height;
        if (height === curHeight) return;
        const weight = this.shape.rowHeights[idx] * height / curHeight;
        const api = this.__repo.start('setRowHeight', {});
        try {
            api.tableModifyRowHeight(this.__page, this.shape, idx, weight);
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width, this.shape.frame.height - curHeight + height);
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
        const api = this.__repo.start('adjColWidth', {});
        try {
            adjRow(this.__page, this.shape, fromIdx, toIdx, height, api);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    insertRow(idx: number, height: number, data?: TableCell[]) {
        const total = this.shape.heightTotalWeights;
        const weight = height / this.shape.frame.height * total;
        const api = this.__repo.start('insertRow', {});
        try {
            api.tableInsertRow(this.__page, this.shape, idx, weight, data ?? []);
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width, this.shape.frame.height + height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    insertMultiRow(idx: number, height: number, count: number, data?: TableCell[][]) {
        const total = this.shape.heightTotalWeights;
        const weight = height / this.shape.frame.height * total;
        const api = this.__repo.start('insertMultiRow', {});
        try {
            for (let i = 0; i < count; ++i) {
                const d = data && data[i]
                api.tableInsertRow(this.__page, this.shape, idx + i, weight, d ?? []);
            }
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width, this.shape.frame.height + height * count);
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
            return;
        }

        const total = this.shape.heightTotalWeights;
        const api = this.__repo.start('removeRow', {});
        try {
            let removeWeight = 0;
            for (let i = 0; i < count; ++i) {
                removeWeight += this.shape.rowHeights[idx];
                api.tableRemoveRow(this.__page, this.shape, idx);
            }
            // modify rowSpan
            if (idx > 0) {
                const cells = this.shape.getVisibleCells(idx - 1, idx - 1, 0, this.shape.colCount);
                cells.forEach((val) => {
                    if (val.cell) {
                        let rowSpan = val.cell.rowSpan ?? 1;
                        if (rowSpan > 1) {
                            rowSpan = Math.max(1, rowSpan - count);
                            api.tableModifyCellSpan(this.__page, this.shape, val.rowIdx, val.colIdx, rowSpan, val.cell.colSpan ?? 1);
                        }
                    }
                })
            }
            const curHeight = removeWeight / total * this.shape.frame.height;
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width, this.shape.frame.height - curHeight);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    insertCol(idx: number, width: number, data?: any[]) {
        const total = this.shape.colWidths.reduce((pre, h) => pre + h, 0);
        const weight = width / this.shape.frame.width * total;
        const api = this.__repo.start('insertCol', {});
        try {
            api.tableInsertCol(this.__page, this.shape, idx, weight, data ?? []);
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width + width, this.shape.frame.height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    insertMultiCol(idx: number, width: number, count: number, data?: TableCell[][]) {
        const total = this.shape.colWidths.reduce((pre, h) => pre + h, 0);
        const weight = width / this.shape.frame.width * total;
        const api = this.__repo.start('insertMultiCol', {});
        try {
            for (let i = 0; i < count; ++i) {
                const d = data && data[i]
                api.tableInsertCol(this.__page, this.shape, idx + i, weight, d ?? []);
            }
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width + width * count, this.shape.frame.height);
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
            return;
        }

        const total = this.shape.colWidths.reduce((pre, w) => pre + w, 0);
        const api = this.__repo.start('removeCol', {});
        try {
            let removeWeight = 0;
            for (let i = 0; i < count; ++i) {
                removeWeight += this.shape.colWidths[idx];
                api.tableRemoveCol(this.__page, this.shape, idx);
            }
            // modify colSpan
            if (idx > 0) {
                const cells = this.shape.getVisibleCells(0, this.shape.rowCount, idx - 1, idx - 1);
                cells.forEach((val) => {
                    if (val.cell) {
                        let colSpan = val.cell.colSpan ?? 1;
                        if (colSpan > 1) {
                            colSpan = Math.max(1, colSpan - count);
                            api.tableModifyCellSpan(this.__page, this.shape, val.rowIdx, val.colIdx, val.cell.rowSpan ?? 1, colSpan);
                        }
                    }
                })
            }
            const curWidth = removeWeight / total * this.shape.frame.width;
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width - curWidth, this.shape.frame.height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    removeRowAndCol(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {

        let rowCount = rowEnd - rowStart + 1;
        if (rowCount >= this.shape.rowHeights.length) {
            super.delete();
            return;
        }

        let colCount = colEnd - colStart + 1;
        if (colCount >= this.shape.colWidths.length) {
            super.delete();
            return;
        }

        const colTotal = this.shape.widthTotalWeights;
        const rowTotal = this.shape.heightTotalWeights;

        const api = this.__repo.start('removeRowAndCol', {});
        try {
            let removeColWeight = 0;
            for (; colCount > 0; --colCount) {
                removeColWeight += this.shape.colWidths[colStart];
                api.tableRemoveCol(this.__page, this.shape, colStart);
            }
            const removeWidth = removeColWeight / colTotal * this.shape.frame.width;

            let removeRowWeight = 0;
            for (; rowCount > 0; --rowCount) {
                removeRowWeight += this.shape.rowHeights[rowStart];
                api.tableRemoveRow(this.__page, this.shape, rowStart);
            }
            const removeHeight = removeRowWeight / rowTotal * this.shape.frame.height;

            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width - removeWidth, this.shape.frame.height - removeHeight);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    private fixFrameByLayout(cell: TableCell, api: Api) {
        fixTableShapeFrameByLayout(api, this.__page, cell);
    }

    // text attr
    public setTextColor(color: Color | undefined, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const api = this.__repo.start("setTableTextColor", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyColor(this.__page, cell as any, 0, cell.text.length, color);
                    }
                })
            }
            else {
                api.tableModifyTextColor(this.__page, this.shape, color);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyColor(this.__page, cell as any, 0, cell.text.length, color);
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
    public setTextHighlightColor(color: Color | undefined, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const api = this.__repo.start("setTableTextHighlightColor", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyHighlightColor(this.__page, cell as any, 0, cell.text.length, color);
                    }
                })
            }
            else {
                api.tableModifyTextHighlightColor(this.__page, this.shape, color);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyHighlightColor(this.__page, cell as any, 0, cell.text.length, color);
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
        const api = this.__repo.start("setTableTextFontName", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyFontName(this.__page, cell as any, 0, cell.text.length, fontName);
                        this.fixFrameByLayout(cell, api);
                    }
                })
            }
            else {
                api.tableModifyTextFontName(this.__page, this.shape, fontName);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyFontName(this.__page, cell as any, 0, cell.text.length, fontName);
                        this.fixFrameByLayout(cell, api);
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
        const api = this.__repo.start("setTableTextFontSize", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyFontSize(this.__page, cell as any, 0, cell.text.length, fontSize);
                        this.fixFrameByLayout(cell, api);
                    }
                })
            }
            else {

                api.tableModifyTextFontSize(this.__page, this.shape, fontSize);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyFontSize(this.__page, cell as any, 0, cell.text.length, fontSize);
                        this.fixFrameByLayout(cell, api);
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
        const api = this.__repo.start("setTableTextVerAlign", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.shapeModifyTextVerAlign(this.__page, cell as any, verAlign);
                    }
                })
            }
            else {

                api.tableModifyTextVerAlign(this.__page, this.shape, verAlign);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.shapeModifyTextVerAlign(this.__page, cell as any, verAlign);
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
        const api = this.__repo.start("setTableTextHorAlign", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyHorAlign(this.__page, cell as any, horAlign, 0, cell.text.length);
                    }
                })
            }
            else {

                api.tableModifyTextHorAlign(this.__page, this.shape, horAlign);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyHorAlign(this.__page, cell as any, horAlign, 0, cell.text.length);
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

    public setLineHeight(lineHeight: number, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const api = this.__repo.start("setLineHeight", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        const length = cell.text.length;
                        api.textModifyMinLineHeight(this.__page, cell as any, lineHeight, 0, length);
                        api.textModifyMaxLineHeight(this.__page, cell as any, lineHeight, 0, length);
                        this.fixFrameByLayout(cell, api);
                    }
                })
            }
            else {
                api.tableModifyTextMinLineHeight(this.__page, this.shape, lineHeight);
                api.tableModifyTextMaxLineHeight(this.__page, this.shape, lineHeight);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        const length = cell.text.length;
                        api.textModifyMinLineHeight(this.__page, cell as any, lineHeight, 0, length);
                        api.textModifyMaxLineHeight(this.__page, cell as any, lineHeight, 0, length);
                        this.fixFrameByLayout(cell, api);
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
        const api = this.__repo.start("setTableCharSpace", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyKerning(this.__page, cell as any, kerning, 0, cell.text.length);
                        this.fixFrameByLayout(cell, api);
                    }
                })
            }
            else {
                api.tableModifyTextKerning(this.__page, this.shape, kerning);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyKerning(this.__page, cell as any, kerning, 0, cell.text.length);
                        this.fixFrameByLayout(cell, api);
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
        const api = this.__repo.start("setTableParaSpacing", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyParaSpacing(this.__page, cell as any, paraSpacing, 0, cell.text.length);
                        this.fixFrameByLayout(cell, api);
                    }
                })
            }
            else {
                api.tableModifyTextParaSpacing(this.__page, this.shape, paraSpacing);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyParaSpacing(this.__page, cell as any, paraSpacing, 0, cell.text.length);
                        this.fixFrameByLayout(cell, api);
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
        const api = this.__repo.start("setTableTextUnderline", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyUnderline(this.__page, cell as any, underline ? UnderlineType.Single : undefined, 0, cell.text.length);
                    }
                })
            }
            else {
                api.tableModifyTextUnderline(this.__page, this.shape, underline ? UnderlineType.Single : undefined);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyUnderline(this.__page, cell as any, underline ? UnderlineType.Single : undefined, 0, cell.text.length);
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
        const api = this.__repo.start("setTableTextStrikethrough", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyStrikethrough(this.__page, cell as any, strikethrough ? StrikethroughType.Single : undefined, 0, cell.text.length);
                    }
                })
            }
            else {
                api.tableModifyTextStrikethrough(this.__page, this.shape, strikethrough ? StrikethroughType.Single : undefined);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyStrikethrough(this.__page, cell as any, strikethrough ? StrikethroughType.Single : undefined, 0, cell.text.length);
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

    public setTextBold(bold: boolean, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const api = this.__repo.start("setTableTextBold", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyBold(this.__page, cell as any, bold, 0, cell.text.length);
                    }
                })
            }
            else {
                api.tableModifyTextBold(this.__page, this.shape, bold);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyBold(this.__page, cell as any, bold, 0, cell.text.length);
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

    public setTextItalic(italic: boolean, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const api = this.__repo.start("setTableTextItalic", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyItalic(this.__page, cell as any, italic, 0, cell.text.length);
                    }
                })
            }
            else {
                api.tableModifyTextItalic(this.__page, this.shape, italic);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyItalic(this.__page, cell as any, italic, 0, cell.text.length);
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
        const api = this.__repo.start("setTableTextTransform", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd)
                cells.forEach((c) => {
                    const cell = c.cell;
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyTransform(this.__page, cell as any, transform, 0, cell.text.length);
                        this.fixFrameByLayout(cell, api);
                    }
                })
            }
            else {
                api.tableModifyTextTransform(this.__page, this.shape, transform);
                const cells = this.shape.childs;
                cells.forEach((cell) => {
                    if (cell && cell.cellType === TableCellType.Text && cell.text) {
                        api.textModifyTransform(this.__page, cell as any, transform, 0, cell.text.length);
                        this.fixFrameByLayout(cell, api);
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

    public initTextCell(rowIdx: number, colIdx: number) { // 初始化为文本单元格
        const api = this.__repo.start("initCell", {});
        try {
            const text = newText(this.shape.textAttr);
            text.setTextBehaviour(TextBehaviour.Fixed);
            text.setPadding(5, 0, 3, 0);
            api.tableSetCellContentType(this.__page, this.shape, rowIdx, colIdx, TableCellType.Text);
            api.tableSetCellContentText(this.__page, this.shape, rowIdx, colIdx, text);
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    // fill
    public addFill(fill: Fill, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const api = this.__repo.start("addFill", {});
        try {
            if (range) {
                const imageMgr = fill.getImageMgr();
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd);
                cells.forEach((cell) => {
                    const newfill = importFill(fill);
                    if (imageMgr) newfill.setImageMgr(imageMgr);
                    if (cell.cell) {
                        api.addFillAt(this.__page, cell.cell, newfill, cell.cell.style.fills.length);
                    }
                    else {
                        // const c = this.shape.getCellAt(cell.rowIdx, cell.colIdx, true);
                        // if (!c) throw new Error("init cell fail?")
                        // api.addFillAt(this.__page, c, fill, c.style.fills.length); trap

                        const text = newText(this.shape.textAttr);
                        text.setTextBehaviour(TextBehaviour.Fixed);
                        text.setPadding(5, 0, 3, 0);
                        api.tableSetCellContentType(this.__page, this.shape, cell.rowIdx, cell.colIdx, TableCellType.Text);
                        api.tableSetCellContentText(this.__page, this.shape, cell.rowIdx, cell.colIdx, text);
                        const init_c = this.shape.getCellAt(cell.rowIdx, cell.colIdx);
                        if (!init_c) throw new Error("init cell fail?");
                        api.addFillAt(this.__page, init_c, newfill, 0);
                    }
                })
            }
            else {
                api.addFillAt(this.__page, this.__shape, fill, this.__shape.style.fills.length);
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public addFill4Multi(fill: Fill, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const api = this.__repo.start("addFill4Multi", {});
        try {
            const imageMgr = fill.getImageMgr();
            const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd);
            for (let i = 0, len = cells.length; i < len; i++) {
                const c = cells[i];
                const newfill = importFill(fill);
                if (imageMgr) newfill.setImageMgr(imageMgr);
                if (c.cell) {
                    api.deleteFills(this.__page, c.cell, 0, c.cell.style.fills.length);
                    api.addFillAt(this.__page, c.cell, newfill, 0);
                } else {
                    // const init_c = this.shape.getCellAt(c.rowIdx, c.colIdx, true);
                    // if (!init_c) throw new Error("init cell fail?"); trap
                    const text = newText(this.shape.textAttr);
                    text.setTextBehaviour(TextBehaviour.Fixed);
                    text.setPadding(5, 0, 3, 0);
                    api.tableSetCellContentType(this.__page, this.shape, c.rowIdx, c.colIdx, TableCellType.Text);
                    api.tableSetCellContentText(this.__page, this.shape, c.rowIdx, c.colIdx, text);
                    const init_c = this.shape.getCellAt(c.rowIdx, c.colIdx);
                    if (!init_c) continue;
                    api.addFillAt(this.__page, init_c, newfill, 0);
                }
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public setFillColor(idx: number, color: Color, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        // const fill: Fill = this.__shape.style.fills[idx];
        // if (!fill) return;

        const api = this.__repo.start("setFillColor", {});
        try {
            if (range) {
                this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                    if (cell.cell) api.setFillColor(this.__page, cell.cell, idx, color)
                })
            }
            else {
                api.setFillColor(this.__page, this.__shape, idx, color)
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    public setFillEnable(idx: number, value: boolean, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        const api = this.__repo.start("setFillEnable", {});
        try {
            if (range) {
                this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                    if (cell.cell) api.setFillEnable(this.__page, cell.cell, idx, value);
                })
            }
            else {
                api.setFillEnable(this.__page, this.__shape, idx, value);
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public deleteFill(idx: number, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        // const fill = this.__shape.style.fills[idx];
        // if (!fill) return;
        const api = this.__repo.start("deleteFill", {});
        try {
            if (range) {
                this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                    if (cell.cell) api.deleteFillAt(this.__page, cell.cell, idx);
                })
            }
            else {
                api.deleteFillAt(this.__page, this.__shape, idx);
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    // border
    public setBorderEnable(idx: number, isEnabled: boolean, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        // const border = this.__shape.style.borders[idx];
        // if (!border) return;
        const api = this.__repo.start("setBorderEnable", {});
        try {
            if (range) {
                this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                    if (cell.cell) api.setBorderEnable(this.__page, cell.cell, idx, isEnabled);
                })
            }
            else {
                api.setBorderEnable(this.__page, this.__shape, idx, isEnabled);
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public setBorderColor(idx: number, color: Color, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        // const border = this.__shape.style.borders[idx];
        // if (!border) return;

        const api = this.__repo.start("setBorderColor", {});
        try {
            if (range) {
                this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                    if (cell.cell) api.setBorderColor(this.__page, cell.cell, idx, color);
                })
            }
            else {
                api.setBorderColor(this.__page, this.__shape, idx, color);
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public setBorderThickness(idx: number, thickness: number, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        // const border = this.__shape.style.borders[idx];
        // if (!border) return;
        const api = this.__repo.start("setBorderThickness", {});
        try {
            if (range) {
                this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                    if (cell.cell) api.setBorderThickness(this.__page, cell.cell, idx, thickness);
                })
            }
            else {
                api.setBorderThickness(this.__page, this.__shape, idx, thickness);
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public setBorderPosition(idx: number, position: BorderPosition, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        // const border = this.__shape.style.borders[idx];
        // if (!border) return;
        const api = this.__repo.start("setBorderPosition", {});
        try {
            if (range) {
                this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                    if (cell.cell) api.setBorderPosition(this.__page, cell.cell, idx, position);
                })
            }
            else {
                api.setBorderPosition(this.__page, this.__shape, idx, position);
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public setBorderStyle(idx: number, borderStyle: BorderStyle, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        // const border = this.__shape.style.borders[idx];
        // if (!border) return;
        const api = this.__repo.start("setBorderStyle", {});
        try {
            if (range) {
                this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                    if (cell.cell) api.setBorderStyle(this.__page, cell.cell, idx, borderStyle);
                })
            }
            else {
                api.setBorderStyle(this.__page, this.__shape, idx, borderStyle);
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    public deleteBorder(idx: number, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        // const border = this.__shape.style.borders[idx];
        // if (!border) return;
        const api = this.__repo.start("deleteBorder", {});
        try {
            if (range) {
                this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                    if (cell.cell) api.deleteBorderAt(this.__page, cell.cell, idx)
                })
            }
            else {
                api.deleteBorderAt(this.__page, this.__shape, idx)
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public addBorder(border: Border, range?: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        border.position = BorderPosition.Center; // 只支持居中
        const api = this.__repo.start("addBorder", {});
        try {
            if (range) {
                const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd);
                cells.forEach((cell) => {
                    const newborder = importBorder(border);
                    if (cell.cell) {
                        api.addBorderAt(this.__page, cell.cell, newborder, cell.cell.style.borders.length);
                    }
                    else {
                        const text = newText(this.shape.textAttr);
                        text.setTextBehaviour(TextBehaviour.Fixed);
                        text.setPadding(5, 0, 3, 0);
                        api.tableSetCellContentType(this.__page, this.shape, cell.rowIdx, cell.colIdx, TableCellType.Text);
                        api.tableSetCellContentText(this.__page, this.shape, cell.rowIdx, cell.colIdx, text);
                        const c = this.shape.getCellAt(cell.rowIdx, cell.colIdx);
                        if (!c) throw new Error("init cell fail?")
                        api.addBorderAt(this.__page, c, newborder, c.style.borders.length);
                    }
                })
            }
            else {
                api.addBorderAt(this.__page, this.__shape, border, this.__shape.style.borders.length);
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    public addBorder4Multi(border: Border, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }) {
        border.position = BorderPosition.Center; // 只支持居中
        const api = this.__repo.start("addBorder4Multi", {});
        try {
            const cells = this.shape.getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd);
            for (let i = 0, len = cells.length; i < len; i++) {
                const newborder = importBorder(border);
                const c = cells[i];
                if (c.cell) {
                    api.deleteBorders(this.__page, c.cell, 0, c.cell.style.borders.length);
                    api.addBorderAt(this.__page, c.cell, newborder, 0);
                } else {
                    const text = newText(this.shape.textAttr);
                    text.setTextBehaviour(TextBehaviour.Fixed);
                    text.setPadding(5, 0, 3, 0);
                    api.tableSetCellContentType(this.__page, this.shape, c.rowIdx, c.colIdx, TableCellType.Text);
                    api.tableSetCellContentText(this.__page, this.shape, c.rowIdx, c.colIdx, text);
                    const init_c = this.shape.getCellAt(c.rowIdx, c.colIdx);
                    if (!init_c) continue;
                    api.addBorderAt(this.__page, init_c, newborder, 0);
                }
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
}