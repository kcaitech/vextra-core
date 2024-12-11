import { BoolOp, BoolShape, BorderPosition, ShapeFrame, parsePath, FillType, GradientType, ShapeType } from "../data/classes";
import { ShapeView, updateFrame } from "./shape";
import { TextShapeView } from "./textshape";
import { GroupShapeView } from "./groupshape";
import { EL, elh } from "./el";
import { renderBorders, renderFills } from "../render";
import { FrameGrid } from "../basic/framegrid";
import { border2path } from "../editor/utils/path";
import { Path } from "@kcdesign/path";
import { convertPath2CurvePoints } from "../data/pathconvert";
import { OpType } from "@kcdesign/path";
import { gPal, IPalPath } from "../basic/pal";
import { PathShapeView } from "./pathshape";
import { importFill } from "../data/baseimport";
import { exportFill } from "../data/baseexport";

function opPath(bop: BoolOp, path0: Path, path1: Path, isIntersect: boolean): Path {
    switch (bop) {
        case BoolOp.Diff:
            // if (isIntersect) path0.op(path1, OpType.Xor);
            // else path0.addPath(path1);
            path0.op(path1, OpType.Xor);
            break;
        case BoolOp.Intersect:
            if (isIntersect) {
                path0.op(path1, OpType.Intersection);
            } else {
                return new Path();
            }
            break;
        case BoolOp.Subtract:
            if (isIntersect) path0.op(path1, OpType.Difference);
            break;
        case BoolOp.Union:
            // if (!isIntersect) path0.addPath(path1)
            // else path0.op(path1, OpType.Union);
            path0.op(path1, OpType.Union);
            break;
    }
    return path0;
}

function hasFill(shape: ShapeView) {
    const fills = shape.getFills();
    if (fills.length === 0) return false;
    for (let i = 0, len = fills.length; i < len; ++i) {
        if (fills[i].isEnabled) return true;
    }
    return false;
}

function boundsFrame(shape: ShapeView): ShapeFrame {
    let minx = 0, maxx = 0, miny = 0, maxy = 0;
    shape.childs.forEach((c, i) => {
        const cf = c._p_frame;
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

export function render2path(shape: ShapeView, defaultOp = BoolOp.None): Path {
    const shapeIsGroup = shape instanceof GroupShapeView;
    let fixedRadius: number | undefined;
    if (shapeIsGroup) fixedRadius = shape.fixedRadius;
    if (!shapeIsGroup) {
        return getPath(shape);
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
    let path0 = getPath(child0);
    if (!path0) return new Path();
    
    if (child0.isNoTransform()) {
        path0.translate(child0.transform.translateX, child0.transform.translateY);
        frame0 = new ShapeFrame(child0.transform.translateX, child0.transform.translateY, child0.frame.width, child0.frame.height);
    } else {
        path0.transform(child0.matrix2Parent());
        const bounds = path0.bbox();
        frame0 = new ShapeFrame(bounds.x, bounds.y, bounds.w, bounds.h);
    }

    const pframe = boundsFrame(shape);
    const gridSize = Math.ceil(Math.sqrt(cc));

    const grid = new FrameGrid(pframe.width / gridSize, pframe.height / gridSize, gridSize, gridSize, pframe.x, pframe.y);

    grid.push(frame0);

    for (let i = fVisibleIdx + 1; i < cc; i++) {
        const child1 = shape.m_children[i] as ShapeView;
        if (!child1.isVisible) continue;
        let frame1: ShapeFrame;
        const path1 = getPath(child1)!;
        if (!path1) continue;
        if (child1.isNoTransform()) {
            path1.translate(child1.transform.translateX, child1.transform.translateY);
            frame1 = new ShapeFrame(child1.transform.translateX, child1.transform.translateY, child1.frame.width, child1.frame.height);
        } else {
            path1.transform(child1.matrix2Parent());
            const bounds = path0.bbox();
            frame1 = new ShapeFrame(bounds.x, bounds.y, bounds.w, bounds.h);
        }
        const pathop = child1.m_data.boolOp ?? defaultOp;

        if (pathop === BoolOp.None) {
            grid.push(frame1);
            path0.addPath(path1)
        } else {
            const intersect = grid.checkIntersectAndPush(frame1);
            const path = opPath(pathop, path0, path1, intersect);
            if (path !== path0) {
                path0 = path;
            }
        }
    }

    let resultpath: Path | undefined;
    if (fixedRadius && fixedRadius > 0) {
        const frame = path0.bbox();
        const segs = convertPath2CurvePoints(path0, frame.w, frame.w);
        const ps = new Path();
        segs.forEach((seg) => {
            ps.addPath(parsePath(seg.points, seg.isClosed, frame.w, frame.w, fixedRadius));
        })
        resultpath = ps;
    } else {
        resultpath = path0;
    }
    return resultpath;
}


export class BoolShapeView extends GroupShapeView {

    onMounted() {
        super.onMounted();
        this.createBorderPath();
    }

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

        if (args.includes('variables') || args.includes('childs')) {
            this.m_path = undefined;
            this.m_pathstr = undefined;
        }

        if (args.includes('fills')) {
            this.m_fills = undefined;
            this.m_border_path = undefined;
            this.m_border_path_box = undefined;
            this.createBorderPath();
        }

        if (args.includes('borders')) {
            this.m_borders = undefined;
            this.m_border_path = undefined;
            this.m_border_path_box = undefined;
            this.createBorderPath();
        }
    }

    protected renderFills(): EL[] {
        let fills = this.getFills();
        if (this.mask) {
            fills = fills.map(f => {
                if (f.fillType === FillType.Gradient && f.gradient?.gradientType === GradientType.Angular) {
                    const nf = importFill(exportFill(f));
                    nf.fillType = FillType.SolidColor;
                    return nf;
                } else return f;
            })
        }
        return renderFills(elh, fills, this.size, this.getPathStr(), 'fill-' + this.id);
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

    asyncRender() {
        return this.render();
    }

    updateFrames(): boolean {
        const borders = this.getBorders();
        let maxborder = 0;
        borders.forEach(b => {
            if (b.position === BorderPosition.Outer) {
                maxborder = Math.max(b.thickness, maxborder);
            } else if (b.position === BorderPosition.Center) {
                maxborder = Math.max(b.thickness / 2, maxborder);
            }
        })

        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;
        const bounds = this.getPath().bbox();
        if (updateFrame(this.m_frame, bounds.x, bounds.y, bounds.w, bounds.h)) {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
            changed = true;
        }
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

    createBorderPath() {
        const borders = this.getBorders();
        const fills = this.getFills();
        if (!fills.length && borders.length === 1) {
            this.m_border_path = border2path(this, borders[0]);
            const bbox = this.m_border_path.bbox();
            this.m_border_path_box = new ShapeFrame(bbox.x, bbox.y, bbox.w, bbox.h);
        }
    }
}

const getPath = (shape: ShapeView) => {
    if (!shape?.isVisible) return new Path();
    if (shape instanceof GroupShapeView && !(shape instanceof BoolShapeView)) {
        return render2path(shape, BoolOp.Union);
    } else if (shape instanceof TextShapeView) {
        return shape.getTextPath().clone();
    } else if (shape instanceof PathShapeView && (!shape.data.isClosed || !hasFill(shape))) {
        const borders = shape.getBorders();
        let p0: IPalPath | undefined;
        for (let i = borders.length - 1; i > -1; i--) {
            const b = borders[i];
            if (!b.isEnabled) continue;
            const path = border2path(shape, borders[i]);
            if (!p0) {
                p0 = gPal.makePalPath(path.toSVGString());
            } else {
                const p1 = gPal.makePalPath(path.toSVGString());
                p0.union(p1);
            }
        }
        return p0 ? Path.fromSVGString(p0.toSVGString()) : new Path();
    } else {
        return shape.getPath().clone();
    }
}