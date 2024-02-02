import { Page } from "../data/page";
import { Matrix } from "../basic/matrix";
import { GroupShape, ImageShape, PathShape, Shape, ShapeFrame, TextShape } from "../data/shape";
import { Text } from "../data/text";
import { Point2D, ShapeType, TextBehaviour } from "../data/typesdefine";
import { fixTextShapeFrameByLayout } from "./utils/other";
import { TableShape } from "../data/table";
import { ResizingConstraints, ResizingConstraints2 } from "../data/consts";

type TextShapeLike = Shape & { text: Text }

interface PageXY {
    x: number
    y: number
}
export interface Api {
    shapeModifyX(page: Page, shape: Shape, x: number): void;
    shapeModifyY(page: Page, shape: Shape, y: number): void;
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number): void;
    shapeModifyRotate(page: Page, shape: Shape, rotate: number): void;
    shapeModifyHFlip(page: Page, shape: Shape, hflip: boolean | undefined): void;
    shapeModifyVFlip(page: Page, shape: Shape, vflip: boolean | undefined): void;
    shapeModifyTextBehaviour(page: Page, shapetext: Text, textBehaviour: TextBehaviour): void;
    shapeModifyCurvPoint(page: Page, shape: PathShape, index: number, point: Point2D): void;
    shapeModifyCurvFromPoint(page: Page, shape: PathShape, index: number, point: Point2D): void;
    shapeModifyCurvToPoint(page: Page, shape: PathShape, index: number, point: Point2D): void;
    tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number): void;
}

const minimum_WH = 0.01; // 用户可设置最小宽高值。以防止宽高在缩放后为0

export function afterModifyGroupShapeWH(api: Api, page: Page, shape: GroupShape, scaleX: number, scaleY: number, originFrame: ShapeFrame) {
    const childs = shape.childs;
    if (shape.type === ShapeType.Group) { // 编组的子元素只可为跟随缩放，应忽略constraint
        return fixIgnoreConstaintFrame(api, page, shape, scaleX, scaleY, originFrame);
    }

    for (let i = 0, len = childs.length; i < len; i++) {
        const c = childs[i];

        // 根据resizeconstrain修正scale
        const resizingConstraint = c.resizingConstraint || ResizingConstraints2.Mask;
        const fixWidth = ResizingConstraints2.isFixedWidth(resizingConstraint);
        const fixHeight = ResizingConstraints2.isFixedHeight(resizingConstraint);
        if (resizingConstraint && (fixWidth || fixHeight)) {
            if (fixWidth && fixHeight) {
                // 不需要缩放，但要调整位置
                const cFrame = c.frame;
                const cW = cFrame.width;
                const cH = cFrame.height;
                const cX = cFrame.x * scaleX + cW * (scaleX - 1) / 2;
                const cY = cFrame.y * scaleY + cH * (scaleY - 1) / 2;
                // constrain position
                const f = fixConstrainFrame(page, c, cX, cY, cW, cH, api, originFrame, shape.frame);
                setFrame(page, c, f.x, f.y, f.w, f.h, api);
            }
            else if (c.rotation) {
                // 缩放+旋转后 x,y是会变化位置的

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
                const f = fixConstrainFrame(page, c, cX, cY, cW, cH, api, originFrame, shape.frame);
                setFrame(page, c, f.x, f.y, f.w, f.h, api);

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
                const f = fixConstrainFrame(page, c, cX, cY, cW, cH, api, originFrame, shape.frame);
                setFrame(page, c, f.x, f.y, f.w, f.h, api);
            }
        }
        else if (c instanceof GroupShape) {
            // 需要摆正
            // 如果设置了固定高度或者宽度？不需要摆正
            const boundingBox = c.boundingBox();
            const matrix = c.matrix2Parent();

            for (let i = 0, len = c.childs.length; i < len; i++) { // 将旋转、翻转放入到子对象
                const cc = c.childs[i]
                const m1 = cc.matrix2Parent();
                m1.multiAtLeft(matrix);
                const target = m1.computeCoord(0, 0);

                if (c.rotation) api.shapeModifyRotate(page, cc, (cc.rotation || 0) + c.rotation);
                if (c.isFlippedHorizontal) api.shapeModifyHFlip(page, cc, !cc.isFlippedHorizontal);
                if (c.isFlippedVertical) api.shapeModifyVFlip(page, cc, !cc.isFlippedVertical);

                const m2 = cc.matrix2Parent();
                m2.trans(boundingBox.x, boundingBox.y);
                const cur = m2.computeCoord(0, 0);

                api.shapeModifyX(page, cc, cc.frame.x + target.x - cur.x);
                api.shapeModifyY(page, cc, cc.frame.y + target.y - cur.y);
            }

            if (c.rotation) api.shapeModifyRotate(page, c, 0);
            if (c.isFlippedHorizontal) api.shapeModifyHFlip(page, c, !c.isFlippedHorizontal);
            if (c.isFlippedVertical) api.shapeModifyVFlip(page, c, !c.isFlippedVertical);

            const width = boundingBox.width * scaleX;
            const height = boundingBox.height * scaleY;
            const f = fixConstrainFrame(page, c, boundingBox.x * scaleX, boundingBox.y * scaleY, width, height, api, originFrame, shape.frame, boundingBox);

            api.shapeModifyX(page, c, f.x);
            api.shapeModifyY(page, c, f.y);
            api.shapeModifyWH(page, c, f.w, f.h);

            afterModifyGroupShapeWH(api, page, c, scaleX, scaleY, boundingBox);
        }
        else if (!c.rotation) {
            const cFrame = c.frame;
            const cX = cFrame.x * scaleX;
            const cY = cFrame.y * scaleY;
            const cW = cFrame.width * scaleX;
            const cH = cFrame.height * scaleY;
            const f = fixConstrainFrame(page, c, cX, cY, cW, cH, api, originFrame, shape.frame);
            setFrame(page, c, f.x, f.y, f.w, f.h, api);
        }
        else if (c instanceof PathShape && !(c instanceof ImageShape)) {
            // 摆正并处理points
            const matrix = c.matrix2Parent();
            const cFrame = c.frame;
            const boundingBox = c.boundingBox();

            matrix.preScale(cFrame.width, cFrame.height);
            if (c.rotation) api.shapeModifyRotate(page, c, 0);
            if (c.isFlippedHorizontal) api.shapeModifyHFlip(page, c, !c.isFlippedHorizontal);
            if (c.isFlippedVertical) api.shapeModifyVFlip(page, c, !c.isFlippedVertical);

            api.shapeModifyX(page, c, boundingBox.x);
            api.shapeModifyY(page, c, boundingBox.y);
            api.shapeModifyWH(page, c, boundingBox.width, boundingBox.height);

            const matrix2 = c.matrix2Parent();
            matrix2.preScale(boundingBox.width, boundingBox.height); // 当对象太小时，求逆矩阵会infinity
            matrix.multiAtLeft(matrix2.inverse);
            const points = c.points;
            for (let i = 0, len = points.length; i < len; i++) {
                const p = points[i];
                if (p.hasFrom) {
                    const curveFrom = matrix.computeCoord(p.fromX || 0, p.fromY || 0);
                    api.shapeModifyCurvFromPoint(page, c, i, curveFrom);
                }
                if (p.hasTo) {
                    const curveTo = matrix.computeCoord(p.toX || 0, p.toY || 0);
                    api.shapeModifyCurvToPoint(page, c, i, curveTo);
                }
                const point = matrix.computeCoord(p.x, p.y);
                api.shapeModifyCurvPoint(page, c, i, point);
            }

            // scale
            // api.shapeModifyX(page, c, boundingBox.x * scaleX);
            // api.shapeModifyY(page, c, boundingBox.y * scaleY);
            const width = boundingBox.width * scaleX;
            const height = boundingBox.height * scaleY;
            // api.shapeModifyWH(page, c, width, height);
            const f = fixConstrainFrame(page, c, boundingBox.x * scaleX, boundingBox.y * scaleY, width, height, api, originFrame, shape.frame, boundingBox)
            setFrame(page, c, f.x, f.y, f.w, f.h, api);
        }
        else { // textshape imageshape symbolrefshape
            // // 需要调整位置跟大小
            const cFrame = c.frame;
            const matrix = c.matrix2Parent();
            const current = [{ x: 0, y: 0 }, { x: cFrame.width, y: cFrame.height }]
                .map((p) => matrix.computeCoord(p));

            const target = current.map((p) => {
                return { x: p.x * scaleX, y: p.y * scaleY }
            })
            const matrixarr = matrix.toArray();
            matrixarr[4] = target[0].x;
            matrixarr[5] = target[0].y;
            const m2 = new Matrix(matrixarr);
            const m2inverse = new Matrix(m2.inverse)

            const invertTarget = target.map((p) => m2inverse.computeCoord(p))

            const wh = { x: invertTarget[1].x - invertTarget[0].x, y: invertTarget[1].y - invertTarget[0].y }

            // 计算新的matrix 2 parent
            const matrix2 = new Matrix();
            {
                const cx = wh.x / 2;
                const cy = wh.y / 2;
                matrix2.trans(-cx, -cy);
                if (c.rotation) matrix2.rotate(c.rotation / 180 * Math.PI);
                if (c.isFlippedHorizontal) matrix2.flipHoriz();
                if (c.isFlippedVertical) matrix2.flipVert();
                matrix2.trans(cx, cy);
                matrix2.trans(cFrame.x, cFrame.y);
            }
            const xy = matrix2.computeCoord(0, 0);

            const dx = target[0].x - xy.x;
            const dy = target[0].y - xy.y;
            const f = fixConstrainFrame(page, c, cFrame.x + dx, cFrame.y + dy, wh.x, wh.y, api, originFrame, shape.frame);
            setFrame(page, c, f.x, f.y, f.w, f.h, api);
        }
    }
}

/**
 * @description 忽略约束(或者说把约束表现统一认定为跟随缩放)
 */
function fixIgnoreConstaintFrame(api: Api, page: Page, shape: GroupShape, scaleX: number, scaleY: number, originFrame: ShapeFrame) {
    const childs = shape.childs;

    for (let i = 0, len = childs.length; i < len; i++) {
        const c = childs[i];

        if (c instanceof GroupShape) {
            const boundingBox = c.boundingBox();
            const matrix = c.matrix2Parent();

            for (let i = 0, len = c.childs.length; i < len; i++) { // 将旋转、翻转放入到子对象
                const cc = (c as GroupShape).childs[i]
                const m1 = cc.matrix2Parent();
                m1.multiAtLeft(matrix);
                const target = m1.computeCoord(0, 0);

                if (c.rotation) api.shapeModifyRotate(page, cc, (cc.rotation || 0) + c.rotation);
                if (c.isFlippedHorizontal) api.shapeModifyHFlip(page, cc, !cc.isFlippedHorizontal);
                if (c.isFlippedVertical) api.shapeModifyVFlip(page, cc, !cc.isFlippedVertical);

                const m2 = cc.matrix2Parent();
                m2.trans(boundingBox.x, boundingBox.y);
                const cur = m2.computeCoord(0, 0);

                api.shapeModifyX(page, cc, cc.frame.x + target.x - cur.x);
                api.shapeModifyY(page, cc, cc.frame.y + target.y - cur.y);
            }

            if (c.rotation) api.shapeModifyRotate(page, c, 0);
            if (c.isFlippedHorizontal) api.shapeModifyHFlip(page, c, !c.isFlippedHorizontal);
            if (c.isFlippedVertical) api.shapeModifyVFlip(page, c, !c.isFlippedVertical);

            api.shapeModifyX(page, c, boundingBox.x * scaleX);
            api.shapeModifyY(page, c, boundingBox.y * scaleY);
            api.shapeModifyWH(page, c, boundingBox.width * scaleX, boundingBox.height * scaleY);

            afterModifyGroupShapeWH(api, page, c, scaleX, scaleY, boundingBox);
        }
        else if (!c.rotation) {
            const cFrame = c.frame;
            const cX = cFrame.x * scaleX;
            const cY = cFrame.y * scaleY;
            const cW = cFrame.width * scaleX;
            const cH = cFrame.height * scaleY;
            setFrame(page, c, cX, cY, cW, cH, api);
        }
        else if (c instanceof PathShape && !(c instanceof ImageShape)) {
            // 摆正并处理points
            const matrix = c.matrix2Parent();
            const cFrame = c.frame;
            const boundingBox = c.boundingBox();

            matrix.preScale(cFrame.width, cFrame.height);
            if (c.rotation) api.shapeModifyRotate(page, c, 0);
            if (c.isFlippedHorizontal) api.shapeModifyHFlip(page, c, !c.isFlippedHorizontal);
            if (c.isFlippedVertical) api.shapeModifyVFlip(page, c, !c.isFlippedVertical);

            api.shapeModifyX(page, c, boundingBox.x);
            api.shapeModifyY(page, c, boundingBox.y);
            api.shapeModifyWH(page, c, boundingBox.width, boundingBox.height);

            const matrix2 = c.matrix2Parent();
            matrix2.preScale(boundingBox.width, boundingBox.height); // 当对象太小时，求逆矩阵会infinity
            matrix.multiAtLeft(matrix2.inverse);
            const points = c.points;
            for (let i = 0, len = points.length; i < len; i++) {
                const p = points[i];
                if (p.hasFrom) {
                    const curveFrom = matrix.computeCoord(p.fromX || 0, p.fromY || 0);
                    api.shapeModifyCurvFromPoint(page, c, i, curveFrom);
                }
                if (p.hasTo) {
                    const curveTo = matrix.computeCoord(p.toX || 0, p.toY || 0);
                    api.shapeModifyCurvToPoint(page, c, i, curveTo);
                }
                const point = matrix.computeCoord(p.x, p.y);
                api.shapeModifyCurvPoint(page, c, i, point);
            }

            const width = boundingBox.width * scaleX;
            const height = boundingBox.height * scaleY;
            setFrame(page, c, boundingBox.x * scaleX, boundingBox.y * scaleY, width, height, api);
        }
        else { // textshape imageshape symbolrefshape
            // // 需要调整位置跟大小
            const cFrame = c.frame;
            const matrix = c.matrix2Parent();
            const current = [{ x: 0, y: 0 }, { x: cFrame.width, y: cFrame.height }]
                .map((p) => matrix.computeCoord(p));

            const target = current.map((p) => {
                return { x: p.x * scaleX, y: p.y * scaleY }
            })
            const matrixarr = matrix.toArray();
            matrixarr[4] = target[0].x;
            matrixarr[5] = target[0].y;
            const m2 = new Matrix(matrixarr);
            const m2inverse = new Matrix(m2.inverse)

            const invertTarget = target.map((p) => m2inverse.computeCoord(p))

            const wh = { x: invertTarget[1].x - invertTarget[0].x, y: invertTarget[1].y - invertTarget[0].y }

            // 计算新的matrix 2 parent
            const matrix2 = new Matrix();
            {
                const cx = wh.x / 2;
                const cy = wh.y / 2;
                matrix2.trans(-cx, -cy);
                if (c.rotation) matrix2.rotate(c.rotation / 180 * Math.PI);
                if (c.isFlippedHorizontal) matrix2.flipHoriz();
                if (c.isFlippedVertical) matrix2.flipVert();
                matrix2.trans(cx, cy);
                matrix2.trans(cFrame.x, cFrame.y);
            }
            const xy = matrix2.computeCoord(0, 0);

            const dx = target[0].x - xy.x;
            const dy = target[0].y - xy.y;

            setFrame(page, c, cFrame.x + dx, cFrame.y + dy, wh.x, wh.y, api);
        }
    }
}
function fixConstrainFrame(page: Page, shape: Shape, x: number, y: number, w: number, h: number, api: Api, originParentFrame: ShapeFrame, curParentFrame: ShapeFrame, cFrame?: ShapeFrame) {
    cFrame = cFrame ?? shape.frame;
    const resizingConstraint = shape.resizingConstraint;
    if (!resizingConstraint || ResizingConstraints.isUnset(resizingConstraint)) {
        return { x, y, w, h }
    }
    else {
        // 水平
        const isFixedToLeft = ResizingConstraints2.isFixedToLeft(resizingConstraint); // 靠左
        const isFixedToRight = ResizingConstraints2.isFixedToRight(resizingConstraint); // 靠右
        const isFixedToLeftAndRight = ResizingConstraints2.isFixedLeftAndRight(resizingConstraint); // 左右
        const isHorCenter = ResizingConstraints2.isHorizontalJustifyCenter(resizingConstraint); // 水平居中
        const isFlexWidth = ResizingConstraints2.isFlexWidth(resizingConstraint); // 水平缩放
        // 计算width, x
        // 宽度与同时设置左右是互斥关系，万一数据出错，以哪个优先？先以左右吧
        let cw = w;
        let cx = x;
        if (isFixedToLeftAndRight) {
            cx = cFrame.x;
            const dis = originParentFrame.width - (cFrame.x + cFrame.width);
            cw = Math.max(curParentFrame.width - dis - cx, 1);
        }
        else if (isFixedToLeft) {
            cx = cFrame.x;
        }
        else if (isFixedToRight) {
            const orx = originParentFrame.width - cFrame.x;
            cx = curParentFrame.width - orx;
        }
        else if (isHorCenter) {
            const ocx = originParentFrame.width / 2 - cFrame.x
            cx = curParentFrame.width / 2 - ocx;
        }
        else if (isFlexWidth) {
            // do not need fix，do nothing
        }

        // 垂直
        const isFixedToTop = ResizingConstraints2.isFixedToTop(resizingConstraint);
        const isFixedToBottom = ResizingConstraints2.isFixedToBottom(resizingConstraint);
        const isFixedToTopAndBottom = ResizingConstraints2.isFixedTopAndBottom(resizingConstraint);
        const isVerCenter = ResizingConstraints2.isVerticalJustifyCenter(resizingConstraint);
        const isFlexHeight = ResizingConstraints2.isFlexHeight(resizingConstraint);

        // 计算height, y
        let ch = h;
        let cy = y;
        if (isFixedToTopAndBottom) {
            cy = cFrame.y;
            const dis = originParentFrame.height - (cFrame.y + cFrame.height);
            ch = Math.max(curParentFrame.height - dis - cy, 1);
        }
        else if (isFixedToTop) {
            cy = cFrame.y;
        }
        else if (isFixedToBottom) {
            const oby = originParentFrame.height - cFrame.y;
            cy = curParentFrame.height - oby;
        } else if (isVerCenter) {
            const ocy = originParentFrame.height / 2 - cFrame.y
            cy = curParentFrame.height / 2 - ocy;
        } else if (isFlexWidth) {
            // do not need fix，do nothing
        }

        return { x: cx, y: cy, w: cw, h: ch };
    }
}

function setFrame(page: Page, shape: Shape, x: number, y: number, w: number, h: number, api: Api): boolean {
    const frame = shape.frame;
    let changed = false;
    if (x !== frame.x) {
        api.shapeModifyX(page, shape, x)
        changed = true;
    }
    if (y !== frame.y) {
        api.shapeModifyY(page, shape, y)
        changed = true;
    }
    if (w !== frame.width || h !== frame.height) {
        if (shape instanceof TextShape) {
            const textBehaviour = shape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;
            if (h !== frame.height) {
                if (textBehaviour !== TextBehaviour.FixWidthAndHeight) {
                    api.shapeModifyTextBehaviour(page, shape.text, TextBehaviour.FixWidthAndHeight);
                }
            }
            else {
                if (textBehaviour === TextBehaviour.Flexible) {
                    api.shapeModifyTextBehaviour(page, shape.text, TextBehaviour.Fixed);
                }
            }
            api.shapeModifyWH(page, shape, w, h)
            fixTextShapeFrameByLayout(api, page, shape);
        }
        else if (shape instanceof GroupShape) {
            const saveW = frame.width;
            const saveH = frame.height;
            api.shapeModifyWH(page, shape, w, h)
            const scaleX = frame.width / saveW;
            const scaleY = frame.height / saveH;

            // 这个scaleX, scaleY 不对
            afterModifyGroupShapeWH(api, page, shape, scaleX, scaleY, new ShapeFrame(frame.x, frame.y, saveW, saveH));
        }
        else {
            api.shapeModifyWH(page, shape, w, h)
        }
        changed = true;
    }
    return changed;
}

export function translateTo(api: Api, page: Page, shape: Shape, x: number, y: number) {
    const p = shape.parent;
    if (!p) return;
    const m1 = p.matrix2Root();
    const m0 = shape.matrix2Parent();
    const target = m1.inverseCoord(x, y);
    const cur = m0.computeCoord(0, 0);
    const dx = target.x - cur.x;
    const dy = target.y - cur.y;
    const frame = shape.frame;
    const changed = setFrame(page, shape, frame.x + dx, frame.y + dy, frame.width, frame.height, api);
    // if (changed) updateFrame(shape);
}

export function translate(api: Api, page: Page, shape: Shape, dx: number, dy: number, round: boolean = true) {
    const xy = shape.frame2Root();
    let x = xy.x + dx;
    let y = xy.y + dy;
    if (round) {
        x = Math.round(x);
        y = Math.round(y);
    }
    translateTo(api, page, shape, xy.x + dx, xy.y + dy);
}
export function expandTo(api: Api, page: Page, shape: Shape, w: number, h: number) {
    const frame = shape.frame;
    if (w < minimum_WH) w = minimum_WH;
    if (h < minimum_WH) h = minimum_WH;
    let changed = false;
    if (shape.isNoTransform()) {
        changed = setFrame(page, shape, frame.x, frame.y, w, h, api);
    } else {
        // 修改frame后的matrix，用来判断修改后(0,0)点的偏移位置
        const cx1 = w / 2;
        const cy1 = h / 2;
        const m1 = new Matrix();
        m1.trans(-cx1, -cy1);
        if (shape.rotation) m1.rotate(shape.rotation / 180 * Math.PI);
        if (shape.isFlippedHorizontal) m1.flipHoriz();
        if (shape.isFlippedVertical) m1.flipVert();
        m1.trans(cx1, cy1);
        m1.trans(frame.x, frame.y);

        const m = shape.matrix2Parent();

        const xy = m.computeCoord(0, 0);
        const xy1 = m1.computeCoord(0, 0);

        const dx = xy.x - xy1.x;
        const dy = xy.y - xy1.y;
        changed = setFrame(page, shape, frame.x + dx, frame.y + dy, w, h, api);
    }

    // if (changed) updateFrame(shape);
}

export function expand(api: Api, page: Page, shape: Shape, dw: number, dh: number, round: boolean = true) {
    const frame = shape.frame;
    let w = frame.width + dw;
    let h = frame.height + dh;
    if (round) {
        w = Math.round(w);
        h = Math.round(h);
    }
    expandTo(api, page, shape, frame.width + dw, frame.height + dh);
}

export function adjustLT2(api: Api, page: Page, shape: Shape, x: number, y: number) {
    const p = shape.parent;
    if (!p) return;
    const frame = shape.frame;
    const matrix_parent2page = p.matrix2Root();
    const matrix2parent = shape.matrix2Parent();
    const target = matrix_parent2page.inverseCoord(x, y);
    const cur = matrix2parent.computeCoord(0, 0);

    // 需要满足右下不动,左上移动到xy

    // (0,0)需要偏移到target位置
    let dx = target.x - cur.x;
    let dy = target.y - cur.y;
    // 没有变换时, w,h可以简单算出
    let w = frame.width - dx;
    let h = frame.height - dy;

    // 计算最终转换矩阵，用来计算实际要修改的w,h
    // 因矩阵(M2)如
    // [a00 a01 tx]
    // [a10 a11 ty]
    // [ 0   0   1]
    // 其中a00, a01, a10, a11不受偏移影响，仅由旋转、缩放、翻转决定
    // 所以可以判断与matrix2parent是一致的
    // 所以仅需要计算tx,ty
    // 同时因要满足 M2 * (0, 0) = target,得出 tx = target.x, ty = target.y
    // 故调整后的最终矩阵得出
    const saverb = matrix2parent.computeCoord(frame.width, frame.height);
    const matrixarr = matrix2parent.toArray();
    matrixarr[4] = target.x;
    matrixarr[5] = target.y;
    const m2 = new Matrix(matrixarr);

    const wh = m2.inverseCoord(saverb.x, saverb.y);
    w = wh.x;
    h = wh.y;

    if (w < 0) {
        api.shapeModifyHFlip(page, shape, !shape.isFlippedHorizontal)
        if (shape.rotation) {
            api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        w = -w;
    }
    if (h < 0) {
        api.shapeModifyVFlip(page, shape, !shape.isFlippedVertical)
        if (shape.rotation) {
            api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        h = -h;
    }
    if (w < minimum_WH) w = minimum_WH;
    if (h < minimum_WH) h = minimum_WH;
    // 修改frame后的matrix，用来判断修改后(0,0)点的偏移位置
    const cx1 = w / 2;
    const cy1 = h / 2;
    const m1 = new Matrix();
    m1.trans(-cx1, -cy1);
    if (shape.rotation) m1.rotate(shape.rotation / 180 * Math.PI);
    if (shape.isFlippedHorizontal) m1.flipHoriz();
    if (shape.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(frame.x, frame.y);
    const xy1 = m1.computeCoord(0, 0);

    // (0,0)需要偏移到target位置
    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, shape, frame.x + dx, frame.y + dy, w, h, api);
}
export function adjustLB2(api: Api, page: Page, shape: Shape, x: number, y: number) { // 左下角    
    const p = shape.parent;
    if (!p) return;
    // 需要满足右上(rt)不动
    // 左下移动到xy
    const frame = shape.frame;
    const matrix_parent2page = p.matrix2Root();
    const matrix2parent = shape.matrix2Parent();
    const target = matrix_parent2page.inverseCoord(x, y); // 左下目标位置
    const cur = matrix2parent.computeCoord(0, frame.height); // 左下当前位置

    let dx = target.x - cur.x;
    let dy = 0;
    const xy2 = matrix2parent.inverseCoord(target.x, target.y);
    let w = frame.width - xy2.x;
    let h = xy2.y;
    const savert = matrix2parent.computeCoord(frame.width, 0) // rt 计算右上角的位置（坐标系：Parent）
    const m = matrix2parent;
    h = (m.m00 * (savert.y - target.y) - m.m10 * (savert.x - target.x)) / (m.m10 * m.m01 - m.m00 * m.m11);
    // w = (savert.x - target.x + m.m01 * h) / m.m00;
    if (w < 0) {
        api.shapeModifyHFlip(page, shape, !shape.isFlippedHorizontal)
        if (shape.rotation) {
            api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        w = -w;
    }
    if (h < 0) {
        api.shapeModifyVFlip(page, shape, !shape.isFlippedVertical)
        if (shape.rotation) {
            api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        h = -h;
    }
    if (w < minimum_WH) w = minimum_WH;
    if (h < minimum_WH) h = minimum_WH;

    // 修改frame后的matrix，用来判断修改后(0,0)点的偏移位置
    const cx1 = w / 2;
    const cy1 = h / 2;
    const m1 = new Matrix();
    m1.trans(-cx1, -cy1);
    if (shape.rotation) m1.rotate(shape.rotation / 180 * Math.PI);
    if (shape.isFlippedHorizontal) m1.flipHoriz();
    if (shape.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(frame.x, frame.y);
    const xy1 = m1.computeCoord(0, h);

    // (0,0)需要偏移到target位置
    dx = target.x - xy1.x;
    dy = target.y - xy1.y;
    setFrame(page, shape, frame.x + dx, frame.y + dy, w, h, api);
}
export function adjustRT2(api: Api, page: Page, shape: Shape, x: number, y: number) { // 右上角
    const p = shape.parent;
    if (!p) return;
    // 需要满足左下(lb)不动
    // 右上移动到xy
    const frame = shape.frame;
    const matrix_parent2page = p.matrix2Root();
    const matrix2parent = shape.matrix2Parent();
    const target = matrix_parent2page.inverseCoord(x, y); // 右上目标位置（坐标系：页面）
    const cur = matrix2parent.computeCoord(frame.width, 0); // 右上当前位置（坐标系：页面）
    let dx = target.x - cur.x;
    let dy = target.y - cur.y;
    const xy2 = matrix2parent.inverseCoord(target.x, target.y);
    let w = xy2.x;
    let h = frame.height - xy2.y;
    const savelb = matrix2parent.computeCoord(0, frame.height) // lb
    const m = matrix2parent;
    h = (m.m00 * (savelb.y - target.y) - m.m10 * (savelb.x - target.x)) / (m.m00 * m.m11 - m.m10 * m.m01)
    // w = (target.x - savelb.x + m.m01 * h) / m.m00;

    if (w < 0) {
        api.shapeModifyHFlip(page, shape, !shape.isFlippedHorizontal)
        if (shape.rotation) {
            api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        w = -w;
    }
    if (h < 0) {
        api.shapeModifyVFlip(page, shape, !shape.isFlippedVertical)
        if (shape.rotation) {
            api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        h = -h;
    }
    if (w < minimum_WH) w = minimum_WH;
    if (h < minimum_WH) h = minimum_WH;

    // 修改frame后的matrix，用来判断修改后(0,0)点的偏移位置
    const cx1 = w / 2;
    const cy1 = h / 2;
    const m1 = new Matrix();
    m1.trans(-cx1, -cy1);
    if (shape.rotation) m1.rotate(shape.rotation / 180 * Math.PI);
    if (shape.isFlippedHorizontal) m1.flipHoriz();
    if (shape.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(frame.x, frame.y);
    const xy1 = m1.computeCoord(w, 0);

    // (0,0)需要偏移到target位置
    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, shape, frame.x + dx, frame.y + dy, w, h, api);
}
export function adjustRB2(api: Api, page: Page, shape: Shape, x: number, y: number) {
    const p = shape.parent;
    if (!p) return;
    // 需要满足左下(lt)不动
    // 右上移动到xy
    const frame = shape.frame;
    const matrix_parent2page = p.matrix2Root();
    const matrix2parent = shape.matrix2Parent();
    const target = matrix_parent2page.inverseCoord(x, y); // 右下目标位置
    let dx = 0;
    let dy = 0;
    const xy2 = matrix2parent.inverseCoord(target.x, target.y);
    // let w = frame.width - xy2.x;
    let w = xy2.x;
    let h = frame.height - xy2.y;
    const savelt = matrix2parent.computeCoord(0, 0) // lt
    const m = matrix2parent;
    h = -(m.m00 * (savelt.y - target.y) - m.m10 * (savelt.x - target.x)) / (m.m00 * m.m11 - m.m10 * m.m01);
    // w = (target.x - savelt.x + m.m01 * -h) / m.m00;
    if (w < 0) {
        api.shapeModifyHFlip(page, shape, !shape.isFlippedHorizontal);
        if (shape.rotation) {
            api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        w = -w;
    }
    if (h < 0) {
        api.shapeModifyVFlip(page, shape, !shape.isFlippedVertical);
        if (shape.rotation) {
            api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        h = -h;
    }
    if (w < minimum_WH) w = minimum_WH;
    if (h < minimum_WH) h = minimum_WH;
    // 修改frame后的matrix，用来判断修改后(0,0)点的偏移位置
    const cx1 = w / 2;
    const cy1 = h / 2;
    const m1 = new Matrix();
    m1.trans(-cx1, -cy1);
    if (shape.rotation) m1.rotate(shape.rotation / 180 * Math.PI);
    if (shape.isFlippedHorizontal) m1.flipHoriz();
    if (shape.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(frame.x, frame.y);
    const xy1 = m1.computeCoord(w, h);

    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, shape, frame.x + dx, frame.y + dy, w, h, api);
}
/**
 * @description 自由缩放
 */
export function scaleByT(api: Api, page: Page, s: Shape, p: PageXY) {
    const parent = s.parent;
    if (!parent) {
        return;
    }

    const f = s.frame;

    const t = s
        .matrix2Root()
        .inverseCoord(p.x, p.y);

    const m2p = s.matrix2Parent();

    const cur = m2p.computeCoord2(0, 0);
    const target = m2p.computeCoord2(0, t.y);

    let dx = target.x - cur.x;
    let dy = target.y - cur.y;

    let w = f.width;
    let h = f.height - dy;

    const saverb = m2p.computeCoord2(f.width, f.height);

    const matrixarr = m2p.toArray();

    matrixarr[4] = target.x;
    matrixarr[5] = target.y;

    const m2 = new Matrix(matrixarr);

    const wh = m2.inverseCoord(saverb.x, saverb.y);

    h = wh.y;

    if (h < 0) {
        api.shapeModifyVFlip(page, s, !s.isFlippedVertical)
        if (s.rotation) {
            api.shapeModifyRotate(page, s, 360 - s.rotation);
        }
        h = -h;
    }

    if (w < minimum_WH) w = minimum_WH;
    if (h < minimum_WH) h = minimum_WH;

    const cx1 = w / 2;
    const cy1 = h / 2;

    const m1 = new Matrix();

    m1.trans(-cx1, -cy1);
    if (s.rotation) m1.rotate(s.rotation / 180 * Math.PI);
    if (s.isFlippedHorizontal) m1.flipHoriz();
    if (s.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(f.x, f.y);

    const xy1 = m1.computeCoord2(0, 0);

    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, s, f.x + dx, f.y + dy, w, h, api);
}
export function scaleByR(api: Api, page: Page, s: Shape, p: PageXY) {
    const parent = s.parent;
    if (!parent) {
        return;
    }

    const f = s.frame;

    const t = s
        .matrix2Root()
        .inverseCoord(p.x, p.y);

    const m2p = s.matrix2Parent();

    const cur = m2p.computeCoord2(f.width, 0);
    const target = m2p.computeCoord2(t.x, 0);

    let dx = 0;
    let dy = target.y - cur.y;

    const xy2 = m2p.inverseCoord(target.x, target.y);

    let w = xy2.x;
    let h = f.height;

    if (w < 0) {
        api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal)
        if (s.rotation) {
            api.shapeModifyRotate(page, s, 360 - s.rotation);
        }
        w = -w;
    }

    if (w < minimum_WH) w = minimum_WH;
    if (h < minimum_WH) h = minimum_WH;

    const cx1 = w / 2;
    const cy1 = h / 2;

    const m1 = new Matrix();

    m1.trans(-cx1, -cy1);
    if (s.rotation) m1.rotate(s.rotation / 180 * Math.PI);
    if (s.isFlippedHorizontal) m1.flipHoriz();
    if (s.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(f.x, f.y);

    const xy1 = m1.computeCoord2(w, 0);

    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, s, f.x + dx, f.y + dy, w, h, api);
}
export function scaleByB(api: Api, page: Page, s: Shape, p: PageXY) {
    const parent = s.parent;
    if (!parent) {
        return;
    }
    const f = s.frame;

    const t = s
        .matrix2Root()
        .inverseCoord(p.x, p.y);

    const m2p = s.matrix2Parent();
    const target = m2p.computeCoord2(f.width, t.y);

    let dx = 0;
    let dy = 0;

    const xy2 = m2p.inverseCoord(target.x, target.y);

    let w = f.width;
    let h = f.height - xy2.y;

    const savelt = m2p.computeCoord2(0, 0);

    const m = m2p;

    h = -(m.m00 * (savelt.y - target.y) - m.m10 * (savelt.x - target.x)) / (m.m00 * m.m11 - m.m10 * m.m01);

    if (h < 0) {
        api.shapeModifyVFlip(page, s, !s.isFlippedVertical);
        if (s.rotation) {
            api.shapeModifyRotate(page, s, 360 - s.rotation);
        }
        h = -h;
    }

    if (w < minimum_WH) w = minimum_WH;
    if (h < minimum_WH) h = minimum_WH;

    const cx1 = w / 2;
    const cy1 = h / 2;

    const m1 = new Matrix();

    m1.trans(-cx1, -cy1);
    if (s.rotation) m1.rotate(s.rotation / 180 * Math.PI);
    if (s.isFlippedHorizontal) m1.flipHoriz();
    if (s.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(f.x, f.y);

    const xy1 = m1.computeCoord2(w, h);

    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, s, f.x + dx, f.y + dy, w, h, api);
}
export function scaleByL(api: Api, page: Page, s: Shape, p: PageXY) {
    const parent = s.parent;
    if (!parent) {
        return;
    }

    const f = s.frame;
    const t = s
        .matrix2Root()
        .inverseCoord(p.x, p.y);

    const m2p = s.matrix2Parent();

    const cur = m2p.computeCoord2(0, f.height);
    const target = m2p.computeCoord2(t.x, f.height);

    let dx = target.x - cur.x;
    let dy = 0;

    const xy2 = m2p.inverseCoord(target.x, target.y);

    let w = f.width - xy2.x;
    let h = f.height;

    if (w < 0) {
        api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal)
        if (s.rotation) {
            api.shapeModifyRotate(page, s, 360 - s.rotation);
        }
        w = -w;
    }

    if (w < minimum_WH) w = minimum_WH;
    if (h < minimum_WH) h = minimum_WH;

    const cx1 = w / 2;
    const cy1 = h / 2;

    const m1 = new Matrix();

    m1.trans(-cx1, -cy1);
    if (s.rotation) m1.rotate(s.rotation / 180 * Math.PI);
    if (s.isFlippedHorizontal) m1.flipHoriz();
    if (s.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(f.x, f.y);

    const xy1 = m1.computeCoord2(0, h);

    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, s, f.x + dx, f.y + dy, w, h, api);
}
/**
 * @description 等比缩放
 * @param { number } scale 缩放比例
 */
// 拖拽顶部
export function erScaleByT(api: Api, page: Page, s: Shape, scale: number) {
    const p = s.parent;
    if (!p) return;
    const f = s.frame;
    const saveW = f.width;
    const saveH = f.height;
    if (scale < 0) {
        api.shapeModifyVFlip(page, s, !s.isFlippedVertical);
        if (s.rotation) api.shapeModifyRotate(page, s, 360 - s.rotation);
        scale = -scale;
    }
    const m2p = s.matrix2Parent();
    const t_xy = m2p.computeCoord({ x: f.width * (1 - scale) / 2, y: (1 - scale) * f.height });
    let t_w = f.width * scale;
    let t_h = f.height * scale;
    if (t_w < minimum_WH) t_w = minimum_WH;
    if (t_h < minimum_WH) t_h = minimum_WH;
    api.shapeModifyWH(page, s, t_w, t_h);
    // 当一个图形宽高改变之后，矩阵转换过程中的旋转矩阵计算(图形中心偏移数值)将受影响，应该重新计算转换矩阵
    const o_xy = s.matrix2Parent().computeCoord(0, 0);
    const delta = { x: t_xy.x - o_xy.x, y: t_xy.y - o_xy.y };
    api.shapeModifyX(page, s, f.x + delta.x);
    api.shapeModifyY(page, s, f.y + delta.y);
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale, new ShapeFrame(f.x, f.y, saveW, saveH));
}
// 拖拽右边
export function erScaleByR(api: Api, page: Page, s: Shape, scale: number) {
    const p = s.parent;
    if (!p) return;
    const f = s.frame;
    const saveW = f.width;
    const saveH = f.height;
    if (scale < 0) {
        api.shapeModifyHFlip(page, s, !s.isFlippedVertical);
        if (s.rotation) api.shapeModifyRotate(page, s, 360 - s.rotation);
        scale = -scale;
    }
    const m2p = s.matrix2Parent();
    const t_xy = m2p.computeCoord({ x: 0, y: ((1 - scale) * f.height) / 2 });
    let t_w = f.width * scale;
    let t_h = f.height * scale;
    if (t_w < minimum_WH) t_w = minimum_WH;
    if (t_h < minimum_WH) t_h = minimum_WH;
    api.shapeModifyWH(page, s, t_w, t_h);
    const o_xy = s.matrix2Parent().computeCoord(0, 0);
    const delta = { x: t_xy.x - o_xy.x, y: t_xy.y - o_xy.y };
    api.shapeModifyX(page, s, f.x + delta.x);
    api.shapeModifyY(page, s, f.y + delta.y);
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale, new ShapeFrame(f.x, f.y, saveW, saveH));
}
// 拖拽底部
export function erScaleByB(api: Api, page: Page, s: Shape, scale: number) {
    const p = s.parent;
    if (!p) return;
    const f = s.frame;
    const saveW = f.width;
    const saveH = f.height;
    if (scale < 0) {
        api.shapeModifyVFlip(page, s, !s.isFlippedVertical);
        if (s.rotation) api.shapeModifyRotate(page, s, 360 - s.rotation);
        scale = -scale;
    }
    const m2p = s.matrix2Parent();
    const t_xy = m2p.computeCoord({ x: f.width * (1 - scale) / 2, y: 0 });
    let t_w = f.width * scale;
    let t_h = f.height * scale;
    if (t_w < minimum_WH) t_w = minimum_WH;
    if (t_h < minimum_WH) t_h = minimum_WH;
    api.shapeModifyWH(page, s, t_w, t_h);
    const o_xy = s.matrix2Parent().computeCoord(0, 0);
    const delta = { x: t_xy.x - o_xy.x, y: t_xy.y - o_xy.y };
    api.shapeModifyX(page, s, f.x + delta.x);
    api.shapeModifyY(page, s, f.y + delta.y);
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale, new ShapeFrame(f.x, f.y, saveW, saveH));
}
// 拖拽左边
export function erScaleByL(api: Api, page: Page, s: Shape, scale: number) {
    const p = s.parent;
    if (!p) return;
    const f = s.frame;
    const saveW = f.width;
    const saveH = f.height;
    if (scale < 0) {
        api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal);
        if (s.rotation) api.shapeModifyRotate(page, s, 360 - s.rotation);
        scale = -scale;
    }
    const m2p = s.matrix2Parent();
    const t_xy = m2p.computeCoord({ x: f.width * (1 - scale), y: ((1 - scale) * f.height) / 2 });
    let t_w = f.width * scale;
    let t_h = f.height * scale;
    if (t_w < minimum_WH) t_w = minimum_WH;
    if (t_h < minimum_WH) t_h = minimum_WH;
    api.shapeModifyWH(page, s, t_w, t_h);
    const o_xy = s.matrix2Parent().computeCoord(0, 0);
    const delta = { x: t_xy.x - o_xy.x, y: t_xy.y - o_xy.y };
    api.shapeModifyX(page, s, f.x + delta.x);
    api.shapeModifyY(page, s, f.y + delta.y);
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale, new ShapeFrame(f.x, f.y, saveW, saveH));
}