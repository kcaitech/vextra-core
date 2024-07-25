import { BoolOp, BoolShape, Border, BorderPosition, Path, PathShape, ShapeFrame, ShapeSize, parsePath } from "../data/classes";
import { ShapeView, updateFrame } from "./shape";
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
    _offsetx: number;
    _offsety: number;

    constructor(cellWidth: number, cellHeight: number, cellRowsCount: number, cellColsCount: number, offsetx: number, offsety: number) {
        this._cellWidth = cellWidth;
        this._cellHeight = cellHeight;
        this._cellRowsCount = cellRowsCount;
        this._cellColsCount = cellColsCount;
        this._offsetx = offsetx;
        this._offsety = offsety;
    }

    checkIntersectAndPush(frame: ShapeFrame): boolean {
        return this._checkIntersectAndPush(frame, false);
    }

    push(frame: ShapeFrame) {
        this._checkIntersectAndPush(frame, true);
    }

    private _checkIntersectAndPush(frame: ShapeFrame, preset: boolean): boolean {
        const xs = (frame.x) - this._offsetx;
        const xe = (frame.x + frame.width) - this._offsetx;
        const ys = (frame.y) - this._offsety;
        const ye = (frame.y + frame.height) - this._offsety;

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

function boundsFrame(shape: ShapeView): ShapeFrame {
    let minx = 0, maxx = 0, miny = 0, maxy = 0;
    shape.childs.forEach((c, i) => {
        const cf = c.frame;
        if (i === 0) {
            minx = cf.x;
            maxx = cf.x + cf.width;
            miny = cf.y;
            maxy = cf.y + cf.height;
        } else {
            minx = Math.min(minx, cf.x);
            maxx = Math.max(maxx, cf.x + cf.width);
            miny = Math.min(miny, cf.y);
            maxy = Math.max(maxy, cf.y + cf.height);
        }
    })
    return new ShapeFrame(minx, miny, maxx - minx, maxy - miny);
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
    let frame0: ShapeFrame;
    const path0 = render2path(child0);

    if (child0.isNoTransform()) {
        path0.translate(child0.transform.translateX, child0.transform.translateY);
        frame0 = new ShapeFrame(child0.transform.translateX, child0.transform.translateY, child0.frame.width, child0.frame.height);
    } else {
        path0.transform(child0.matrix2Parent());
        const bounds = path0.calcBounds();
        frame0 = new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    }

    const pframe = boundsFrame(shape);
    const gridSize = Math.ceil(Math.sqrt(cc));

    const grid = new FrameGrid(pframe.width / gridSize, pframe.height / gridSize, gridSize, gridSize, pframe.x, pframe.y);

    grid.push(frame0);

    let joinPath: IPalPath = gPal.makePalPath(path0.toString());
    for (let i = fVisibleIdx + 1; i < cc; i++) {
        const child1 = shape.m_children[i] as ShapeView;
        if (!child1.isVisible) continue;
        let frame1: ShapeFrame;
        const path1 = render2path(child1);
        if (child1.isNoTransform()) {
            path1.translate(child1.transform.translateX, child1.transform.translateY);
            frame1 = new ShapeFrame(child1.transform.translateX, child1.transform.translateY, child1.frame.width, child1.frame.height);
        } else {
            path1.transform(child1.matrix2Parent());
            const bounds = path1.calcBounds();
            frame1 = new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
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
        // const frame = this.frame;
        // if (frame.x !== 0 || frame.y !== 0) this.m_path.translate(frame.x, frame.y);
        this.m_path.freeze();
        return this.m_path;
    }

    // childs
    protected renderContents(): EL[] {
        return [];
    }

    updateFrames(): boolean {
        const bounds = this.getPath().calcBounds();

        const borders = this.getBorders();
        let maxborder = 0;
        borders.forEach(b => {
            if (b.position === BorderPosition.Outer) {
                maxborder = Math.max(b.thickness, maxborder);
            }
            else if (b.position !== BorderPosition.Center) {
                maxborder = Math.max(b.thickness / 2, maxborder);
            }
        })

        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;

        if (updateFrame(this.m_frame, bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)) changed = true;
        {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        };
        // update visible
        if (updateFrame(this.m_visibleFrame, this.frame.x - maxborder, this.frame.y - maxborder, this.frame.width + maxborder * 2, this.frame.height + maxborder * 2)) changed = true;

        const childouterbounds = this.m_children.map(c => (c as ShapeView)._p_outerFrame);
        const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
            if (i === 0) {
                p.minx = c.x;
                p.maxx = c.x + c.width;
                p.miny = c.y;
                p.maxy = c.y + c.height;
            } else {
                p.minx = Math.min(p.minx, c.x);
                p.maxx = Math.max(p.maxx, c.x + c.width);
                p.miny = Math.min(p.miny, c.y);
                p.maxy = Math.max(p.maxy, c.y + c.height);
            }
            return p;
        }
        const outerbounds = childouterbounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
        // update outer
        if (updateFrame(this.m_outerFrame, outerbounds.minx, outerbounds.miny, outerbounds.maxx - outerbounds.minx, outerbounds.maxy - outerbounds.miny)) changed = true;

        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.transform;
            if (this.isNoTransform()) {
                return updateFrame(out, i.x + transform.translateX, i.y + transform.translateY, i.width, i.height);
            }
            const frame = i;
            const m = transform;
            const corners = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height }]
                .map((p) => m.computeCoord(p));
            const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
            const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
            const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
            const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
            return updateFrame(out, minx, miny, maxx - minx, maxy - miny);
        }
        if (mapframe(this.m_frame, this._p_frame)) changed = true;
        if (mapframe(this.m_visibleFrame, this._p_visibleFrame)) changed = true;
        if (mapframe(this.m_outerFrame, this._p_outerFrame)) changed = true;
        return changed;
    }
}