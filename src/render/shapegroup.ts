import { BoolOp, GroupShape, Path, Shape, TextShape } from "../data/classes";
// import { difference, intersection, subtract, union } from "./boolop";
import { render as fillR } from "./fill";
import { render as borderR } from "./border"
import { renderText2Path } from "./text";
import { gPal } from "../basic/pal";
import { parsePath } from "../data/pathparser";

function opPath(bop: BoolOp, path0: Path, path1: Path): Path {
    const boolop = gPal.boolop;
    let path = "";
    switch (bop) {
        case BoolOp.Diff:
            path = boolop.difference(path0.toString(), path1.toString());
            break;
        case BoolOp.Intersect:
            path = boolop.intersection(path0.toString(), path1.toString());
            break;
        case BoolOp.Subtract:
            path = boolop.subtract(path0.toString(), path1.toString());
            break;
        case BoolOp.Union:
            path = boolop.union(path0.toString(), path1.toString());
            break;
        // case BoolOp.SimpleUnion:
        //     path = path0 + path1;
        //     break;
    }
    return new Path(path);
}

export function render2path(shape: Shape, consumed?: Array<Shape>): Path {
    if (!(shape instanceof GroupShape) || shape.childs.length === 0) {
        const path = shape instanceof TextShape ? renderText2Path(shape, 0, 0) : shape.getPath(0, 0);
        return path;
    }

    const cc = shape.childs.length;
    const child0 = shape.childs[0];
    const frame0 = child0.frame;
    const path0 = render2path(child0, consumed);
    consumed?.push(child0);
    if (child0.isNoTransform()) {
        path0.translate(frame0.x, frame0.y);
    } else {
        path0.transform(child0.matrix2Parent())
    }

    let joinPath: Path = path0;
    for (let i = 1; i < cc; i++) {
        const child1 = shape.childs[i];
        const frame1 = child1.frame;
        const path1 = render2path(child1, consumed);
        if (child1.isNoTransform()) {
            path1.translate(frame1.x, frame1.y);
        } else {
            path1.transform(child1.matrix2Parent())
        }
        const pathop = child1.boolOp ?? BoolOp.None;
        if (pathop === BoolOp.None) {
            joinPath.push(path1);
        } else {
            joinPath = joinPath.length === 0 ? path1 : opPath(pathop, joinPath, path1)
        }
        if (consumed) consumed.push(child1);
    }

    return joinPath;
}

export function render(h: Function, shape: GroupShape, reflush?: number, consumed?: Array<Shape>): any {
    let path = render2path(shape, consumed);
    const frame = shape.frame;

    const fixedRadius = shape.fixedRadius || 0;
    if (fixedRadius > 0) {
        const segs = path.toCurvePoints(frame.width, frame.height);
        const ps: any[] = [];
        segs.forEach((seg) => {
            ps.push(...parsePath(seg.points, !!seg.isClosed, 0, 0, frame.width, frame.height, fixedRadius));
        })
        path = new Path(ps);
    }

    const pathstr = path.toString();
    const childs = [];

    // fill
    if (shape.style.fills.length > 0) {
        childs.push(...fillR(h, shape.style, frame, pathstr));
    } else {
        const child0 = shape.childs[0];
        if (child0) childs.push(...fillR(h, child0.style, frame, pathstr));
    }

    // border
    childs.push(...borderR(h, shape, pathstr));

    // ----------------------------------------------------------
    // shadows todo

    const props: any = {}
    if (reflush) props.reflush = reflush;

    if (shape.isFlippedHorizontal || shape.isFlippedVertical || shape.rotation) {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        const style: any = {}
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (shape.isFlippedHorizontal) style.transform += "rotateY(180deg) "
        if (shape.isFlippedVertical) style.transform += "rotateX(180deg) "
        if (shape.rotation) style.transform += "rotate(" + shape.rotation + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
        props.style = style;
    }
    else {
        props.transform = `translate(${frame.x},${frame.y})`
    }

    if (childs.length == 0) {
        props["fill-opacity"] = 1;
        props.d = path;
        props.fill = 'none';
        props.stroke = 'none';
        props["stroke-width"] = 0;
        return h('path', props);
    }
    else {
        return h("g", props, childs);
    }
}