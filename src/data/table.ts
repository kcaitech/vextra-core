import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, BasicMap, ResourceMgr } from "./basic";
import { ShapeType, TableCellType, CrdtNumber, ShapeFrame } from "./baseclasses"
import {Shape, Transform, ShapeSize} from "./shape";
import { Text, TextAttr } from "./text"
import { PathType } from "./consts";
import { newTableCellText } from "./textutils";
import { Path } from "@kcdesign/path";
export { TableLayout, TableGridItem } from "./tablelayout";
export { TableCellType } from "./baseclasses";
export { CrdtNumber } from "./baseclasses";

export class TableCell extends Shape implements classes.TableCell {
    get size(): classes.ShapeSize {
        return this.frame;
    }
    set size(size: classes.ShapeSize) {
    }
    get frame(): classes.ShapeFrame {
        return new ShapeFrame();
    }

    typeId = 'table-cell'
    cellType: TableCellType
    text: Text
    imageRef?: string
    rowSpan?: number
    colSpan?: number

    private __cacheData?: { media: { buff: Uint8Array, base64: string }, ref: string };

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        cellType: TableCellType,
        text: Text
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style
        )
        this.cellType = cellType
        this.text = text
    }

    getOpTarget(path: string[]) {
        if (path.length === 0) return this;
        if (path[0] === 'text') { // 兼容旧数据
            if (!this.text) this.text = newTableCellText();
            return this.text?.getOpTarget(path.slice(1));
        }
        return super.getOpTarget(path);
    }

    getCrdtPath(): string[] { // 覆写shape.getCrdtPath
        const p = this.__parent;
        if (!p) throw new Error("cell not inside table?");
        return p.getCrdtPath().concat(this.__propKey!);
    }

    // get shapeId(): (string | { rowIdx: number, colIdx: number })[] {
    //     const table = this.parent as TableShape;
    //     const indexCell = table.indexOfCell2(this);
    //     if (!indexCell) throw new Error("cell has no index?")
    //     return [table.id, indexCell];
    // }

    /**
     * 没有实例化cell前使用来画边框
     * @param frame 
     * @returns 
     */
    static getPathOfSize(frame: ShapeSize): Path {
        const x = 0;
        const y = 0;
        const w = frame.width;
        const h = frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return Path.fromSVGString(path.join(''));
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number): Path {
        const x = 0;
        const y = 0;
        const w = frame.width;
        const h = frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return Path.fromSVGString(path.join(''));
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
        if (this.__cacheData?.ref === this.imageRef) {
            return this.__cacheData?.media.base64;
        }
        if (!this.imageRef) return "";
        if (startLoad && !this.__startLoad) {
            this.__startLoad = true;
            const mediaMgr = (this.parent as TableShape).__imageMgr;
            mediaMgr && mediaMgr
                .get(this.imageRef)
                .then((val) => {
                    if (val) {
                        this.__cacheData = { media: val, ref: this.imageRef! };
                    }
                }).finally(() => {
                    this.__startLoad = false;
                    this.notify('image-reload');
                    return this.__cacheData?.media.base64;
                })
        }
    }
    // image shape
    async loadImage(): Promise<string> {
        if (this.__cacheData) return this.__cacheData.media.base64;
        if (!this.imageRef) return "";
        const mediaMgr = (this.parent as TableShape).__imageMgr;
        const val = mediaMgr && await mediaMgr.get(this.imageRef);
        if (val) {
            this.__cacheData = { media: val, ref: this.imageRef }
            this.notify();
        }
        return this.__cacheData && this.__cacheData.media.base64 || "";
    }

    getText(): Text {
        if (!this.text) throw new Error("");
        return this.text;
    }
}

export class TableShape extends Shape implements classes.TableShape {

    static MinCellSize = 10;
    static MaxRowCount = 50;
    static MaxColCount = 50;
    get frame(): classes.ShapeFrame {
        return new ShapeFrame(0, 0, this.size.width, this.size.height);
    }
    hasSize(): boolean {
        return true;
    }
    typeId = 'table-shape'
    // @ts-ignore
    size: ShapeSize
    cells: BasicMap<string, TableCell>
    rowHeights: BasicArray<CrdtNumber>
    colWidths: BasicArray<CrdtNumber>
    textAttr?: TextAttr // 文本默认属性

    __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    // private __layout: LayoutItem = new LayoutItem();
    // private __heightTotalWeights: number;
    // private __widthTotalWeights: number;

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        cells: BasicMap<string, TableCell>,
        rowHeights: BasicArray<CrdtNumber>,
        colWidths: BasicArray<CrdtNumber>
    ) {
        super(
            crdtidx,
            id,
            name,
            ShapeType.Table,
            transform,
            style,
        )
        this.size = size
        this.rowHeights = rowHeights
        this.colWidths = colWidths
        this.cells = cells;
        // this.__heightTotalWeights = rowHeights.reduce((pre, cur) => pre + cur.value, 0);
        // this.__widthTotalWeights = colWidths.reduce((pre, cur) => pre + cur.value, 0);
    }

    getOpTarget(path: string[]): any {
        const path0 = path[0];
        if (path0 === "cells" && path.length > 1) {
            const cellId = path[1];
            const cell = this.cells.get(cellId);
            return cell?.getOpTarget(path.slice(2));
        }
        if (path0 === "textAttr" && !this.textAttr) this.textAttr = new TextAttr();
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

    // updateTotalWeights() {
    //     this.__heightTotalWeights = this.rowHeights.reduce((pre, cur) => pre + cur.value, 0);
    //     this.__widthTotalWeights = this.colWidths.reduce((pre, cur) => pre + cur.value, 0);
    // }

    // get widthTotalWeights() {
    //     return this.__widthTotalWeights;
    // }
    // get heightTotalWeights() {
    //     return this.__heightTotalWeights;
    // }
    get rowCount() {
        return this.rowHeights.length;
    }
    get colCount() {
        return this.colWidths.length;
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number): Path {
        const x = 0;
        const y = 0;
        const w = frame.width;
        const h = frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return Path.fromSVGString(path.join(''));
    }
    // getLayout(): TableLayout {
    //     this.__layout.update(this);
    //     if (!this.__layout.layout) this.__layout.layout = layoutTable(this);
    //     return this.__layout.layout;
    // }
    // getColWidths() {
    //     const frame = this.frame;
    //     const width = frame.width;
    //     const colWidths = this.colWidths;
    //     const colWBase = colWidths.reduce((sum, cur) => sum + cur.value, 0);
    //     return colWidths.map((val) => val.value / colWBase * width);
    // }
    // getRowHeights() {
    //     const frame = this.frame;
    //     const height = frame.height;
    //     const rowHeights = this.rowHeights;
    //     const rowHBase = this.heightTotalWeights;
    //     return rowHeights.map((val) => val.value / rowHBase * height);
    // }

    // onRollback(from: string): void {
    //     if (from !== "composingInput") {
    //         this.reLayout();
    //         return;
    //     }
    //     const widthTotalWeights = this.colWidths.reduce((p, c) => p + c.value, 0);
    //     const heightTotalWeights = this.rowHeights.reduce((p, c) => p + c.value, 0);
    //     if (this.__widthTotalWeights !== widthTotalWeights ||
    //         this.__heightTotalWeights !== heightTotalWeights) {
    //         this.__widthTotalWeights = widthTotalWeights;
    //         this.__heightTotalWeights = heightTotalWeights;
    //         this.__layout.layout = undefined;
    //     }
    // }

    // reLayout() {
    //     this.__widthTotalWeights = this.colWidths.reduce((p, c) => p + c.value, 0);
    //     this.__heightTotalWeights = this.rowHeights.reduce((p, c) => p + c.value, 0);
    //     this.__layout.layout = undefined;
    // }

    // locateCell(x: number, y: number): (TableGridItem & { cell: TableCell | undefined }) | undefined {
    //     const item = locateCell(this.getLayout(), x, y) as (TableGridItem & { cell: TableCell | undefined }) | undefined;
    //     if (item) item.cell = this.getCellAt(item.index.row, item.index.col);
    //     return item;
    // }

    // locateCellIndex(x: number, y: number): { row: number, col: number } | undefined {
    //     return locateCellIndex(this.getLayout(), x, y);
    // }

    // locateCell2(cell: TableCell): (TableGridItem & { cell: TableCell | undefined }) | undefined {
    //     const index = this.indexOfCell(cell);
    //     if (!index || !index.visible) return;
    //     const item = this.getLayout().grid.get(index.rowIdx, index.colIdx);
    //     if (!item) return;
    //     return {
    //         index: item.index,
    //         frame: item.frame,
    //         span: item.span,
    //         cell
    //     }
    // }

    // indexOfCell2(cell: TableCell): { rowIdx: number, colIdx: number } | undefined {
    //     // cell indexs
    //     const ids = cell.id.split(',');
    //     if (ids.length !== 2) throw new Error("cell index error");
    //     const rowIdx = this.rowHeights.findIndex(v => v.id === ids[0]);
    //     const colIdx = this.colWidths.findIndex(v => v.id === ids[1]);
    //     if (rowIdx < 0 || colIdx < 0) return;
    //     return { rowIdx, colIdx }
    // }

    // indexOfCell(cell: TableCell): { rowIdx: number, colIdx: number, visible: boolean } | undefined {
    //     // cell indexs
    //     const cellIdx = this.indexOfCell2(cell);
    //     if (!cellIdx) return;
    //     const { rowIdx, colIdx } = cellIdx;
    //     const layout = this.getLayout();
    //     const item = layout.grid.get(rowIdx, colIdx);
    //     const visible = item.index.row === rowIdx && item.index.col === colIdx;
    //     return { rowIdx, colIdx, visible }
    // }

    // /**
    //  * [rowStart, rowEnd], [colStart, colEnd] 左闭右闭区间
    //  * @param rowStart 
    //  * @param rowEnd 
    //  * @param colStart 
    //  * @param colEnd 
    //  * @param visible 
    //  * @returns 
    //  */
    // getCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number): { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] {
    //     return getTableCells(this, rowStart, rowEnd, colStart, colEnd);
    // }

    // getCellAt(rowIdx: number, colIdx: number): (TableCell | undefined) {
    //     if (rowIdx < 0 || colIdx < 0 || rowIdx >= this.rowCount || colIdx >= this.colCount) {
    //         throw new Error("cell index outof range: " + rowIdx + " " + colIdx)
    //     }
    //     const cellId = this.rowHeights[rowIdx].id + "," + this.colWidths[colIdx].id;
    //     return this.cells.get(cellId);
    // }

    // /**
    //  * 获取未被覆盖的单元格
    //  * @param rowStart 
    //  * @param rowEnd 
    //  * @param colStart 
    //  * @param colEnd 
    //  * @returns 
    //  */
    // getNotCoveredCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number): { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] {
    //     return getTableNotCoveredCells(this, this.getLayout(), rowStart, rowEnd, colStart, colEnd);
    // }

    // /**
    //  * 获取用户可见的单元格
    //  * @param rowStart 
    //  * @param rowEnd 
    //  * @param colStart 
    //  * @param colEnd 
    //  * @returns 
    //  */
    // getVisibleCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number): {
    //     cell: TableCell | undefined,
    //     rowIdx: number,
    //     colIdx: number
    // }[] {
    //     return getTableVisibleCells(this, this.getLayout(), rowStart, rowEnd, colStart, colEnd);
    // }

    // get isNoSupportDiamondScale() {
    //     return true;
    // }

    // get frameType() {
    //     return FrameType.Rect;
    // }

    get pathType() {
        return PathType.Fixed;
    }

    get isPathIcon() {
        return false;
    }
    get isImageFill() {
        return false;
    }
}