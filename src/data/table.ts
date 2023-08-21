import { Border, Fill, Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, ResourceMgr } from "./basic";
import { ShapeType, ShapeFrame, TableCellType } from "./baseclasses"
import { Shape } from "./shape";
import { Path } from "./path";
import { Text, TextAttr } from "./text"
import { TextLayout } from "./textlayout";
import { TableGridItem, TableLayout, layoutTable } from "./tablelayout";
import { tableInsertCol, tableInsertRow, tableRemoveCol, tableRemoveRow } from "./tableedit";
import { locateCell } from "./tablelocate";
import { getTableCells, getTableNotCoveredCells, getTableVisibleCells } from "./tableread";
import { uuid } from "../basic/uuid";
export { TableLayout, TableGridItem } from "./tablelayout";
export { TableCellType } from "./baseclasses";


export class TableCell extends Shape implements classes.TableCell {

    typeId = 'table-cell'
    cellType?: TableCellType
    text?: Text
    imageRef?: string
    rowSpan?: number
    colSpan?: number

    private __cacheData?: { buff: Uint8Array, base64: string };

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

    static getPathOfFrame(frame: ShapeFrame): Path {
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
    peekImage() {
        return this.__cacheData?.base64;
    }
    // image shape
    async loadImage(): Promise<string> {
        if (this.__cacheData) return this.__cacheData.base64;
        if (!this.imageRef) return "";
        const mediaMgr = (this.parent as TableShape).__imageMgr;
        this.__cacheData = mediaMgr && await mediaMgr.get(this.imageRef)
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
        const indexCell = table.indexOfCell(this);
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

    // 这个设计不太好？
    setCellSpan(rowSpan: number | undefined, colSpan: number | undefined) {
        rowSpan = rowSpan && rowSpan <= 1 ? undefined : rowSpan;
        colSpan = colSpan && colSpan <= 1 ? undefined : colSpan;
        this.rowSpan = rowSpan;
        this.colSpan = colSpan;
        if (this.text) this.text.reLayout();
        const parent = this.parent;
        if (parent) (parent as TableShape).reLayout();
    }

    onRollback(): void {
        if (this.text) this.text.reLayout();
        const parent = this.parent;
        if (parent) (parent as TableShape).reLayout();
    }
}

export function newCell(): TableCell {
    return new TableCell(uuid(), "", ShapeType.TableCell, new ShapeFrame(0, 0, 0, 0), new Style(
        new BasicArray<Border>(),
        new BasicArray<Fill>()
    ))
}

export class TableShape extends Shape implements classes.TableShape {
    typeId = 'table-shape'
    childs: BasicArray<(TableCell | undefined)>
    rowHeights: BasicArray<number>
    colWidths: BasicArray<number>
    textAttr?: TextAttr // 文本默认属性

    __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    private __layout?: TableLayout;
    private __cellIndexs: Map<string, number> = new Map();

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(TableCell | undefined)>,
        rowHeights: BasicArray<number>,
        colWidths: BasicArray<number>
    ) {
        super(
            id,
            name,
            ShapeType.Table,
            frame,
            style,
        )
        this.rowHeights = rowHeights
        this.colWidths = colWidths
        this.childs = childs;
    }

    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }

    get childsVisible(): boolean {
        return false;
    }

    get rowCount() {
        return this.rowHeights.length;
    }

    get colCount() {
        return this.colWidths.length;
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
    insertRow(idx: number, height: number, data: (TableCell | undefined)[]) {
        tableInsertRow(this, idx, height, data);
        this.reLayout();
    }
    removeRow(idx: number): (TableCell | undefined)[] {
        const ret = tableRemoveRow(this, idx);
        this.reLayout();
        return ret;
    }
    insertCol(idx: number, width: number, data: (TableCell | undefined)[]) {
        tableInsertCol(this, idx, width, data);
        this.reLayout();
    }
    removeCol(idx: number): (TableCell | undefined)[] {
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

    onRollback(): void {
        this.reLayout();
    }

    reLayout() {
        this.__layout = undefined;
        this.__cellIndexs.clear();
    }

    locateCell(x: number, y: number): (TableGridItem & { cell: TableCell | undefined }) | undefined {
        const item = locateCell(this.getLayout(), x, y) as (TableGridItem & { cell: TableCell | undefined }) | undefined;
        if (item) item.cell = this.getCellAt(item.index.row, item.index.col);
        return item;
    }

    locateCell2(cell: TableCell): (TableGridItem & { cell: TableCell | undefined }) | undefined {
        const index = this.indexOfCell(cell);
        if (!index || !index.visible) return;
        const item = this.getLayout().grid.get(index.rowIdx, index.colIdx);
        if (!item) return;
        return {
            index: item.index,
            frame: item.frame,
            span: item.span,
            cell
        }
    }

    private getCellIndexs() {
        if (this.__cellIndexs.size === 0) {
            this.childs.forEach((c, i) => {
                if (c) this.__cellIndexs.set(c.id, i);
            })
        }
        return this.__cellIndexs;
    }

    indexOfCell(cell: TableCell): { rowIdx: number, colIdx: number, visible: boolean } | undefined {
        // cell indexs
        const cellIndexs = this.getCellIndexs();
        const index = cellIndexs.get(cell.id) ?? -1;
        if (index < 0) return;
        const rowIdx = Math.floor(index / this.colCount);
        const colIdx = index % this.colCount;

        const layout = this.getLayout();
        const item = layout.grid.get(rowIdx, colIdx);
        const visible = item.index.row === rowIdx && item.index.col === colIdx;
        return { rowIdx, colIdx, visible }
    }

    /**
     * [rowStart, rowEnd], [colStart, colEnd] 左闭右闭区间
     * @param rowStart 
     * @param rowEnd 
     * @param colStart 
     * @param colEnd 
     * @param visible 
     * @returns 
     */
    getCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number): { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] {
        return getTableCells(this, rowStart, rowEnd, colStart, colEnd);
    }

    getCellAt(rowIdx: number, colIdx: number, initCell: boolean = false): (TableCell | undefined) {
        if (rowIdx < 0 || colIdx < 0 || rowIdx >= this.rowCount || colIdx >= this.colCount) {
            throw new Error("cell index outof range: " + rowIdx + " " + colIdx)
        }
        const index = rowIdx * this.colWidths.length + colIdx;
        const cell = this.childs[index];
        if (!cell && initCell) {
            return this.initCell(index);
        }
        return cell;
    }

    private initCell(index: number) {
        this.childs[index] = newCell();
        // add to index
        const cell = this.childs[index];
        this.getCellIndexs().set(cell!.id, index);
        return cell;
    }

    /**
     * 获取未被覆盖的单元格
     * @param rowStart 
     * @param rowEnd 
     * @param colStart 
     * @param colEnd 
     * @returns 
     */
    getNotCoveredCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number): { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] {
        return getTableNotCoveredCells(this, rowStart, rowEnd, colStart, colEnd);
    }

    /**
     * 获取用户可见的单元格
     * @param rowStart 
     * @param rowEnd 
     * @param colStart 
     * @param colEnd 
     * @returns 
     */
    getVisibleCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number): { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] {
        return getTableVisibleCells(this, rowStart, rowEnd, colStart, colEnd);
    }
}