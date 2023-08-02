import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, ResourceMgr } from "./basic";
import { ShapeType, ShapeFrame, TableCellType } from "./baseclasses"
import { GroupShape, Shape } from "./shape";
import { ColumSegment, RowSegment, getColumnsInfo, getRowsInfo } from "./tableread";
import { Path } from "./path";
import { Text } from "./text"
import { TextLayout } from "./textlayout";
export { ColumSegment, RowSegment } from "./tableread";
export { TableCellType } from "./baseclasses";

export class TableCell extends Shape implements classes.TableCell {
    typeId = 'table-cell'
    cellType?: TableCellType
    text?: Text
    imageRef?: string
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
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
        if (this.text) {
            this.text.updateSize(this.frame.width, this.frame.height);
            return this.text.getLayout();
        }
    }
}

export class TableShape extends GroupShape implements classes.TableShape {
    typeId = 'table-shape'
    childs: BasicArray<TableCell>
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<TableCell>
    ) {
        super(
            id,
            name,
            ShapeType.Table,
            frame,
            style,
            childs
        )
        this.childs = childs
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

    getColumnsInfo(): ColumSegment[][] {
        return getColumnsInfo(this);
    }

    getRowsInfo(): RowSegment[][] {
        return getRowsInfo(this);
    }
}