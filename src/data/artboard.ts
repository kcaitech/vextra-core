import { GroupShape, Shape, ShapeFrame, ShapeType, ImageShape, PathShape, RectShape, SymbolRefShape, TextShape } from "./shape";
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
        childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape)>
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