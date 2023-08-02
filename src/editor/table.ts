import { TableCell, TableShape } from "../data/table";
import { ShapeEditor } from "./shape";
import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
import { newImageShape, newText, newTextShape } from "./creator";
import { ShapeFrame, TableCellType } from "../data/baseclasses";
import { ResourceMgr } from "../data/basic";
import { Text } from "data/text";

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
        api.tableSetCellContent(this.__page, cell, TableCellType.Image, ref);
        this.__repo.commit();
    }

    setCellContentText(cell: TableCell, text?: string) {
        const api = this.__repo.start('setCellContentText', {});
        const _text = newText();
        if (text && text.length > 0) _text.insertText(text, 0);
        api.tableSetCellContent(this.__page, cell, TableCellType.Text, _text);
        this.__repo.commit();
    }
}