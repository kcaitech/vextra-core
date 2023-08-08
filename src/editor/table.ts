import { TableCell, TableShape } from "../data/table";
import { ShapeEditor } from "./shape";
import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
import { newText } from "./creator";
import { TableCellType, TextBehaviour } from "../data/baseclasses";

export class TableEditor extends ShapeEditor {

    constructor(shape: TableShape, page: Page, repo: CoopRepository) {
        super(shape, page, repo)
    }

    get shape(): TableShape {
        return this.__shape as TableShape;
    }

    // 水平拆分单元格
    horSplitCell(cell: TableCell) {

    }
    // 垂直拆分单元格
    verSplitCell(cell: TableCell) {

    }
    // 合并单元格
    mergeCells(cells: TableCell[]) {

    }

    setCellContentImage(cell: TableCell, ref: string) {
        const api = this.__repo.start('setCellContentImage', {});
        try {
            api.tableSetCellContentType(this.__page, cell, TableCellType.Image);
            api.tableSetCellContentImage(this.__page, cell, ref);
            api.tableSetCellContentText(this.__page, cell, undefined);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    setCellContentText(cell: TableCell, text?: string) {
        const _text = newText();
        _text.setTextBehaviour(TextBehaviour.Fixed);
        if (text && text.length > 0) _text.insertText(text, 0);
        const api = this.__repo.start('setCellContentText', {});
        try {
            api.tableSetCellContentType(this.__page, cell, TableCellType.Text);
            api.tableSetCellContentText(this.__page, cell, _text);
            api.tableSetCellContentImage(this.__page, cell, undefined);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
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

    adjColWidth(fromIdx: number, toIdx: number, width: number) {

    }

    // 调整行高
    setRowHeight(idx: number, height: number) {
        const total = this.shape.rowHeights.reduce((pre, h) => pre + h, 0);
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

    adjRowHeight(fromIdx: number, toIdx: number, height: number) {

    }

    insertRow(idx: number, height: number, data?: TableCell[]) {
        const total = this.shape.rowHeights.reduce((pre, h) => pre + h, 0);
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

    removeRow(idx: number) {
        const total = this.shape.rowHeights.reduce((pre, h) => pre + h, 0);
        const curHeight = this.shape.rowHeights[idx] / total * this.shape.frame.height;
        const api = this.__repo.start('removeRow', {});
        try {
            api.tableRemoveRow(this.__page, this.shape, idx);
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

    removeCol(idx: number) {
        const total = this.shape.colWidths.reduce((pre, w) => pre + w, 0);
        const curWidth = this.shape.colWidths[idx] / total * this.shape.frame.width;
        const api = this.__repo.start('removeCol', {});
        try {
            api.tableRemoveCol(this.__page, this.shape, idx);
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width - curWidth, this.shape.frame.height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }
}