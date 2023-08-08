import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, ResourceMgr } from "./basic";
import { ShapeType, ShapeFrame, TableCellType } from "./baseclasses"
import { GroupShape, Shape } from "./shape";
import { Path } from "./path";
import { Text } from "./text"
import { TextLayout } from "./textlayout";
import { TableGridItem, TableLayout, layoutTable } from "./tablelayout";
import { tableInsertCol, tableInsertRow, tableRemoveCol, tableRemoveRow } from "./tableedit";
import { indexOfCell, locateCell } from "./tablelocate";
export { TableLayout, TableGridItem } from "./tablelayout";
export { TableCellType } from "./baseclasses";

export class TableCell extends Shape implements classes.TableCell {
    typeId = 'table-cell'
    cellType?: TableCellType
    text?: Text
    imageRef?: string
    rowSpan?: number
    colSpan?: number
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame, // cell里的frame是无用的，真实的位置大小通过行高列宽计算
        style: Style
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
    }
    getPath(): Path {
        const x = 0;
        const y = 0;
        const w = this.frame.width;
        const h = this.frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return new Path(path);
    }

    getPathOfFrame(frame: ShapeFrame): Path {
        const x = 0;
        const y = 0;
        const w = frame.width;
        const h = frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return new Path(path);
    }

    isImageCell() {
        return this.cellType === TableCellType.Image;
    }
    isTextCell() {
        return this.cellType === TableCellType.Text;
    }

    // image
    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }
    peekImage() {
        return this.__cacheData?.base64;
    }
    // image shape
    async loadImage(): Promise<string> {
        if (this.__cacheData) return this.__cacheData.base64;
        this.__cacheData = this.__imageMgr && await this.__imageMgr.get(this.imageRef)
        return this.__cacheData && this.__cacheData.base64 || "";
    }

    // text
    setFrameSize(w: number, h: number) {
        super.setFrameSize(w, h);
        if (this.text) this.text.updateSize(this.frame.width, this.frame.height)
    }

    getLayout(): TextLayout | undefined {
        if (!this.text) return;
        const table = this.parent as TableShape;
        const indexCell = indexOfCell(table, this);
        if (!indexCell || !indexCell.visible) return;

        const total = table.colWidths.reduce((pre, cur) => pre + cur, 0);
        const colSpan = this.colSpan ?? 1;
        let weight = table.colWidths[indexCell.colIdx];
        for (let i = 1; i < colSpan; ++i) {
            weight += table.colWidths[indexCell.colIdx + i];
        }

        const width = weight / total * table.frame.width;
        this.text.updateSize(width, 0);
        return this.text.getLayout();
    }

    setContentType(contentType: TableCellType | undefined) {
        contentType = contentType === TableCellType.None ? undefined : contentType;
        this.cellType = contentType;
    }

    setContentText(text: Text | undefined) {
        this.text = text;
    }

    setContentImage(ref: string | undefined) {
        this.imageRef = ref;
    }
    setCellSpan(rowSpan: number | undefined, colSpan: number | undefined) {
        rowSpan = rowSpan && rowSpan <= 1 ? undefined : rowSpan;
        colSpan = colSpan && colSpan <= 1 ? undefined : colSpan;
        this.rowSpan = rowSpan;
        this.colSpan = colSpan;
        if (this.text) this.text.reLayout();
    }
}

export class TableShape extends GroupShape implements classes.TableShape {
    typeId = 'table-shape'
    rowHeights: BasicArray<number>
    colWidths: BasicArray<number>

    private __layout?: TableLayout;
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<TableCell>,
        rowHeights: BasicArray<number>,
        colWidths: BasicArray<number>
    ) {
        super(
            id,
            name,
            ShapeType.Table,
            frame,
            style,
            childs
        )
        this.rowHeights = rowHeights
        this.colWidths = colWidths
    }

    get childsVisible(): boolean {
        return false;
    }

    getPath(): Path {
        const x = 0;
        const y = 0;
        const w = this.frame.width;
        const h = this.frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return new Path(path);
    }
    getLayout(): TableLayout {
        if (!this.__layout) this.__layout = layoutTable(this);
        return this.__layout;
    }
    getColWidths() {
        const frame = this.frame;
        const width = frame.width;
        const colWidths = this.colWidths;
        const colWBase = colWidths.reduce((sum, cur) => sum + cur, 0);
        return colWidths.map((val) => val / colWBase * width);
    }
    getRowHeights() {
        const frame = this.frame;
        const height = frame.height;
        const rowHeights = this.rowHeights;
        const rowHBase = rowHeights.reduce((sum, cur) => sum + cur, 0);
        return rowHeights.map((val) => val / rowHBase * height);
    }
    insertRow(idx: number, height: number, data?: any[]) {
        tableInsertRow(this, idx, height, data);
        this.reLayout();
    }
    removeRow(idx: number): TableCell[] {
        const ret = tableRemoveRow(this, idx);
        this.reLayout();
        return ret;
    }
    insertCol(idx: number, width: number, data?: any[]) {
        tableInsertCol(this, idx, width, data);
        this.reLayout();
    }
    removeCol(idx: number): TableCell[] {
        const ret = tableRemoveCol(this, idx);
        this.reLayout();
        return ret;
    }

    setColWidth(idx: number, width: number) {
        const colWidths = this.colWidths;
        colWidths[idx] = width;
        this.reLayout();
    }

    setRowHeight(idx: number, height: number) {
        const rowHeights = this.rowHeights;
        rowHeights[idx] = height;
        this.reLayout();
    }

    setFrameSize(w: number, h: number) {
        super.setFrameSize(w, h);
        this.reLayout();
    }

    private reLayout() {
        this.__layout = undefined;
    }

    locateCell(x: number, y: number): TableGridItem | undefined {
        return locateCell(this.getLayout(), x, y);
    }

    indexOfCell(cell: TableCell) {
        return indexOfCell(this, cell);
    }
}