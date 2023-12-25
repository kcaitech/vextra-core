import { GroupShape, Shape, ShapeFrame, ShapeType, ImageShape, PathShape, RectShape, TextShape } from "./shape";
import { Style } from "./style";
import * as classes from "./baseclasses";
import { BasicArray } from "./basic";
import { Path } from "./path";
import { Point2D } from "./typesdefine";

function distanceTo(p0: Point2D, p1: Point2D) {
    return Math.hypot(p0.x - p1.x, p0.y - p1.y);
}

function calcAngleABC(A: Point2D, B: Point2D, C: Point2D) {
    const AB = distanceTo(A, B);
    const BC = distanceTo(B, C);
    const AC = distanceTo(C, A);
    return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
}

function minus(p0: Point2D, p1: Point2D): Point2D {
    return { x: p0.x - p1.x, y: p0.y - p1.y };
}

function norm(p: Point2D) {
    const d = Math.hypot(p.x, p.y);
    // invariant(d !== 0, 'cant norm a vector whos len is zero');
    return { x: p.x / d, y: p.y / d };
}

function multiply(p: Point2D, d: number): Point2D {
    return { x: p.x * d, y: p.y * d };
}

function add(p: Point2D, pt: Point2D) {
    return { x: p.x + pt.x, y: p.y + pt.y };
}

function get_bezier_c(pre: Point2D, cur: Point2D, next: Point2D, radius: number, minDist: number) {
    const radian = calcAngleABC(pre, cur, next);

    if (Number.isNaN(radian)) {
        return ["l", 0, 0];
    }

    const tangent = Math.tan(radian / 2);

    let dist = radius / tangent;

    if (dist > minDist) {
        dist = minDist;
        radius = dist * tangent;
    }

    const vPre = norm(minus(pre, cur));
    const vNext = norm(minus(next, cur));

    let preTangent = add(multiply(vPre, dist), cur);
    let nextTangent = add(multiply(vNext, dist), cur);

    const kappa = (4 / 3) * Math.tan((Math.PI - radian) / 4);

    let preHandle = add(multiply(vPre, -radius * kappa), preTangent);
    let nextHandle = add(multiply(vNext, -radius * kappa), nextTangent);

    return ['C', preHandle.x, preHandle.y, nextHandle.x, nextHandle.y, nextTangent.x, nextTangent.y];
}

function _get_path(shape: Artboard) {
    const f = shape.frame;

    const min = Math.min(f.width, f.height) / 2;

    const radius = Math.min(min, shape.fixedRadius || 0);

    const lt = { x: 0, y: 0 };
    const rt = { x: f.width, y: 0 };
    const rb = { x: f.width, y: f.height };
    const lb = { x: 0, y: f.height };

    const m = ['M', radius, 0];
    const t = ['L', f.width - radius, 0];
    const rtc = get_bezier_c(lt, rt, rb, radius, min);
    const r = ['L', f.width, f.height - radius];
    const rbc = get_bezier_c(rt, rb, lb, radius, min);
    const b = ['L', radius, f.height];
    const lbc = get_bezier_c(rb, lb, lt, radius, min);
    const l = ['L', 0, radius];
    const ltc = get_bezier_c(lb, lt, rt, radius, min);

    return [m, t, rtc, r, rbc, b, lbc, l, ltc, ["z"]];
}
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
    
    getPath(): Path {
        const x = 0;
        const y = 0;
        const w = this.frame.width;
        const h = this.frame.height;
        let path = [];
        if (this.fixedRadius) {
            path = _get_path(this);
        } else {
            path = [
                ["M", x, y],
                ["l", w, 0],
                ["l", 0, h],
                ["l", -w, 0],
                ["z"]
            ]
        }
        return new Path(path);
    }

    getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {
        const w = frame.width;
        const h = frame.height;
        let path = [];
        if (fixedRadius) {
            path = _get_path(this);
        } else {
            path = [
                ["M", 0, 0],
                ["l", w, 0],
                ["l", 0, h],
                ["l", -w, 0],
                ["z"]
            ]
        }
        return new Path(path);
    }
}
