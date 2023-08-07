import { TableCell, TableShape } from "../data/table";
import { ShapeEditor } from "./shape";
import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
import { newText } from "./creator";
import { TableCellType } from "../data/baseclasses";

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
    // 调整行高
    // 调整列宽

    setCellContentImage(cell: TableCell, ref: string) {
        const api = this.__repo.start('setCellContentImage', {});
        api.tableSetCellContentType(this.__page, cell, TableCellType.Image);
        api.tableSetCellContentImage(this.__page, cell, ref);
        api.tableSetCellContentText(this.__page, cell, undefined);
        this.__repo.commit();
    }

    setCellContentText(cell: TableCell, text?: string) {
        const api = this.__repo.start('setCellContentText', {});
        const _text = newText();
        if (text && text.length > 0) _text.insertText(text, 0);
        api.tableSetCellContentType(this.__page, cell, TableCellType.Text);
        api.tableSetCellContentText(this.__page, cell, _text);
        api.tableSetCellContentImage(this.__page, cell, undefined);
        this.__repo.commit();
    }

    setColWidth(idx: number, width: number) {

    }

    adjColWidth(fromIdx: number, toIdx: number, width: number) {

    }

    setRowHeight(idx: number, height: number) {

    }

    adjRowHeight(fromIdx: number, toIdx: number, height: number) {

    }

    insertRow(idx: number, height: number, data?: any[]) {

    }

    removeRow(idx: number) {

    }

    insertCol(idx: number, width: number, data?: any[]) {

    }

    removeCol(idx: number) {

    }
}