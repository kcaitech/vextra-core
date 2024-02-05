import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, BasicMap, ResourceMgr } from "./basic";
import { ShapeType, ShapeFrame, TableCellType } from "./baseclasses"
import { Shape, Variable } from "./shape";
import { Path } from "./path";
import { Para, Span, Text, TextAttr } from "./text"
import { TextLayout } from "./textlayout";
import { LayoutItem, TableGridItem, TableLayout, layoutTable } from "./tablelayout";
import { locateCell, locateCellIndex } from "./tablelocate";
import { getTableCells, getTableNotCoveredCells, getTableVisibleCells } from "./tableread";
import { CrdtNumber, CrdtIndex } from "./crdt";
import { CursorLocate, TextLocate, locateCursor, locateRange, locateText } from "./textlocate";
export { TableLayout, TableGridItem } from "./tablelayout";
export { TableCellType } from "./baseclasses";

export function newText(content: string): Text {
    const text = new Text(new BasicArray());
    const para = new Para(content + '\n', new BasicArray());
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    return text;
}

export class TableCell extends Shape implements classes.TableCell {

    typeId = 'table-cell'
    cellType?: TableCellType
    text?: Text
    imageRef?: string
    rowSpan?: number
    colSpan?: number

    private __cacheData?: { buff: Uint8Array, base64: string };

    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame, // cell里的frame是无用的，真实的位置大小通过行高列宽计算
        style: Style
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
    }

    getOpTarget(path: string[]) {
        if (path.length === 0) return this;
        if (path[0] === 'text') {
            if (!this.text) this.text = newText("");
            return this.text?.getOpTarget(path.slice(1));
        }
        return super.getOpTarget(path);
    }

    getCrdtPath(): string[] {
        const cells = this.__parent;
        if (!cells) throw new Error("cell not inside table?");
        return cells.getCrdtPath().concat(this.id);
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
    // setFrameSize(w: number, h: number) {
    //     super.setFrameSize(w, h);
    //     if (this.text) this.text.updateSize(this.frame.width, this.frame.height)
    // }

    getText(): Text {
        if (!this.text) throw new Error("");
        return this.text;
    }

    // todo
    __layoutToken: string | undefined;

    getLayout(): TextLayout | undefined {
        if (!this.text) return;
        const table = this.parent as TableShape;
        const indexCell = table.indexOfCell2(this);
        if (!indexCell) return;

        const rowSpan = Math.max(this.rowSpan ?? 1, 1);
        const colSpan = Math.max(this.colSpan ?? 1, 1);

        let widthWeight = table.colWidths[indexCell.colIdx].value;
        for (let i = 1; i < colSpan; ++i) {
            widthWeight += table.colWidths[indexCell.colIdx + i].value;
        }
        let heightWeight = table.rowHeights[indexCell.rowIdx].value;
        for (let i = 1; i < rowSpan; ++i) {
            heightWeight += table.rowHeights[indexCell.rowIdx + i].value;
        }

        const width = widthWeight / table.widthTotalWeights * table.frame.width;
        const height = heightWeight / table.heightTotalWeights * table.frame.height;
        // this.text.updateSize(width, height);

        const layout = this.text.getLayout3(width, height, this.id, this.__layoutToken);

        this.__layoutToken = layout.token;
        return layout.layout;
    }

    locateText(x: number, y: number): TextLocate {
        return locateText(this.getLayout()!, x, y);
    }
    locateCursor(index: number, cursorAtBefore: boolean): CursorLocate | undefined {
        return locateCursor(this.getLayout()!, index, cursorAtBefore);
    }
    locateRange(start: number, end: number): { x: number, y: number }[] {
        return locateRange(this.getLayout()!, start, end);
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

// export function newCell(): TableCell {
//     return new TableCell(uuid(), "", ShapeType.TableCell, new ShapeFrame(0, 0, 0, 0), new Style(
//         new BasicArray<Border>(),
//         new BasicArray<Fill>(),
//         new BasicArray<Shadow>()
//     ))
// }

export class TableShape extends Shape implements classes.TableShape {

    static MinCellSize = 10;
    static MaxRowCount = 50;
    static MaxColCount = 50;

    typeId = 'table-shape'
    cells: BasicMap<string, TableCell>
    rowHeights: BasicArray<CrdtNumber>
    colWidths: BasicArray<CrdtNumber>
    textAttr?: TextAttr // 文本默认属性

    __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    private __layout: LayoutItem = new LayoutItem();
    private __heightTotalWeights: number;
    private __widthTotalWeights: number;

    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        cells: BasicMap<string, TableCell>,
        rowHeights: BasicArray<CrdtNumber>,
        colWidths: BasicArray<CrdtNumber>
    ) {
        super(
            crdtidx,
            id,
            name,
            ShapeType.Table,
            frame,
            style,
        )
        this.rowHeights = rowHeights
        this.colWidths = colWidths
        this.cells = cells;
        this.__heightTotalWeights = rowHeights.reduce((pre, cur) => pre + cur.value, 0);
        this.__widthTotalWeights = colWidths.reduce((pre, cur) => pre + cur.value, 0);
    }

    getOpTarget(path: string[]): any {
        const path0 = path[0];
        if (path0 === "cells" && path.length > 1) {
            const cellId = path[1];
            let cell = this.cells.get(cellId);
            // if (!cell) {
            //     cell = this._initCell(cellId);
            // }
            return cell?.getOpTarget(path.slice(2));
        }
        return super.getOpTarget(path);
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
    get datas() {
        return this.cells;
    }

    updateTotalWeights() {
        this.__heightTotalWeights = this.rowHeights.reduce((pre, cur) => pre + cur.value, 0);
        this.__widthTotalWeights = this.colWidths.reduce((pre, cur) => pre + cur.value, 0);
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
        this.__layout.update(this);
        if (!this.__layout.layout) this.__layout.layout = layoutTable(this);
        return this.__layout.layout;
    }
    getColWidths() {
        const frame = this.frame;
        const width = frame.width;
        const colWidths = this.colWidths;
        const colWBase = colWidths.reduce((sum, cur) => sum + cur.value, 0);
        return colWidths.map((val) => val.value / colWBase * width);
    }
    getRowHeights() {
        const frame = this.frame;
        const height = frame.height;
        const rowHeights = this.rowHeights;
        const rowHBase = this.heightTotalWeights;
        return rowHeights.map((val) => val.value / rowHBase * height);
    }
    // insertRow(idx: number, weight: number, data: (TableCell | undefined)[]) {
    //     tableInsertRow(this, idx, weight, data);
    //     this.__heightTotalWeights += weight;
    //     this.reLayout();
    // }
    // removeRow(idx: number): (TableCell | undefined)[] {
    //     const weight = this.rowHeights[idx];
    //     const ret = tableRemoveRow(this, idx);
    //     this.__heightTotalWeights -= weight.value;
    //     this.reLayout();
    //     return ret;
    // }
    // insertCol(idx: number, weight: number, data: (TableCell | undefined)[]) {
    //     tableInsertCol(this, idx, weight, data);
    //     this.__widthTotalWeights += weight;
    //     this.reLayout();
    // }
    // removeCol(idx: number): (TableCell | undefined)[] {
    //     const weight = this.colWidths[idx];
    //     const ret = tableRemoveCol(this, idx);
    //     this.__widthTotalWeights -= weight.value;
    //     this.reLayout();
    //     return ret;
    // }
    // setColWidth(idx: number, weight: number) {
    //     const colWidths = this.colWidths;
    //     const origin = colWidths[idx].value;
    //     colWidths[idx].value = weight;
    //     this.__widthTotalWeights -= origin;
    //     this.__widthTotalWeights += weight;
    //     this.reLayout();
    // }
    // setRowHeight(idx: number, weight: number) {
    //     const rowHeights = this.rowHeights;
    //     const origin = rowHeights[idx].value;
    //     rowHeights[idx].value = weight;
    //     this.__heightTotalWeights -= origin;
    //     this.__heightTotalWeights += weight;
    //     this.reLayout();
    // }
    // setFrameSize(w: number, h: number) {
    //     super.setFrameSize(w, h);
    //     this.reLayout();
    // }

    onRollback(from: string): void {
        if (from !== "composingInput") {
            this.reLayout();
            return;
        }
        const widthTotalWeights = this.colWidths.reduce((p, c) => p + c.value, 0);
        const heightTotalWeights = this.rowHeights.reduce((p, c) => p + c.value, 0);
        if (this.__widthTotalWeights !== widthTotalWeights ||
            this.__heightTotalWeights !== heightTotalWeights) {
            this.__widthTotalWeights = widthTotalWeights;
            this.__heightTotalWeights = heightTotalWeights;
            this.__layout.layout = undefined;
        }
    }

    reLayout() {
        this.__widthTotalWeights = this.colWidths.reduce((p, c) => p + c.value, 0);
        this.__heightTotalWeights = this.rowHeights.reduce((p, c) => p + c.value, 0);
        this.__layout.layout = undefined;
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

    indexOfCell2(cell: TableCell): { rowIdx: number, colIdx: number } | undefined {
        // cell indexs
        const ids = cell.id.split(',');
        if (ids.length !== 2) throw new Error("cell index error");
        const rowIdx = this.rowHeights.findIndex(v => v.id === ids[0]);
        const colIdx = this.colWidths.findIndex(v => v.id === ids[1]);
        if (rowIdx < 0 || colIdx < 0) return;
        return { rowIdx, colIdx }
    }

    indexOfCell(cell: TableCell): { rowIdx: number, colIdx: number, visible: boolean } | undefined {
        // cell indexs
        const cellIdx = this.indexOfCell2(cell);
        if (!cellIdx) return;
        const { rowIdx, colIdx } = cellIdx;
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

    // todo 错的。不可以，除非cell是不可删除的才可以。这里也要跟shape一样的undo、redo
    // _initCell(cellId: string) {
    //     const cell = new TableCell(new CrdtIndex([], 0),
    //         cellId,
    //         "",
    //         ShapeType.TableCell,
    //         new ShapeFrame(0, 0, 0, 0),
    //         new Style(new BasicArray(), new BasicArray(), new BasicArray()));
    //     this.cells.set(cellId, cell);
    //     return cell;
    // }

    getCellAt(rowIdx: number, colIdx: number): (TableCell | undefined) {
        if (rowIdx < 0 || colIdx < 0 || rowIdx >= this.rowCount || colIdx >= this.colCount) {
            throw new Error("cell index outof range: " + rowIdx + " " + colIdx)
        }
        const cellId = this.rowHeights[rowIdx].id + "," + this.colWidths[colIdx].id;
        let cell = this.cells.get(cellId);
        // if (!cell && initCell) {
        //     cell = this._initCell(cellId);
        // }
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