/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BoolOp, BoolShape, ShapeFrame, parsePath } from "../data";
import { ShapeView } from "./shape";
import { TextShapeView } from "./textshape";
import { GroupShapeView } from "./groupshape";
import { FrameGrid } from "../basic/framegrid";
import { Path } from "@kcdesign/path";
import { convertPath2CurvePoints } from "../data/pathconvert";
import { OpType } from "@kcdesign/path";
import { PathShapeView } from "./pathshape";
import { stroke } from "../render/stroke";
import { DViewCtx, PropsType } from "./viewctx";
import { BoolModifyEffect } from "./proxy/effects/bool";
import { BoolShapeViewCache } from "./proxy/cache/bool";

function opPath(bop: BoolOp, path0: Path, path1: Path, isIntersect: boolean): Path {
    switch (bop) {
        case BoolOp.Diff:
            if (isIntersect) path0.op(path1, OpType.Xor);
            else path0.addPath(path1);
            // path0.op(path1, OpType.Xor);
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
            if (!isIntersect) path0.addPath(path1)
            else path0.op(path1, OpType.Union);
            // path0.op(path1, OpType.Union);
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
        const cf = c.relativeFrame;
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
        // 上面个计算方式对于group类shape不对
        frame0 = child0.relativeFrame
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
            frame1 = child1.relativeFrame;
        } else {
            path1.transform(child1.matrix2Parent());
            const bounds = path1.bbox();
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
    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.effect = new BoolModifyEffect(this);
        this.cache = new BoolShapeViewCache(this);
    }
    onMounted() {
        super.onMounted();
    }

    get data(): BoolShape {
        return this.m_data as BoolShape;
    }

    getBoolOp() {
        return this.data.getBoolOp();
    }

    protected _bubble_watcher(...args: any[]) {
        super._bubble_watcher(...args);
        this.cache.clearCacheByKeys(['m_path', 'm_pathstr']);
        this.m_ctx.setDirty(this);
    }

    asyncRender() {
        return this.render();
    }

    render() {
        return this.m_renderer.render();
    }
}

const getPath = (shape: ShapeView) => {
    if (!shape?.isVisible) return new Path();
    if (shape instanceof GroupShapeView && !(shape instanceof BoolShapeView)) {
        return render2path(shape, BoolOp.Union);
    } else if (shape instanceof TextShapeView) {
        return shape.getTextPath().clone();
    } else if (shape instanceof PathShapeView && (!shape.data.isClosed || !hasFill(shape))) {
        const border = shape.getBorder();
        const isEnabled = border.strokePaints.some(p => p.isEnabled);
        if (isEnabled) {
            return stroke(shape);
        }
        return new Path();
    } else {
        return shape.getPath().clone();
    }
}