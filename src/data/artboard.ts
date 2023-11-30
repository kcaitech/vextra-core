import { GroupShape, Shape, ShapeFrame, ShapeType, ImageShape, PathShape, RectShape, TextShape } from "./shape";
import { Style } from "./style";
import * as classes from "./baseclasses";
import { BasicArray } from "./basic";
import { Path } from "./path";
export class Artboard extends GroupShape implements classes.Artboard {
    typeId = 'artboard';
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>
    ) {
        super(
            id,
            name,
            ShapeType.Artboard,
            frame,
            style,
            childs
        )
    }
    // 容器暂时不能设置圆角
    getPath(): Path {
        const x = 0;
        const y = 0;
        const w = this.frame.width;
        const h = this.frame.height;
        const path = [
            ["M", x, y],
            ["l", w, 0],
            ["l", 0, h],
            ["l", -w, 0],
            ["z"]
        ]
        return new Path(path);
    }
}
