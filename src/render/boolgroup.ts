import { BoolOp, BoolShape, Border, GroupShape, Path, PathShape, Shape, ShapeFrame, Style, SymbolRefShape, SymbolShape, TextShape } from "../data/classes";
import { renderWithVars as fillR } from "./fill";
import { renderWithVars as borderR } from "./border"
import { renderText2Path } from "./text";
import { IPalPath, gPal } from "../basic/pal";
import { parsePath } from "../data/pathparser";
import { isVisible, randomId } from "./basic";
import { innerShadowId, renderWithVars as shadowR } from "./shadow";

// find first usable style
export function findUsableFillStyle(shape: Shape): Style {
    if (shape.style.fills.length > 0) return shape.style;
    if (shape instanceof BoolShape && shape.childs.length > 0) return findUsableFillStyle(shape.childs[0]);
    return shape.style;
}

export function findUsableBorderStyle(shape: Shape): Style {
    if (shape.style.borders.length > 0) return shape.style;
    if (shape instanceof BoolShape && shape.childs.length > 0) return findUsableBorderStyle(shape.childs[0]);
    return shape.style;
}

function opPath(bop: BoolOp, path0: IPalPath, path1: IPalPath, isIntersect: boolean): IPalPath {
    switch (bop) {
        case BoolOp.Diff:
            if (isIntersect) path0.difference(path1);
            else path0.addPath(path1);
            break;
        case BoolOp.Intersect:
            if (isIntersect) {
                path0.intersection(path1);
            }
            else {
                return gPal.makePalPath("");
            }
            break;
        case BoolOp.Subtract:
            if (isIntersect) path0.subtract(path1);
            break;
        case BoolOp.Union:
            if (!isIntersect) path0.addPath(path1)
            else path0.union(path1);
            break;
    }
    return path0;
}

function _is_intersect(frame0: ShapeFrame, frame1: ShapeFrame) {
    return !(frame0.x > frame1.x + frame1.width ||
        frame0.x + frame0.width < frame1.x ||
        frame0.y > frame1.y + frame1.height ||
        frame0.y + frame0.height < frame1.y);
}
function is_intersect(arr: ShapeFrame[], frame: ShapeFrame) {
    for (let i = 0; i < arr.length; i++) {
        if (_is_intersect(arr[i], frame)) return true;
    }
    return false;
}

class FrameGrid {
    _cellWidth: number;
    _cellHeight: number;
    _cellRowsCount: number;
    _cellColsCount: number;
    _rows: ShapeFrame[][][] = [];

    constructor(cellWidth: number, cellHeight: number, cellRowsCount: number, cellColsCount: number) {
        this._cellWidth = cellWidth;
        this._cellHeight = cellHeight;
        this._cellRowsCount = cellRowsCount;
        this._cellColsCount = cellColsCount;
    }

    checkIntersectAndPush(frame: ShapeFrame): boolean {
        return this._checkIntersectAndPush(frame, false);
    }

    push(frame: ShapeFrame) {
        this._checkIntersectAndPush(frame, true);
    }

    private _checkIntersectAndPush(frame: ShapeFrame, preset: boolean): boolean {
        const xs = (frame.x);
        const xe = (frame.x + frame.width);
        const ys = (frame.y);
        const ye = (frame.y + frame.height);

        const is = Math.max(0, xs / this._cellWidth);
        const ie = Math.max(1, xe / this._cellWidth);

        for (let i = Math.floor(is); i < ie && i < this._cellColsCount; ++i) {
            const js = Math.max(0, ys / this._cellHeight);
            const je = Math.max(1, ye / this._cellHeight);
            let row = this._rows[i];
            if (!row) {
                row = [];
                this._rows[i] = row;
            }
            for (let j = Math.floor(js); j < je && j < this._cellRowsCount; ++j) {
                let cell = row[j];
                if (!preset && cell) preset = is_intersect(cell, frame);
                if (!cell) {
                    cell = [];
                    row[j] = cell;
                }
                cell.push(frame);
            }
        }
        return preset;
    }
}

function hasFill(shape: Shape) {
    const fills = shape.getFills();
    if (fills.length === 0) return false;
    for (let i = 0, len = fills.length; i < len; ++i) {
        if (fills[i].isEnabled) return true;
    }
    return false;
}

export function render2path(shape: Shape): Path {

    const shapeIsGroup = shape instanceof GroupShape;
    let fixedRadius: number | undefined;
    if (shapeIsGroup) fixedRadius = shape.fixedRadius;
    if (!shapeIsGroup || shape.childs.length === 0) {
        if (!shape.isVisible) return new Path();
        if (shape instanceof TextShape) return renderText2Path(shape.getLayout(), 0, 0);
        if (shape instanceof PathShape && (!shape.isClosed || !hasFill(shape))) {
            const thickness = shape.getBorders().reduce((w: number, b: Border) => {
                return Math.max(w, b.thickness);
            }, 0);
            if (thickness === 0) return new Path();
            // return shape.getPath().wrap(thickness, 0);
            const path = shape.getPath(fixedRadius);
            const p0 = gPal.makePalPath(path.toString());
            const newpath = p0.stroke({width: thickness});
            p0.delete();
            return new Path(newpath);
        }
        return shape.getPath(fixedRadius).clone();
    }

    let fVisibleIdx = 0;
    for (let i = 0; i < shape.childs.length; ++i) {
        if ((shape.childs[i]).isVisible) {
            fVisibleIdx = i;
            break;
        }
    }

    const cc = shape.childs.length;
    if (fVisibleIdx >= cc) return new Path();

    const child0 = shape.childs[fVisibleIdx];
    const frame0 = child0.frame;
    const path0 = render2path(child0);

    if (child0.isNoTransform()) {
        path0.translate(frame0.x, frame0.y);
    } else {
        path0.transform(child0.matrix2Parent())
    }

    const pframe = shape.frame;
    const gridSize = Math.ceil(Math.sqrt(cc));

    const grid = new FrameGrid(pframe.width / gridSize, pframe.height / gridSize, gridSize, gridSize);

    grid.push(frame0);

    let joinPath: IPalPath = gPal.makePalPath(path0.toString());
    for (let i = fVisibleIdx + 1; i < cc; i++) {
        const child1 = shape.childs[i];
        if (!child1.isVisible) continue;
        const frame1 = child1.frame;
        const path1 = render2path(child1);
        if (child1.isNoTransform()) {
            path1.translate(frame1.x, frame1.y);
        } else {
            path1.transform(child1.matrix2Parent())
        }
        const pathop = child1.boolOp ?? BoolOp.None;
        const palpath1 = gPal.makePalPath(path1.toString());

        if (pathop === BoolOp.None) {
            grid.push(frame1);
            joinPath.addPath(palpath1);
        } else {
            const intersect = grid.checkIntersectAndPush(frame1);
            const path = opPath(pathop, joinPath, palpath1, intersect);
            if (path !== joinPath) {
                joinPath.delete();
                joinPath = path;
            }
        }
        palpath1.delete();
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
            ps.push(...parsePath(seg.points, !!seg.isClosed, frame.width, frame.height, fixedRadius));
        })
        resultpath = new Path(ps);
    }
    else {
        resultpath = new Path(pathstr);
    }
    return resultpath;
}

export function render(h: Function, shape: BoolShape, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
    reflush?: number): any {
    if (!isVisible(shape, varsContainer)) return;

    const path = render2path(shape);
    const frame = shape.frame;

    // const path0 = shape.getPath();
    // if (matrix) path0.transform(matrix);
    const pathstr = path.toString();
    const childs = [];

    // fill
    childs.push(...fillR(h, shape, frame, pathstr, varsContainer));
    // border
    childs.push(...borderR(h, shape, frame, pathstr, varsContainer));

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
        const shadows = shape.style.shadows;
        const ex_props = Object.assign({}, props);
        const shape_id = shape.id.slice(0, 4) + randomId();
        const shadow = shadowR(h, shape_id, shape, frame, pathstr, varsContainer);
        if (shadow.length) {
            delete props.style;
            delete props.transform;
            delete props.opacity;
            const inner_url = innerShadowId(shape_id, shadows);
            if (shadows.length) props.filter = `url(#pd_outer-${shape_id}) ${inner_url}`;
            const body = h("g", props, childs);
            return h("g", ex_props, [...shadow, body]);
        } else {
            return h("g", props, childs);
        }
    }
}