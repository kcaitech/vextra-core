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
    childs: BasicArray<(ImageShape | TextShape)>
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(ImageShape | TextShape)>
    ) {
        super(
            id,
            name,
            ShapeType.TableCell,
            frame,
            style
        )
        this.childs = childs
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
    getPath(offsetX: number, offsetY: number): Path;
    getPath(origin?: boolean): Path;
    getPath(arg1?: boolean | number, arg2?: number): Path {
        const x = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const y = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
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