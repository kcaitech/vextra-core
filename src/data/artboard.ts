import { BoolOp, FlattenShape, GroupShape, Shape, ShapeFrame, ShapeType, ImageShape, PathShape, RectShape, SymbolRefShape, TextShape } from "./shape";
import { Color, Style } from "./style";
import * as classes from "./baseclasses";
import { BasicArray } from "./basic";
import { Path } from "./path";
export class Artboard extends GroupShape implements classes.Artboard {
    typeId = 'artboard';
    hasBackgroundColor?: boolean;
    includeBackgroundColorInExport?: boolean;
    backgroundColor?: Color;

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape)>
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
    setArtboardColor(color: Color) {
        this.backgroundColor = color;
    }
    // 容器暂时不能设置圆角
    getPath(offsetX: number, offsetY: number): Path;
    getPath(origin?: boolean): Path;
    getPath(arg1?: boolean | number, arg2?: number): Path {
        const x = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const y = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
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

// export class ArtboardRef extends Shape implements classes.ArtboardRef {
//     typeId = 'artboard-ref'
//     refId: string
//     __data?: Artboard
//     __symMgr?: ResourceMgr<Artboard>
//     constructor(
//         id: string,
//         name: string,
//         type: ShapeType,
//         frame: ShapeFrame,
//         style: Style,
//         boolOp: BoolOp,
//         refId: string
//     ) {
//         super(
//             id,
//             name,
//             ShapeType.ArtboardRef,
//             frame,
//             style,
//             boolOp
//         )
//         this.refId = refId
//     }
//     setArtboardMgr(mgr: ResourceMgr<Artboard>) {
//         this.__symMgr = mgr;
//     }
//     peekArtboard(): Artboard | undefined {
//         return this.__data || (this.__data = this.__symMgr?.getSync(this.refId));
//     }
//     loadArtboard() {
//         this.__symMgr && this.__symMgr.get(this.refId).then((s) => {
//             this.__data = s;
//             this.notify();
//         })
//     }
// }