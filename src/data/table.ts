import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
import { ShapeType, ShapeFrame } from "./baseclasses"
import { ImageShape, Shape, TextShape } from "./shape";

export class TableCell extends Shape implements classes.TableCell {
    typeId = 'table-cell'
    childs: BasicArray<(ImageShape | TextShape) >
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(ImageShape | TextShape) >
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
    childs: BasicArray<TableCell >
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<TableCell >
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
}