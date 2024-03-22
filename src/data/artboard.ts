import {
    GroupShape,
    Shape,
    ShapeFrame,
    ShapeType,
    ImageShape,
    PathShape,
    RectShape,
    TextShape,
    CurvePoint
} from "./shape";
import { Style } from "./style";
import * as classes from "./baseclasses";
import { BasicArray } from "./basic";
import { Path } from "./path";
import { parsePath } from "./pathparser";
export class Artboard extends GroupShape implements classes.Artboard {
    typeId = 'artboard';
    points: BasicArray<CurvePoint>;
    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>,
        points: BasicArray<CurvePoint>
    ) {
        super(
            crdtidx,
            id,
            name,
            ShapeType.Artboard,
            frame,
            style,
            childs
        )
        this.points = points;
    }

    // getPath(): Path {
    //     const x = 0;
    //     const y = 0;
    //     const w = this.frame.width;
    //     const h = this.frame.height;
    //     let path = [];
    //     if (this.fixedRadius) {
    //         path = _get_path(this);
    //     } else {
    //         path = [
    //             ["M", x, y],
    //             ["l", w, 0],
    //             ["l", 0, h],
    //             ["l", -w, 0],
    //             ["z"]
    //         ]
    //     }
    //     return new Path(path);
    // }

    getPath(fixedRadius?: number): Path {
        return this.getPathOfFrame(this.frame, fixedRadius);
    }

    // getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {
    //     const w = frame.width;
    //     const h = frame.height;
    //     let path = [];
    //     if (fixedRadius) {
    //         path = _get_path(this);
    //     } else {
    //         path = [
    //             ["M", 0, 0],
    //             ["l", w, 0],
    //             ["l", 0, h],
    //             ["l", -w, 0],
    //             ["z"]
    //         ]
    //     }
    //     return new Path(path);
    // }

    getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {
        const offsetX = 0;
        const offsetY = 0;
        const width = frame.width;
        const height = frame.height;

        const path = parsePath(this.points, true, offsetX, offsetY, width, height, fixedRadius);

        return new Path(path);
    }

    get isContainer() {
        return true;
    }

    setRectRadius(lt: number, rt: number, rb: number, lb: number): void {
        const ps = this.points;
        if (ps.length === 4) {
            ps[0].radius = lt;
            ps[1].radius = rt;
            ps[2].radius = rb;
            ps[3].radius = lb;
        }
    }

    getRectRadius(): { lt: number, rt: number, rb: number, lb: number } {
        const ret = { lt: 0, rt: 0, rb: 0, lb: 0 };
        const ps = this.points;
        if (ps.length === 4) {
            ret.lt = ps[0].radius || 0;
            ret.rt = ps[1].radius || 0;
            ret.rb = ps[2].radius || 0;
            ret.lb = ps[3].radius || 0;
        }
        return ret;
    }
}
