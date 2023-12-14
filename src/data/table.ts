import { Border, Fill, Style, Shadow } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, ResourceMgr } from "./basic";
import { ShapeType, ShapeFrame, TableCellType } from "./baseclasses"
import { Shape, Variable } from "./shape";
import { Path } from "./path";
import { Text, TextAttr } from "./text"
import { TextLayout } from "./textlayout";
import { TableGridItem, TableLayout, layoutTable } from "./tablelayout";
import { tableInsertCol, tableInsertRow, tableRemoveCol, tableRemoveRow } from "./tableedit";
import { locateCell, locateCellIndex } from "./tablelocate";
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

    get shapeId(): (string | { rowIdx: number, colIdx: number })[] {
        const table = this.parent as TableShape;
        const indexCell = table.indexOfCell2(this);
        if (!indexCell) throw new Error("cell has no index?")
        return [table.id, indexCell];
    }

    /**
     * 没有实例化cell前使用来画边框
     * @param frame 
     * @returns 
     */
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

    getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {
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
    private __startLoad: boolean = false;
    peekImage(startLoad: boolean = false) {
        const ret = this.__cacheData?.base64;
        if (ret) return ret;
        if (!this.imageRef) return "";
        if (startLoad && !this.__startLoad) {
            this.__startLoad = true;
            const mediaMgr = (this.parent as TableShape).__imageMgr;
            mediaMgr && mediaMgr.get(this.imageRef).then((val) => {
                if (!this.__cacheData) {
                    this.__cacheData = val;
                    if (val) this.notify();
                }
            })
        }
        return ret;
    }
    // image shape
    async loadImage(): Promise<string> {
        if (this.__cacheData) return this.__cacheData.base64;
        if (!this.imageRef) return "";
        const mediaMgr = (this.parent as TableShape).__imageMgr;
        this.__cacheData = mediaMgr && await mediaMgr.get(this.imageRef)
        if (this.__cacheData) this.notify();
        return this.__cacheData && this.__cacheData.base64 || "";
    }

    // text
    setFrameSize(w: number, h: number) {
        super.setFrameSize(w, h);
        if (this.text) this.text.updateSize(this.frame.width, this.frame.height)
    }

    getText(): Text {
        if (!this.text) throw new Error("");
        return this.text;
    }

    getLayout(): TextLayout | undefined {
        if (!this.text) return;
        const table = this.parent as TableShape;
        const indexCell = table.indexOfCell2(this);
        if (!indexCell) return;

        const rowSpan = Math.max(this.rowSpan ?? 1, 1);
        const colSpan = Math.max(this.colSpan ?? 1, 1);

        let widthWeight = table.colWidths[indexCell.colIdx];
        for (let i = 1; i < colSpan; ++i) {
            widthWeight += table.colWidths[indexCell.colIdx + i];
        }
        let heightWeight = table.rowHeights[indexCell.rowIdx];
        for (let i = 1; i < rowSpan; ++i) {
            heightWeight += table.rowHeights[indexCell.rowIdx + i];
        }

        const width = widthWeight / table.widthTotalWeights * table.frame.width;
        const height = heightWeight / table.heightTotalWeights * table.frame.height;
        this.text.updateSize(width, height);

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
        new BasicArray<Fill>(),
        new BasicArray<Shadow>()
    ))
}

export class TableShape extends Shape implements classes.TableShape {

    static MinCellSize = 10;
    static MaxRowCount = 50;
    static MaxColCount = 50;

    typeId = 'table-shape'
    datas: BasicArray<(TableCell | undefined)>
    rowHeights: BasicArray<number>
    colWidths: BasicArray<number>
    textAttr?: TextAttr // 文本默认属性

    __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    private __layout?: TableLayout;
    private __cellIndexs: Map<string, number> = new Map();
    private __heightTotalWeights: number;
    private __widthTotalWeights: number;

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        datas: BasicArray<(TableCell | undefined)>,
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
        this.datas = datas;
        this.datas.setTypeId('cells');
        this.__heightTotalWeights = rowHeights.reduce((pre, cur) => pre + cur, 0);
        this.__widthTotalWeights = colWidths.reduce((pre, cur) => pre + cur, 0);
    }

    getTarget(targetId: (string | { rowIdx: number, colIdx: number })[]): Shape | Variable | undefined {
        if (targetId.length > 0 && typeof targetId[0] !== 'string') {
            const index = targetId[0];
            const cell = this.getCellAt(index.rowIdx, index.colIdx, true);
            if (!cell) throw new Error("table cell not find")
            return cell.getTarget(targetId.slice(1))
        }
        return this;
    }

    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }

    get naviChilds(): Shape[] | undefined {
        return undefined;
    }

    /**
     * @deprecated
     */
    get childs() {
        return this.datas;
    }

    get widthTotalWeights() {
        return this.__widthTotalWeights;
    }
    get heightTotalWeights() {
        return this.__heightTotalWeights;
    }
    get rowCount() {
        return this.rowHeights.length;
    }
    get colCount() {
        return this.colWidths.length;
    }

    getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {
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
        const rowHBase = this.heightTotalWeights;
        return rowHeights.map((val) => val / rowHBase * height);
    }
    insertRow(idx: number, weight: number, data: (TableCell | undefined)[]) {
        tableInsertRow(this, idx, weight, data);
        this.__heightTotalWeights += weight;
        this.reLayout();
    }
    removeRow(idx: number): (TableCell | undefined)[] {
        const weight = this.rowHeights[idx];
        const ret = tableRemoveRow(this, idx);
        this.__heightTotalWeights -= weight;
        this.reLayout();
        return ret;
    }
    insertCol(idx: number, weight: number, data: (TableCell | undefined)[]) {
        tableInsertCol(this, idx, weight, data);
        this.__widthTotalWeights += weight;
        this.reLayout();
    }
    removeCol(idx: number): (TableCell | undefined)[] {
        const weight = this.colWidths[idx];
        const ret = tableRemoveCol(this, idx);
        this.__widthTotalWeights -= weight;
        this.reLayout();
        return ret;
    }

    setColWidth(idx: number, weight: number) {
        const colWidths = this.colWidths;
        const origin = colWidths[idx];
        colWidths[idx] = weight;
        this.__widthTotalWeights -= origin;
        this.__widthTotalWeights += weight;
        this.reLayout();
    }

    setRowHeight(idx: number, weight: number) {
        const rowHeights = this.rowHeights;
        const origin = rowHeights[idx];
        rowHeights[idx] = weight;
        this.__heightTotalWeights -= origin;
        this.__heightTotalWeights += weight;
        this.reLayout();
    }

    setFrameSize(w: number, h: number) {
        super.setFrameSize(w, h);
        this.reLayout();
    }

    onRollback(from: string): void {
        if (from !== "composingInput") {
            this.reLayout();
            return;
        }
        const widthTotalWeights = this.colWidths.reduce((p, c) => p + c, 0);
        const heightTotalWeights = this.rowHeights.reduce((p, c) => p + c, 0);
        if (this.__widthTotalWeights !== widthTotalWeights ||
            this.__heightTotalWeights !== heightTotalWeights) {
            this.__widthTotalWeights = widthTotalWeights;
            this.__heightTotalWeights = heightTotalWeights;
            this.__layout = undefined;
        }
    }

    reLayout() {
        this.__widthTotalWeights = this.colWidths.reduce((p, c) => p + c, 0);
        this.__heightTotalWeights = this.rowHeights.reduce((p, c) => p + c, 0);
        this.__layout = undefined;
        this.__cellIndexs.clear();
    }

    locateCell(x: number, y: number): (TableGridItem & { cell: TableCell | undefined }) | undefined {
        const item = locateCell(this.getLayout(), x, y) as (TableGridItem & { cell: TableCell | undefined }) | undefined;
        if (item) item.cell = this.getCellAt(item.index.row, item.index.col);
        return item;
    }

    locateCellIndex(x: number, y: number): { row: number, col: number } | undefined {
        return locateCellIndex(this.getLayout(), x, y);
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
            this.datas.forEach((c, i) => {
                if (c) this.__cellIndexs.set(c.id, i);
            })
        }
        return this.__cellIndexs;
    }

    indexOfCell2(cell: TableCell): { rowIdx: number, colIdx: number } | undefined {
        // cell indexs
        const cellIndexs = this.getCellIndexs();
        const index = cellIndexs.get(cell.id) ?? -1;
        if (index < 0) return;
        const rowIdx = Math.floor(index / this.colCount);
        const colIdx = index % this.colCount;
        return { rowIdx, colIdx }
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
        const cell = this.datas[index];
        if (!cell && initCell) {
            return this.initCell(index);
        }
        return cell;
    }

    private initCell(index: number) {
        this.datas[index] = newCell();
        // add to index
        const cell = this.datas[index];
        // this.getCellIndexs().set(cell!.id, index);
        if (this.__cellIndexs.size > 0) {
            this.__cellIndexs.set(cell!.id, index)
        }
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
        return getTableNotCoveredCells(this, this.getLayout(), rowStart, rowEnd, colStart, colEnd);
    }

    /**
     * 获取用户可见的单元格
     * @param rowStart 
     * @param rowEnd 
     * @param colStart 
     * @param colEnd 
     * @returns 
     */
    getVisibleCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number): {
        cell: TableCell | undefined,
        rowIdx: number,
        colIdx: number
    }[] {
        return getTableVisibleCells(this, this.getLayout(), rowStart, rowEnd, colStart, colEnd);
    }
}