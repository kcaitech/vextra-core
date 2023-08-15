import { BoolOp, GroupShape, Path, Shape, Style, TextShape } from "../data/classes";
// import { difference, intersection, subtract, union } from "./boolop";
import { render as fillR } from "./fill";
import { render as borderR } from "./border"
import { renderText2Path } from "./text";
import { IPalPath, gPal } from "../basic/pal";
import { parsePath } from "../data/pathparser";

// find first usable style
export function findUsableFillStyle(shape: Shape): Style {
    if (shape.style.fills.length > 0) return shape.style;
    if (shape instanceof GroupShape && shape.isBoolOpShape && shape.childs.length > 0) return findUsableFillStyle(shape.childs[0]);
    return shape.style;
}

export function findUsableBorderStyle(shape: Shape): Style {
    if (shape.style.borders.length > 0) return shape.style;
    if (shape instanceof GroupShape && shape.isBoolOpShape && shape.childs.length > 0) return findUsableBorderStyle(shape.childs[0]);
    return shape.style;
}

function opPath(bop: BoolOp, path0: IPalPath, path1: IPalPath) {
    switch (bop) {
        case BoolOp.Diff:
            path0.difference(path1);
            break;
        case BoolOp.Intersect:
            path0.intersection(path1);
            break;
        case BoolOp.Subtract:
            path0.subtract(path1);
            break;
        case BoolOp.Union:
            path0.union(path1);
            break;
    }
}

export function render2path(shape: Shape, consumed?: Array<Shape>): Path {
    const shapeIsGroup = shape instanceof GroupShape;
    let fixedRadius: number | undefined;
    if (shapeIsGroup) fixedRadius = shape.fixedRadius;
    if (!shapeIsGroup || shape.childs.length === 0) {
        const path = shape instanceof TextShape ? renderText2Path(shape, 0, 0) : shape.getPath(fixedRadius);
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

    const joinPath: IPalPath = gPal.makePalPath(path0.toString());
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
        const palpath1 = gPal.makePalPath(path1.toString());
        if (pathop === BoolOp.None) {
            joinPath.addPath(palpath1);
        } else {
            opPath(pathop, joinPath, palpath1)
        }
        palpath1.delete();
        if (consumed) consumed.push(child1);
    }
    const pathstr = joinPath.toSVGString();
    joinPath.delete();

    let resultpath: Path | undefined;
    // radius
    if (fixedRadius && fixedRadius > 0) {
        const frame = shape.frame;
        const path = new Path(pathstr);
        const segs = path.toCurvePoints(frame.width, frame.height);
        const ps: any[] = [];
        segs.forEach((seg) => {
            ps.push(...parsePath(seg.points, !!seg.isClosed, 0, 0, frame.width, frame.height, fixedRadius));
        })
        resultpath = new Path(ps);
    }
    else {
        resultpath = new Path(pathstr);
    }
    return resultpath;
}

export function render(h: Function, shape: GroupShape, reflush?: number, consumed?: Array<Shape>): any {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;

    const path = render2path(shape, consumed);
    const frame = shape.frame;

    const pathstr = path.toString();
    const childs = [];

    // fill
    if (shape.style.fills.length > 0) {
        childs.push(...fillR(h, shape.style.fills, frame, pathstr));
    }

    // border
    if (shape.style.borders.length > 0) {
        childs.push(...borderR(h, shape.style.borders, frame, pathstr));
    }

    // ----------------------------------------------------------
    // shadows todo

    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

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