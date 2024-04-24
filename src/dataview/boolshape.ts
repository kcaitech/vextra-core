import { BoolOp, BoolShape, Border, BorderPosition, Path, PathShape, ShapeFrame, parsePath } from "../data/classes";
import { ShapeView } from "./shape";
import { DViewCtx, PropsType } from "./viewctx";
import { IPalPath, gPal } from "../basic/pal";
import { TextShapeView } from "./textshape";
import { GroupShapeView } from "./groupshape";
import { EL, elh } from "./el";
import { renderBorders, renderFills } from "../render";

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

function hasFill(shape: ShapeView) {
    const fills = shape.getFills();
    if (fills.length === 0) return false;
    for (let i = 0, len = fills.length; i < len; ++i) {
        if (fills[i].isEnabled) return true;
    }
    return false;
}

function border2path(shape: ShapeView, borders: Border[]): Path {
    // 还要判断边框的位置
    let insidewidth = 0;
    let outsidewidth = 0;

    borders.forEach((b) => {
        if (!b.isEnabled) return;
        const sideSetting = b.sideSetting;
        // todo
        const thickness = (sideSetting.thicknessBottom + sideSetting.thicknessLeft + sideSetting.thicknessTop + sideSetting.thicknessRight) / 4;
        if (b.position === BorderPosition.Center) {
            insidewidth = Math.max(insidewidth, thickness / 2);
            outsidewidth = Math.max(outsidewidth, thickness / 2);
        } else if (b.position === BorderPosition.Inner) {
            insidewidth = Math.max(insidewidth, thickness);
        } else if (b.position === BorderPosition.Outer) {
            outsidewidth = Math.max(outsidewidth, thickness);
        }
    })

    if (insidewidth === 0 && outsidewidth === 0) return new Path();
    if (insidewidth === outsidewidth) {
        const path = shape.getPath();
        const p0 = gPal.makePalPath(path.toString());
        const newpath = p0.stroke({ width: (insidewidth + outsidewidth) });
        p0.delete();
        return new Path(newpath);
    }
    if (insidewidth === 0) {
        const path = shape.getPathStr();
        const p0 = gPal.makePalPath(path);
        const p1 = gPal.makePalPath(path);
        p0.stroke({ width: outsidewidth * 2 });
        p0.subtract(p1);
        const newpath = p0.toSVGString();
        p0.delete();
        p1.delete();
        return new Path(newpath);
    }
    else if (outsidewidth === 0) {
        const path = shape.getPathStr();
        const p0 = gPal.makePalPath(path);
        const p1 = gPal.makePalPath(path);
        p0.stroke({ width: insidewidth * 2 });
        p0.intersection(p1);
        const newpath = p0.toSVGString();
        p0.delete();
        p1.delete();
        return new Path(newpath);
    }
    else {
        const path = shape.getPathStr();
        const p0 = gPal.makePalPath(path);
        const p1 = gPal.makePalPath(path);
        const p2 = gPal.makePalPath(path);
        p0.stroke({ width: insidewidth * 2 });
        p1.stroke({ width: outsidewidth * 2 });

        if (insidewidth > outsidewidth) {
            p0.intersection(p2);
        } else {
            p1.subtract(p2);
        }
        p0.union(p1);
        const newpath = p0.toSVGString();
        p0.delete();
        p1.delete();
        p2.delete();
        return new Path(newpath);
    }
}

function render2path(shape: ShapeView): Path {
    const shapeIsGroup = shape instanceof GroupShapeView;
    let fixedRadius: number | undefined;
    if (shapeIsGroup) fixedRadius = shape.fixedRadius;
    if (!shapeIsGroup) {
        if (!shape.isVisible) return new Path();
        if (shape instanceof TextShapeView) return shape.getTextPath().clone();
        // todo pathshape2
        if (shape.data instanceof PathShape && (!shape.data.isClosed || !hasFill(shape))) {
            return border2path(shape, shape.getBorders());
        }
        return shape.getPath().clone();
    } else if (shape.childs.length === 0) {
        return new Path();
    }

    let fVisibleIdx = 0;
    for (let i = 0; i < shape.m_children.length; ++i) {
        if ((shape.m_children[i] as ShapeView).isVisible) {
            fVisibleIdx = i;
            break;
        }
    }

    const cc = shape.m_children.length;
    if (fVisibleIdx >= cc) return new Path();

    const child0 = shape.m_children[fVisibleIdx] as ShapeView;
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
        const child1 = shape.m_children[i] as ShapeView;
        if (!child1.isVisible) continue;
        const frame1 = child1.frame;
        const path1 = render2path(child1);
        if (child1.isNoTransform()) {
            path1.translate(frame1.x, frame1.y);
        } else {
            path1.transform(child1.matrix2Parent())
        }
        const pathop = child1.m_data.boolOp ?? BoolOp.None;
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


export class BoolShapeView extends GroupShapeView {

    get data(): BoolShape {
        return this.m_data as BoolShape;
    }

    getBoolOp() {
        return this.data.getBoolOp();
    }

    constructor(ctx: DViewCtx, props: PropsType, isTopClass: boolean = true) {
        super(ctx, props, false);
        if (isTopClass) this.afterInit();
    }

    protected _bubblewatcher(...args: any[]) {
        super._bubblewatcher(...args);
        this.m_path = undefined;
        this.m_pathstr = undefined;
        this.m_ctx.setDirty(this);
    }

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        if (args.includes('variables')) {
            this.m_path = undefined;
            this.m_pathstr = undefined;
        }
    }

    protected renderFills(): EL[] {
        return renderFills(elh, this.getFills(), this.frame, this.getPathStr());
    }

    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr(), this.data);
    }

    getPath() {
        if (this.m_path) return this.m_path;
        this.m_path = render2path(this);
        this.m_path.freeze();
        return this.m_path;
    }

    // childs
    protected renderContents(): EL[] {
        return [];
    }
}