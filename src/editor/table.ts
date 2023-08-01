import { TableCell, TableShape } from "../data/table";
import { ShapeEditor } from "./shape";
import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
import { newImageShape, newTextShape } from "./creator";
import { ShapeFrame } from "../data/baseclasses";
import { ResourceMgr } from "../data/basic";

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

    setCellContentImage(cell: TableCell, ref: string, mediasMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>, name?: string) {
        const frame = new ShapeFrame(0, 0, cell.frame.width, cell.frame.height);
        const image = newImageShape(name || "", frame, ref, mediasMgr);
        const api = this.__repo.start('setCellContentImage', {});
        api.tableSetCellContent(this.__page, cell, image);
        this.__repo.commit();
    }

    setCellContentText(cell: TableCell, name?: string) {
        const frame = new ShapeFrame(0, 0, cell.frame.width, cell.frame.height);
        const text = newTextShape(name || "", frame)
        const api = this.__repo.start('setCellContentText', {});
        api.tableSetCellContent(this.__page, cell, text);
        this.__repo.commit();
    }
}