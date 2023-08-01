import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
import { ShapeType, ShapeFrame } from "./baseclasses"
import { ImageShape, Shape, TextShape } from "./shape";
import { ColumSegment, RowSegment, getColumnsInfo, getRowsInfo } from "./tableread";
import { Path } from "./path";
export { ColumSegment, RowSegment } from "./tableread";

export class TableCell extends Shape implements classes.TableCell {
    typeId = 'table-cell'
    child?: (ImageShape | TextShape)
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
            ShapeType.TableCell,
            frame,
            style
        )
    }
    get childs() {
        return this.child ? [this.child] : [];
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
}

export class TableShape extends Shape implements classes.TableShape {
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
            style
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