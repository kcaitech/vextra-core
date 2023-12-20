// symbolref 缩放引用的组件用
// 与editor/frame.ts 重复

import { Matrix } from "../basic/matrix";
import { GroupShape, PathShape, Shape, ShapeFrame, ShapeType, ImageShape } from "./shape";
import { Point2D } from "./typesdefine";
import { ResizingConstraints } from "./consts";

// 需要proxy: frame, rotation, isFlippedHorizontal, isFlippedVertical, points
function shapeModifyX(shape: Shape, x: number): void {
    shape.frame.x = x;
}
function shapeModifyY(shape: Shape, y: number): void {
    shape.frame.y = y;
}
function shapeModifyWH(shape: Shape, w: number, h: number): void {
    const frame = shape.frame;
    frame.width = w;
    frame.height = h;
}
function shapeModifyWideX(shape: Shape, x: number) {
    (shape as GroupShape).wideframe.x = x;
}
function shapeMofifyWideY(shape: Shape, y: number) {
    (shape as GroupShape).wideframe.y = y;
}
function shapeModifyWideWH(shape: Shape, w: number, h:number) {
    (shape as GroupShape).wideframe.width = w;
    (shape as GroupShape).wideframe.width = h;
}
function shapeModifyRotate(shape: Shape, rotate: number): void {
    shape.rotation = rotate;
}
function shapeModifyHFlip(shape: Shape, hflip: boolean | undefined): void {
    shape.isFlippedHorizontal = hflip;
}
function shapeModifyVFlip(shape: Shape, vflip: boolean | undefined): void {
    shape.isFlippedVertical = vflip;
}
function shapeModifyCurvPoint(shape: PathShape, index: number, point: Point2D) {
    const p = shape.points[index];
    p.x = point.x;
    p.y = point.y;
}
function shapeModifyCurvFromPoint(shape: PathShape, index: number, point: Point2D) {
    const p = shape.points[index];
    p.fromX = point.x;
    p.fromY = point.y;
}
function shapeModifyCurvToPoint(shape: PathShape, index: number, point: Point2D) {
    const p = shape.points[index];
    p.toX = point.x;
    p.toY = point.y;
}

/**
 * 
 * @param shape 当前容器（如：symbolref）, 需要提供childs?
 * @param scaleX 
 * @param scaleY 
 * @param symbolFrame symbol的大小
 * @returns 
 */
export function layoutChilds(childs: Shape[], containerFrame: ShapeFrame, symbolFrame: ShapeFrame) {
    // if (shape.type === ShapeType.Artboard) return; // 容器不需要调整子对象

    const scaleX: number = containerFrame.width / symbolFrame.width;
    const scaleY: number = containerFrame.height / symbolFrame.height;

    // const childs = shape.childs;
    for (let i = 0, len = childs.length; i < len; i++) {
        const c = childs[i];

        // 根据resizeconstrain修正scale
        const resizingConstraint = c.resizingConstraint;
        if (resizingConstraint && (ResizingConstraints.hasWidth(resizingConstraint) || ResizingConstraints.hasHeight(resizingConstraint))) {
            const fixWidth = ResizingConstraints.hasWidth(resizingConstraint);
            const fixHeight = ResizingConstraints.hasHeight(resizingConstraint);

            if (fixWidth && fixHeight) {
                // 不需要缩放，但要调整位置
                const cFrame = c.frame;
                const cW = cFrame.width;
                const cH = cFrame.height;
                const cX = cFrame.x * scaleX + cW * (scaleX - 1) / 2;
                const cY = cFrame.y * scaleY + cH * (scaleY - 1) / 2;

                // constrain position
                const f = fixConstrainFrame(c, cX, cY, cW, cH, symbolFrame, containerFrame);
                setFrame(c, f.x, f.y, f.w, f.h);
            }

            else if (c.rotation) {
                // 
                const m = new Matrix();
                m.rotate(c.rotation / 360 * 2 * Math.PI);
                m.scale(scaleX, scaleY);
                const _newscale = m.computeRef(1, 1);
                m.scale(1 / scaleX, 1 / scaleY);
                const newscale = m.inverseRef(_newscale.x, _newscale.y);
                const cFrame = c.frame;
                let cX = cFrame.x * scaleX;
                let cY = cFrame.y * scaleY;
                if (fixWidth) {
                    cX += cFrame.width * (newscale.x - 1) / 2;
                    newscale.x = 1;
                }
                else {
                    cY += cFrame.height * (newscale.y - 1) / 2;
                    newscale.y = 1;
                }
                if (fixWidth) {
                    newscale.x = 1;
                }
                else {
                    newscale.y = 1;
                }

                const cW = cFrame.width * newscale.x;
                const cH = cFrame.height * newscale.y;

                // constrain position
                const f = fixConstrainFrame(c, cX, cY, cW, cH, symbolFrame, containerFrame);
                setFrame(c, f.x, f.y, f.w, f.h);

            }
            else {
                const newscaleX = fixWidth ? 1 : scaleX;
                const newscaleY = fixHeight ? 1 : scaleY;
                const cFrame = c.frame;
                let cX = cFrame.x * scaleX;
                let cY = cFrame.y * scaleY;
                if (fixWidth) cX += cFrame.width * (scaleX - 1) / 2;
                if (fixHeight) cY += cFrame.height * (scaleY - 1) / 2;
                const cW = cFrame.width * newscaleX;
                const cH = cFrame.height * newscaleY;

                // constrain position
                const f = fixConstrainFrame(c, cX, cY, cW, cH, symbolFrame, containerFrame);
                setFrame(c, f.x, f.y, f.w, f.h);
            }
        }
        else if (!c.rotation) {
            const cFrame = c.frame;
            const cX = cFrame.x * scaleX;
            const cY = cFrame.y * scaleY;
            const cW = cFrame.width * scaleX;
            const cH = cFrame.height * scaleY;
            const f = fixConstrainFrame(c, cX, cY, cW, cH, symbolFrame, containerFrame);
            setFrame(c, f.x, f.y, f.w, f.h);
        }
        else if (c instanceof GroupShape && c.type === ShapeType.Group) {
            // 需要摆正
            const boundingBox = c.boundingBox();
            const matrix = c.matrix2Parent();

            for (let i = 0, len = c.childs.length; i < len; i++) { // 将旋转、翻转放入到子对象
                const cc = c.childs[i]
                const m1 = cc.matrix2Parent();
                m1.multiAtLeft(matrix);
                const target = m1.computeCoord(0, 0);

                if (c.rotation) shapeModifyRotate(cc, (cc.rotation || 0) + c.rotation);
                if (c.isFlippedHorizontal) shapeModifyHFlip(cc, !cc.isFlippedHorizontal);
                if (c.isFlippedVertical) shapeModifyVFlip(cc, !cc.isFlippedVertical);

                const m2 = cc.matrix2Parent();
                m2.trans(boundingBox.x, boundingBox.y);
                const cur = m2.computeCoord(0, 0);

                shapeModifyX(cc, cc.frame.x + target.x - cur.x);
                shapeModifyY(cc, cc.frame.y + target.y - cur.y);
            }

            if (c.rotation) shapeModifyRotate(c, 0);
            if (c.isFlippedHorizontal) shapeModifyHFlip(c, !c.isFlippedHorizontal);
            if (c.isFlippedVertical) shapeModifyVFlip(c, !c.isFlippedVertical);

            // shapeModifyX(c, boundingBox.x * scaleX);
            // shapeModifyY(c, boundingBox.y * scaleY);
            const width = boundingBox.width * scaleX;
            const height = boundingBox.height * scaleY;
            // shapeModifyWH(c, width, height);
            // afterModifyGroupShapeWH(c, scaleX, scaleY, boundingBox);
            const f = fixConstrainFrame(c, boundingBox.x * scaleX, boundingBox.y * scaleY, width, height, symbolFrame, containerFrame, boundingBox)
            // todo
            shapeModifyX(c, f.x);
            shapeModifyY(c, f.y);
            shapeModifyWH(c, f.w, f.h);

            layoutChilds(c.childs, c.frame, boundingBox);
        }
        else if (c instanceof PathShape && !(c instanceof ImageShape)) {
            // 摆正并处理points
            const matrix = c.matrix2Parent();
            const cFrame = c.frame;
            const boundingBox = c.boundingBox();

            matrix.preScale(cFrame.width, cFrame.height);
            if (c.rotation) shapeModifyRotate(c, 0);
            if (c.isFlippedHorizontal) shapeModifyHFlip(c, !c.isFlippedHorizontal);
            if (c.isFlippedVertical) shapeModifyVFlip(c, !c.isFlippedVertical);

            shapeModifyX(c, boundingBox.x);
            shapeModifyY(c, boundingBox.y);
            shapeModifyWH(c, boundingBox.width, boundingBox.height);

            const matrix2 = c.matrix2Parent();
            matrix2.preScale(boundingBox.width, boundingBox.height); // 当对象太小时，求逆矩阵会infinity
            matrix.multiAtLeft(matrix2.inverse);
            const points = c.points;
            for (let i = 0, len = points.length; i < len; i++) {
                const p = points[i];
                if (p.hasFrom) {
                    const curveFrom = matrix.computeCoord(p.fromX || 0, p.fromY || 0);
                    shapeModifyCurvFromPoint(c, i, curveFrom);
                }
                if (p.hasTo) {
                    const curveTo = matrix.computeCoord(p.toX || 0, p.toY || 0);
                    shapeModifyCurvToPoint(c, i, curveTo);
                }
                const point = matrix.computeCoord(p.x, p.y);
                shapeModifyCurvPoint(c, i, point);
            }

            // scale
            // shapeModifyX(c, boundingBox.x * scaleX);
            // shapeModifyY(c, boundingBox.y * scaleY);
            const width = boundingBox.width * scaleX;
            const height = boundingBox.height * scaleY;
            // shapeModifyWH(c, width, height);
            const f = fixConstrainFrame(c, boundingBox.x * scaleX, boundingBox.y * scaleY, width, height, symbolFrame, containerFrame, boundingBox)
            setFrame(c, f.x, f.y, f.w, f.h);
        }
        else { // textshape imageshape symbolrefshape
            // 需要调整位置跟大小
            // const cFrame = c.frame;
            // const matrix = c.matrix2Parent();
            // const current = [{ x: 0, y: 0 }, { x: cFrame.width, y: cFrame.height }]
            //     .map((p) => matrix.computeCoord(p));

            // const target = current.map((p) => {
            //     return { x: p.x * scaleX, y: p.y * scaleY }
            // })
            // const matrixarr = matrix.toArray();
            // matrixarr[4] = target[0].x;
            // matrixarr[5] = target[0].y;
            // const m2 = new Matrix(matrixarr);
            // const m2inverse = new Matrix(m2.inverse)

            // const invertTarget = target.map((p) => m2inverse.computeCoord(p))

            // const wh = { x: invertTarget[1].x - invertTarget[0].x, y: invertTarget[1].y - invertTarget[0].y }

            // // 计算新的matrix 2 parent
            // const matrix2 = new Matrix();
            // {
            //     const cx = wh.x / 2;
            //     const cy = wh.y / 2;
            //     matrix2.trans(-cx, -cy);
            //     if (c.rotation) matrix2.rotate(c.rotation / 180 * Math.PI);
            //     if (c.isFlippedHorizontal) matrix2.flipHoriz();
            //     if (c.isFlippedVertical) matrix2.flipVert();
            //     matrix2.trans(cx, cy);
            //     matrix2.trans(cFrame.x, cFrame.y);
            // }
            // const xy = matrix2.computeCoord(0, 0);

            // const dx = target[0].x - xy.x;
            // const dy = target[0].y - xy.y;
            // const f = fixConstrainFrame(c, cFrame.x + dx, cFrame.y + dy, wh.x, wh.y, symbolFrame, containerFrame);
            // setFrame(c, f.x, f.y, f.w, f.h);

            const m = new Matrix();
            m.rotate(c.rotation / 360 * 2 * Math.PI);
            m.scale(scaleX, scaleY);

            const _newscale = m.computeRef(1, 1);
            m.scale(1 / scaleX, 1 / scaleY);
            const newscale = m.inverseRef(_newscale.x, _newscale.y);

            const newscaleX = newscale.x;
            const newscaleY = newscale.y;
            // const newscale = m.inverseRef(scaleX, scaleY);
            const cFrame = c.frame;
            const cX = cFrame.x * scaleX;
            const cY = cFrame.y * scaleY;
            const cW = cFrame.width * newscaleX;
            const cH = cFrame.height * newscaleY;

            // constrain position
            const f = fixConstrainFrame(c, cX, cY, cW, cH, symbolFrame, containerFrame);
            setFrame(c, f.x, f.y, f.w, f.h);
        }
    }
}

function fixConstrainFrame(shape: Shape, x: number, y: number, w: number, h: number, originParentFrame: ShapeFrame, curParentFrame: ShapeFrame, cFrame?: ShapeFrame) {
    cFrame = cFrame ?? shape.frame;
    const resizingConstraint = shape.resizingConstraint;
    if (!resizingConstraint || ResizingConstraints.isUnset(resizingConstraint)) {
        // return setFrame(shape, x, y, w, h);
        return { x, y, w, h }
    }
    else {
        // 水平
        const hasWidth = ResizingConstraints.hasWidth(resizingConstraint);
        const hasLeft = ResizingConstraints.hasLeft(resizingConstraint);
        const hasRight = ResizingConstraints.hasRight(resizingConstraint);
        // 计算width, x
        // 宽度与同时设置左右是互斥关系，万一数据出错，以哪个优先？先以左右吧
        let cw = hasWidth ? cFrame.width : w;
        let cx = x;
        if (hasLeft && hasRight) {
            if (!hasWidth) {

                cx = cFrame.x;
                const dis = originParentFrame.width - (cFrame.x + cFrame.width);
                cw = curParentFrame.width - dis - cx;
            }
        }
        else if (hasLeft) {
            cx = cFrame.x;
        }
        else if (hasRight) {
            cx = x;
            const dis = originParentFrame.width - (cFrame.x + cFrame.width);
            cw = curParentFrame.width - dis - cx;
        }
        // else if (hasWidth) {
        //     // 居中
        //     cx += (w - cFrame.width) / 2;
        // }

        // 垂直
        const hasHeight = ResizingConstraints.hasHeight(resizingConstraint);
        const hasTop = ResizingConstraints.hasTop(resizingConstraint);
        const hasBottom = ResizingConstraints.hasBottom(resizingConstraint);
        // 计算height, y
        let ch = hasHeight ? cFrame.height : h;
        let cy = y;
        if (hasTop && hasBottom) {
            if (!hasHeight) {

                cy = cFrame.y;
                const dis = originParentFrame.height - (cFrame.y + cFrame.height);
                ch = curParentFrame.height - dis - cy;
            }
        }
        else if (hasTop) {
            cy = cFrame.y;
        }
        else if (hasBottom) {
            cy = y;
            const dis = originParentFrame.height - (cFrame.y + cFrame.height);
            ch = curParentFrame.height - dis - cy;
        }
        // else if (hasHeight) {
        //     // 居中
        //     cy += (h - cFrame.height) / 2;
        // }

        // return setFrame(shape, cx, cy, cw, ch);
        return { x: cx, y: cy, w: cw, h: ch }
    }
}

function setFrame(shape: Shape, x: number, y: number, w: number, h: number): boolean {
    const frame = shape.frame;
    let changed = false;
    if (x !== frame.x) {
        shapeModifyX(shape, x)
        changed = true;
    }
    if (y !== frame.y) {
        shapeModifyY(shape, y)
        changed = true;
    }
    if (w !== frame.width || h !== frame.height) {
        if (shape instanceof GroupShape && shape.type === ShapeType.Group) {
            const saveW = frame.width;
            const saveH = frame.height;
            shapeModifyWH(shape, w, h);

            layoutChilds(shape.childs, shape.frame, new ShapeFrame(frame.x, frame.y, saveW, saveH));
        }
        else {
            shapeModifyWH(shape, w, h)
        }
        changed = true;
    }
    return changed;
}
