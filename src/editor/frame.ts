import { Page } from "data/page";
import { Matrix } from "../basic/matrix";
import { GroupShape, PathShape, Shape, TextShape } from "../data/shape";
import { Text } from "../data/text"
import { Point2D, ShapeType, TextBehaviour } from "../data/typesdefine";
import { fixTextShapeFrameByLayout } from "./utils";
import { TableShape } from "../data/table";

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
    shapeModifyTextBehaviour(page: Page, shape: TextShapeLike, textBehaviour: TextBehaviour): void;
    shapeModifyCurvPoint(page: Page, shape: PathShape, index: number, point: Point2D): void;
    shapeModifyCurvFromPoint(page: Page, shape: PathShape, index: number, point: Point2D): void;
    shapeModifyCurvToPoint(page: Page, shape: PathShape, index: number, point: Point2D): void;
    tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number): void;
}

const minimum_WH = 0.01; // 用户可设置最小宽高值。以防止宽高在缩放后为0

export function afterModifyGroupShapeWH(api: Api, page: Page, shape: GroupShape, scaleX: number, scaleY: number) {
    if (shape.type === ShapeType.Artboard) return; // 容器不需要调整子对象
    const childs = shape.childs;
    for (let i = 0, len = childs.length; i < len; i++) {
        const c = childs[i];
        if (!c.rotation) {
            const cFrame = c.frame;
            const cX = cFrame.x * scaleX;
            const cY = cFrame.y * scaleY;
            const cW = cFrame.width * scaleX;
            const cH = cFrame.height * scaleY;
            setFrame(page, c, cX, cY, cW, cH, api);
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
            const width = boundingBox.width * scaleX;
            const height = boundingBox.height * scaleY;
            api.shapeModifyWH(page, c, width, height);
            afterModifyGroupShapeWH(api, page, c, scaleX, scaleY);
        }
        else if (c instanceof PathShape) {
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
                if (p.hasCurveFrom) {
                    const curveFrom = matrix.computeCoord(p.curveFrom);
                    api.shapeModifyCurvFromPoint(page, c, i, curveFrom);
                }
                if (p.hasCurveTo) {
                    const curveTo = matrix.computeCoord(p.curveTo);
                    api.shapeModifyCurvToPoint(page, c, i, curveTo);
                }
                const point = matrix.computeCoord(p.point);
                api.shapeModifyCurvPoint(page, c, i, point);
            }

            // scale
            api.shapeModifyX(page, c, boundingBox.x * scaleX);
            api.shapeModifyY(page, c, boundingBox.y * scaleY);
            const width = boundingBox.width * scaleX;
            const height = boundingBox.height * scaleY;
            api.shapeModifyWH(page, c, width, height);
        }
        else { // textshape imageshape symbolrefshape
            // 需要调整位置跟大小
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
                    api.shapeModifyTextBehaviour(page, shape, TextBehaviour.FixWidthAndHeight);
                }
            }
            else {
                if (textBehaviour === TextBehaviour.Flexible) {
                    api.shapeModifyTextBehaviour(page, shape, TextBehaviour.Fixed);
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

            afterModifyGroupShapeWH(api, page, shape, scaleX, scaleY);
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
    w = (savert.x - target.x + m.m01 * h) / m.m00;
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
    let dx = 0;
    let dy = target.y - cur.y;
    const xy2 = matrix2parent.inverseCoord(target.x, target.y);
    let w = xy2.x;
    let h = frame.height - xy2.y;
    const savelb = matrix2parent.computeCoord(0, frame.height) // lb
    const m = matrix2parent;
    h = (m.m00 * (savelb.y - target.y) - m.m10 * (savelb.x - target.x)) / (m.m00 * m.m11 - m.m10 * m.m01)
    w = (target.x - savelb.x + m.m01 * h) / m.m00;
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
    let w = frame.width - xy2.x;
    let h = frame.height - xy2.y;
    const savelt = matrix2parent.computeCoord(0, 0) // lt
    const m = matrix2parent;
    h = -(m.m00 * (savelt.y - target.y) - m.m10 * (savelt.x - target.x)) / (m.m00 * m.m11 - m.m10 * m.m01);
    w = (target.x - savelt.x + m.m01 * -h) / m.m00;
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
    if (!parent) return;
    const f = s.frame;
    const t = s.matrix2Root().inverseCoord(p.x, p.y);
    const m2p = s.matrix2Parent();
    const cur = m2p.computeCoord2(0, 0);
    const target = m2p.computeCoord2(0, t.y);
    let dx = target.x - cur.x;
    let dy = target.y - cur.y;
    // 没有变换时, w,h可以简单算出
    let w = f.width - dx;
    let h = f.height - dy;
    const saverb = m2p.computeCoord2(f.width, f.height);
    const matrixarr = m2p.toArray();
    matrixarr[4] = target.x;
    matrixarr[5] = target.y;
    const m2 = new Matrix(matrixarr);
    const wh = m2.inverseCoord(saverb.x, saverb.y);
    w = wh.x;
    h = wh.y;
    if (w < 0) {
        api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal)
        if (s.rotation) {
            api.shapeModifyRotate(page, s, 360 - s.rotation);
        }
        w = -w;
    }
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
    if (!parent) return;
    const f = s.frame;
    const t = s.matrix2Root().inverseCoord(p.x, p.y);
    const m2p = s.matrix2Parent();
    const cur = m2p.computeCoord2(f.width, 0);
    const target = m2p.computeCoord2(t.x, 0);

    let dx = 0;
    let dy = target.y - cur.y;
    const xy2 = m2p.inverseCoord(target.x, target.y);
    let w = xy2.x;
    let h = f.height - xy2.y;
    const savelb = m2p.computeCoord2(0, f.height)
    const m = m2p;
    h = (m.m00 * (savelb.y - target.y) - m.m10 * (savelb.x - target.x)) / (m.m00 * m.m11 - m.m10 * m.m01)
    w = (target.x - savelb.x + m.m01 * h) / m.m00;
    if (w < 0) {
        api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal)
        if (s.rotation) {
            api.shapeModifyRotate(page, s, 360 - s.rotation);
        }
        w = -w;
    }
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
    const xy1 = m1.computeCoord2(w, 0);
    dx = target.x - xy1.x;
    dy = target.y - xy1.y;
    setFrame(page, s, f.x + dx, f.y + dy, w, h, api);
}
export function scaleByB(api: Api, page: Page, s: Shape, p: PageXY) {
    const parent = s.parent;
    if (!parent) return;
    const f = s.frame;
    const t = s.matrix2Root().inverseCoord(p.x, p.y);
    const m2p = s.matrix2Parent();
    const target = m2p.computeCoord2(f.width, t.y);
    let dx = 0;
    let dy = 0;
    const xy2 = m2p.inverseCoord(target.x, target.y);
    let w = f.width - xy2.x;
    let h = f.height - xy2.y;
    const savelt = m2p.computeCoord2(0, 0);
    const m = m2p;
    h = -(m.m00 * (savelt.y - target.y) - m.m10 * (savelt.x - target.x)) / (m.m00 * m.m11 - m.m10 * m.m01);
    w = (target.x - savelt.x + m.m01 * -h) / m.m00;
    if (w < 0) {
        api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal);
        if (s.rotation) {
            api.shapeModifyRotate(page, s, 360 - s.rotation);
        }
        w = -w;
    }
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
    if (!parent) return;
    const f = s.frame;
    const t = s.matrix2Root().inverseCoord(p.x, p.y);
    const m2p = s.matrix2Parent();
    const cur = m2p.computeCoord2(0, f.height);
    const target = m2p.computeCoord2(t.x, f.height);
    let dx = target.x - cur.x;
    let dy = 0;
    const xy2 = m2p.inverseCoord(target.x, target.y);
    let w = f.width - xy2.x;
    let h = xy2.y;
    const savert = m2p.computeCoord(f.width, 0);
    const m = m2p;
    h = (m.m00 * (savert.y - target.y) - m.m10 * (savert.x - target.x)) / (m.m10 * m.m01 - m.m00 * m.m11);
    w = (savert.x - target.x + m.m01 * h) / m.m00;
    if (w < 0) {
        api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal)
        if (s.rotation) {
            api.shapeModifyRotate(page, s, 360 - s.rotation);
        }
        w = -w;
    }
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
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale);
}
// 拖拽右边
export function erScaleByR(api: Api, page: Page, s: Shape, scale: number) {
    const p = s.parent;
    if (!p) return;
    const f = s.frame;
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
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale);
}
// 拖拽底部
export function erScaleByB(api: Api, page: Page, s: Shape, scale: number) {
    const p = s.parent;
    if (!p) return;
    const f = s.frame;
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
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale);
}
// 拖拽左边
export function erScaleByL(api: Api, page: Page, s: Shape, scale: number) {
    const p = s.parent;
    if (!p) return;
    const f = s.frame;
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
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale);
}
// 路径编辑
/**
 * @description 路径编辑，当路径中某一点(编辑点)的编辑变化引起frame更新后，路径上的所有点都需要在新的frame重新定位，若没有引起frame更新，则只更新编辑点
 * @param index 点的数组索引
 * @param end 点的目标🎯位置（root）
 */
export function pathEdit(api: Api, page: Page, s: Shape, index: number, end: PageXY) {
    let m = new Matrix(s.matrix2Root()), w = s.frame.width, h = s.frame.height;
    m.preScale(w, h), m = new Matrix(m.inverse);  // 图形单位坐标系，0-1
    const p = s?.points[index];
    if (!p) return false;
    const t = m.computeCoord3(end);
    api.shapeModifyCurvPoint(page, s as PathShape, index, t);
    if (t.x < 0 || t.x > 1 || t.y < 0 || t.y > 1) { // 满足该条件则引起frame更新，所有点在新的frame重新定位
        const nf = get_box_by_points(s);
        if (!nf) return false;
        const mp = s.matrix2Parent();
        mp.preScale(w, h);
        if (s.rotation) api.shapeModifyRotate(page, s, 0); // 摆正 是否需要摆正呢
        if (s.isFlippedHorizontal) api.shapeModifyHFlip(page, s, false);
        if (s.isFlippedVertical) api.shapeModifyVFlip(page, s, false);
        api.shapeModifyX(page, s, nf.x);
        api.shapeModifyY(page, s, nf.y);
        api.shapeModifyWH(page, s, nf.width, nf.height);
        const mp2 = s.matrix2Parent();
        mp2.preScale(nf.width, nf.height);
        mp.multiAtLeft(mp2.inverse);
        const points = s.points;
        if (!points || !points.length) return false;
        for (let i = 0, len = points.length; i < len; i++) {
            const p = points[i];
            if (!p) continue;
            if (p.hasCurveFrom) {
                api.shapeModifyCurvFromPoint(page, s as PathShape, i, mp.computeCoord3(p.curveFrom));
            }
            if (p.hasCurveTo) {
                api.shapeModifyCurvToPoint(page, s as PathShape, i, mp.computeCoord3(p.curveTo));
            }
            api.shapeModifyCurvPoint(page, s as PathShape, i, mp.computeCoord3(p.point));
        }
    }
}
function get_box_by_points(s: Shape) {
    const point_raw = s.points;
    if (!point_raw) return false;
    const w = s.frame.width, h = s.frame.height, m = s.matrix2Parent();
    m.preScale(w, h);
    let x = 0, y = 0, right = 0, bottom = 0, width = w, height = h;
    if (point_raw.length > 1 && point_raw[0].point) {
        const p = m.computeCoord3(point_raw[0].point);
        x = p.x, y = p.y, right = p.x, bottom = p.y;
    } else return false;
    for (let i = 1, len = point_raw.length || 0; i < len; i++) {
        const point = point_raw[i].point;
        if (!point) continue;
        const p = m.computeCoord3(point);

        if (p.x < x) x = p.x, width = right - x;
        else if (p.x > right) right = p.x, width = right - x;

        if (p.y < y) y = p.y, height = bottom - y;
        else if (p.y > bottom) bottom = p.y, height = bottom - y;
    }
    return { x, y, width, height };
}
export function update_frame_by_points(api: Api, page: Page, s: Shape) {
    const nf = get_box_by_points(s);
    if (nf) {
        const w = s.frame.width, h = s.frame.height;
        const mp = s.matrix2Parent();
        mp.preScale(w, h);
        if (s.rotation) api.shapeModifyRotate(page, s, 0);  // 摆正 是否需要摆正呢
        if (s.isFlippedHorizontal) api.shapeModifyHFlip(page, s, false);
        if (s.isFlippedVertical) api.shapeModifyVFlip(page, s, false);
        api.shapeModifyX(page, s, nf.x);
        api.shapeModifyY(page, s, nf.y);
        api.shapeModifyWH(page, s, nf.width, nf.height);
        const mp2 = s.matrix2Parent();
        mp2.preScale(nf.width, nf.height);
        mp.multiAtLeft(mp2.inverse);
        const points = s.points;
        if (!points || !points.length) return false;
        for (let i = 0, len = points.length; i < len; i++) {
            const p = points[i];
            if (!p) continue;
            if (p.hasCurveFrom) {
                api.shapeModifyCurvFromPoint(page, s as PathShape, i, mp.computeCoord3(p.curveFrom));
            }
            if (p.hasCurveTo) {
                api.shapeModifyCurvToPoint(page, s as PathShape, i, mp.computeCoord3(p.curveTo));
            }
            api.shapeModifyCurvPoint(page, s as PathShape, i, mp.computeCoord3(p.point));
        }
    }
}