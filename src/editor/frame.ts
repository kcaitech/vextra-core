import { Page } from "../data/page";
import { Matrix } from "../basic/matrix";
import {
    CurvePoint,
    GroupShape,
    PathShape,
    PathShape2,
    Shape,
    ShapeFrame,
    ShapeType,
    SymbolShape,
    TextShape
} from "../data/shape";
import { TextBehaviour } from "../data/typesdefine";
import { fixTextShapeFrameByLayout } from "./utils/other";
import { FrameType, PathType, ResizingConstraints, ResizingConstraints2 } from "../data/consts";
import { Api } from "./coop/recordapi";
import { Document } from "../data/document";
import { ShapeSize, SymbolUnionShape } from "../data/classes";
import { SymbolRefShape } from "../data/symbolref";
import { makeShapeTransform1By2, makeShapeTransform2By1 } from "../data";

interface PageXY {
    x: number
    y: number
}

export type SizeRecorder = Map<string, { toRight: number, exceededX: boolean, toBottom: number, exceededY: boolean }>;

export const minimum_WH = 0.01; // 用户可设置最小宽高值。以防止宽高在缩放后为0

/**
 * @deprecated 请使用 reLayoutBySizeChanged (/src/editor/asyncApiHandler/transform/scale.ts)
 */
export function afterModifyGroupShapeWH(api: Api, page: Page, shape: GroupShape, scaleX: number, scaleY: number, originFrame: ShapeSize, recorder?: SizeRecorder) {
    // const childs = shape.childs;
    //
    // const noconstrain = shape.type === ShapeType.Group || shape.type === ShapeType.BoolShape; // 有且只有编组的子元素只可为跟随缩放，应忽略constraint
    //
    // for (let i = 0, len = childs.length; i < len; i++) {
    //     const c = childs[i];
    //
    //     let sx = scaleX, sy = scaleY;
    //     const frame = c.frame2Parent();
    //     let ox = frame.x, oy = frame.y;
    //     if (!noconstrain) {
    //         const frame2 = fixConstrainFrame(c, c.resizingConstraint ?? ResizingConstraints2.Default, frame.x, frame.y, frame.width, frame.height, scaleX, scaleY, shape.size, originFrame);
    //         sx = frame2.width / frame.width;
    //         sy = frame2.height / frame.height;
    //         ox = frame2.x;
    //         oy = frame2.y;
    //     } else {
    //         ox *= scaleX;
    //         oy *= scaleY;
    //     }
    //
    //     const ow = c.size.width;
    //     const oh = c.size.height;
    //
    //     api.shapeModifyWH(page, c, c.size.width * sx, c.size.height * sy);
    //     const origin2 = c.transform.computeCoord(0, 0);
    //     const dx = ox - origin2.x;
    //     const dy = oy - origin2.y;
    //     api.shapeModifyX(page, c, c.transform.m02 + dx);
    //     api.shapeModifyY(page, c, c.transform.m12 + dy);
    //
    //     if (c instanceof GroupShape) {
    //         afterModifyGroupShapeWH(api, page, c, sx, sy, new ShapeSize(ow, oh))
    //     }
    // }
}

export function fixConstrainFrame(shape: Shape, resizingConstraint: number, x: number, y: number, width: number, height: number, scaleX: number, scaleY: number, currentEnvFrame: ShapeSize, originEnvFrame: ShapeSize, recorder?: SizeRecorder) {
    // 水平 HORIZONTAL
    if (ResizingConstraints2.isHorizontalScale(resizingConstraint)) { // 跟随缩放。一旦跟随缩放，则不需要考虑其他约束场景了
        x *= scaleX;
        width *= scaleX;
    } else { // 非跟随缩放
        if (ResizingConstraints2.isFlexWidth(resizingConstraint)) { // 宽度自由，x、width值都需要根据约束场景变化
            let _width = scaleX * width;

            if (ResizingConstraints2.isFixedToLeft(resizingConstraint)) { // 靠左固定
                width = _width;
            } else if (ResizingConstraints2.isFixedToRight(resizingConstraint)) { // 靠右固定
                const origin_d_to_right = originEnvFrame.width - width - x;
                x = currentEnvFrame.width - _width - origin_d_to_right;
                width = _width;
            } else if (ResizingConstraints2.isHorizontalJustifyCenter(resizingConstraint)) { // 居中
                const origin_d_to_center = originEnvFrame.width / 2 - x - width / 2;
                x = currentEnvFrame.width / 2 - origin_d_to_center - _width / 2;
                width = _width;
            } else if (ResizingConstraints2.isFixedLeftAndRight(resizingConstraint)) { // 左右固定，通过固定x值来使左边固定，通过修改宽度和水平翻转来使右边固定
                const origin_d_to_right = originEnvFrame.width - width - x;
                width = currentEnvFrame.width - x - origin_d_to_right;

                width = fixWidthByRecorder(shape, width, origin_d_to_right, currentEnvFrame.width, x, recorder);
            }
        } else { // 宽度固定，只需要修改x值，此场景中不存在左右固定，靠左固定不需要修改x的值，所以只需要处理靠右固定和居中场景
            if (ResizingConstraints2.isFixedToRight(resizingConstraint)) { // 靠右固定，通过修改x值来使图层靠右边固定
                x = currentEnvFrame.width - originEnvFrame.width + x;
            } else if (ResizingConstraints2.isHorizontalJustifyCenter(resizingConstraint)) { // 居中
                x = currentEnvFrame.width / 2 - originEnvFrame.width / 2 + x;
            }
        }
    }
    // 垂直 VERTICAL
    if (ResizingConstraints2.isVerticalScale(resizingConstraint)) {
        y *= scaleY;
        height *= scaleY;
    } else {
        if (ResizingConstraints2.isFlexHeight(resizingConstraint)) {
            let _height = scaleY * height;

            if (ResizingConstraints2.isFixedToTop(resizingConstraint)) {
                height = _height;
            } else if (ResizingConstraints2.isFixedToBottom(resizingConstraint)) {
                const origin_d_to_bottom = originEnvFrame.height - height - y;
                y = currentEnvFrame.height - _height - origin_d_to_bottom;
                height = _height;
            } else if (ResizingConstraints2.isVerticalJustifyCenter(resizingConstraint)) {
                const origin_d_to_center = originEnvFrame.height / 2 - y - height / 2;
                y = currentEnvFrame.height / 2 - origin_d_to_center - _height / 2;
                height = _height;
            } else if (ResizingConstraints2.isFixedTopAndBottom(resizingConstraint)) {
                const origin_d_to_bottom = originEnvFrame.height - height - y;
                height = currentEnvFrame.height - y - origin_d_to_bottom;
                height = fixHeightByRecorder(shape, height, origin_d_to_bottom, currentEnvFrame.height, y, recorder);
            }
        } else {
            if (ResizingConstraints2.isFixedToBottom(resizingConstraint)) {
                y = currentEnvFrame.height - originEnvFrame.height + y;
            } else if (ResizingConstraints2.isVerticalJustifyCenter(resizingConstraint)) {
                y = currentEnvFrame.height / 2 - originEnvFrame.height / 2 + y;
            }
        }
    }

    return { x, y, width, height };
}

function fixWidthByRecorder(shape: Shape, width: number, origin_d_to_right: number, current_env_width: number, x: number, recorder?: SizeRecorder) {
    if (width <= 1) {
        if (!recorder) {
            return 1;
        }

        const record = recorder.get(shape.id);
        if (!record) {
            recorder.set(shape.id, { toRight: origin_d_to_right, exceededX: true, toBottom: 0, exceededY: false });
            return 1;
        }

        if (!record.exceededX) {
            record.exceededX = true;
            record.toRight = origin_d_to_right;
        }

        return 1;
    } else { // todo 后续捋一捋这块，找到凭空来的像素点 0222
        if (!recorder) {
            return width;
        }

        const record = recorder.get(shape.id);
        if (!record || !record.exceededX) {
            return width;
        }

        const d2r = current_env_width - x - width;
        if (d2r < record.toRight) {
            return 1;
        } else {
            record.exceededX = false;
            return current_env_width - x - record.toRight;
        }
    }
}

function fixHeightByRecorder(shape: Shape, height: number, origin_d_to_bottom: number, current_env_height: number, y: number, recorder?: SizeRecorder) {
    if (height <= 1) {
        if (!recorder) {
            return 1;
        }

        const record = recorder.get(shape.id);
        if (!record) {
            recorder.set(shape.id, { toRight: 0, exceededX: false, toBottom: origin_d_to_bottom, exceededY: true });
            return 1;
        }

        if (!record.exceededY) {
            record.exceededY = true;
            record.toBottom = origin_d_to_bottom;
        }

        return 1;
    } else { // todo 后续捋一捋这块 0222
        if (!recorder) {
            return height;
        }

        const record = recorder.get(shape.id);
        if (!record || !record.exceededY) {
            return height;
        }

        const d2b = current_env_height - y - height;
        if (d2b < record.toBottom) {
            return 1;
        } else {
            record.exceededY = false;
            return current_env_height - y - record.toBottom;
        }
    }
}

function setFrame(page: Page, shape: Shape, x: number, y: number, w: number, h: number, api: Api, recorder?: SizeRecorder): boolean {
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
            } else {
                if (textBehaviour === TextBehaviour.Flexible) {
                    api.shapeModifyTextBehaviour(page, shape.text, TextBehaviour.Fixed);
                }
            }
            api.shapeModifyWH(page, shape, w, h)
            fixTextShapeFrameByLayout(api, page, shape);
        } else if (shape instanceof GroupShape) {
            const saveW = frame.width;
            const saveH = frame.height;
            api.shapeModifyWH(page, shape, w, h)
            const scaleX = frame.width / saveW;
            const scaleY = frame.height / saveH;

            // 这个scaleX, scaleY 不对
            afterModifyGroupShapeWH(api, page, shape, scaleX, scaleY, new ShapeFrame(frame.x, frame.y, saveW, saveH), recorder);
        } else {
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

export function expandTo(api: Api, document: Document, page: Page, shape: Shape, w: number, h: number) {
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
        // todo flip
        // if (shape.isFlippedHorizontal) m1.flipHoriz();
        // if (shape.isFlippedVertical) m1.flipVert();
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
    if (changed) afterShapeSizeChange(api, document, page, shape);
}

export function expand(api: Api, document: Document, page: Page, shape: Shape, dw: number, dh: number, round: boolean = true) {
    const frame = shape.frame;
    let w = frame.width + dw;
    let h = frame.height + dh;
    if (round) {
        w = Math.round(w);
        h = Math.round(h);
    }
    expandTo(api, document, page, shape, frame.width + dw, frame.height + dh);
}

/**
 * @deprecated 这个函数的相关运算需要加入对齐像素、固定比例、动态辅助对齐、缩放原点等用户设定的参数，
 * 因此适合放在前端上具有各项参数环境的运算器(./src/transform/scale.ts)里，将不再引用这个函数
 */
export function adjustLT2(api: Api, document: Document, page: Page, shape: Shape, x: number, y: number, recorder?: SizeRecorder) {
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
        // todo flip
        // api.shapeModifyHFlip(page, shape, !shape.isFlippedHorizontal)
        if (shape.rotation) {
            // api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        w = -w;
    }
    if (h < 0) {
        // todo flip
        // api.shapeModifyVFlip(page, shape, !shape.isFlippedVertical)
        if (shape.rotation) {
            // api.shapeModifyRotate(page, shape, 360 - shape.rotation);
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
    // todo flip
    // if (shape.isFlippedHorizontal) m1.flipHoriz();
    // if (shape.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(frame.x, frame.y);
    const xy1 = m1.computeCoord(0, 0);

    // (0,0)需要偏移到target位置
    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, shape, frame.x + dx, frame.y + dy, w, h, api, recorder);
    afterShapeSizeChange(api, document, page, shape);
}

/**
 * @deprecated
 */
export function adjustLB2(api: Api, document: Document, page: Page, shape: Shape, x: number, y: number, recorder?: SizeRecorder) { // 左下角    
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
        // todo flip
        // api.shapeModifyHFlip(page, shape, !shape.isFlippedHorizontal)
        if (shape.rotation) {
            // api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        w = -w;
    }
    if (h < 0) {
        // todo flip
        // api.shapeModifyVFlip(page, shape, !shape.isFlippedVertical)
        if (shape.rotation) {
            // api.shapeModifyRotate(page, shape, 360 - shape.rotation);
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
    // todo flip
    // if (shape.isFlippedHorizontal) m1.flipHoriz();
    // if (shape.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(frame.x, frame.y);
    const xy1 = m1.computeCoord(0, h);

    // (0,0)需要偏移到target位置
    dx = target.x - xy1.x;
    dy = target.y - xy1.y;
    setFrame(page, shape, frame.x + dx, frame.y + dy, w, h, api, recorder);
    afterShapeSizeChange(api, document, page, shape);
}

/**
 * @deprecated
 */
export function adjustRT2(api: Api, document: Document, page: Page, shape: Shape, x: number, y: number, recorder?: SizeRecorder) { // 右上角
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
        // todo flip
        // api.shapeModifyHFlip(page, shape, !shape.isFlippedHorizontal)
        if (shape.rotation) {
            // api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        w = -w;
    }
    if (h < 0) {
        // todo flip
        // api.shapeModifyVFlip(page, shape, !shape.isFlippedVertical)
        if (shape.rotation) {
            // api.shapeModifyRotate(page, shape, 360 - shape.rotation);
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
    // todo flip
    // if (shape.isFlippedHorizontal) m1.flipHoriz();
    // if (shape.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(frame.x, frame.y);
    const xy1 = m1.computeCoord(w, 0);

    // (0,0)需要偏移到target位置
    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, shape, frame.x + dx, frame.y + dy, w, h, api, recorder);
    afterShapeSizeChange(api, document, page, shape);
}

/**
 * @deprecated
 */
export function adjustRB2(api: Api, document: Document, page: Page, shape: Shape, x: number, y: number, recorder?: SizeRecorder) {
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
        // todo flip
        // api.shapeModifyHFlip(page, shape, !shape.isFlippedHorizontal);
        if (shape.rotation) {
            // api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        }
        w = -w;
    }
    if (h < 0) {
        // todo flip
        // api.shapeModifyVFlip(page, shape, !shape.isFlippedVertical);
        if (shape.rotation) {
            // api.shapeModifyRotate(page, shape, 360 - shape.rotation);
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
    // todo flip
    // if (shape.isFlippedHorizontal) m1.flipHoriz();
    // if (shape.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(frame.x, frame.y);
    const xy1 = m1.computeCoord(w, h);

    dx = target.x - xy1.x;
    dy = target.y - xy1.y;
    setFrame(page, shape, frame.x + dx, frame.y + dy, w, h, api, recorder);
    afterShapeSizeChange(api, document, page, shape);
}

/**
 * @deprecated
 * @description 自由缩放
 */
export function scaleByT(api: Api, document: Document, page: Page, s: Shape, p: PageXY, recorder?: SizeRecorder) {
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
        // todo flip
        // api.shapeModifyVFlip(page, s, !s.isFlippedVertical)
        if (s.rotation) {
            // api.shapeModifyRotate(page, s, 360 - s.rotation);
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
    // todo flip
    // if (s.isFlippedHorizontal) m1.flipHoriz();
    // if (s.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(f.x, f.y);

    const xy1 = m1.computeCoord2(0, 0);

    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, s, f.x + dx, f.y + dy, w, h, api, recorder);
    afterShapeSizeChange(api, document, page, s);
}

/**
 * @deprecated
 */
export function scaleByR(api: Api, document: Document, page: Page, s: Shape, p: PageXY, recorder?: SizeRecorder) {
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
        // todo flip
        // api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal)
        if (s.rotation) {
            // api.shapeModifyRotate(page, s, 360 - s.rotation);
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
    // todo flip
    // if (s.isFlippedHorizontal) m1.flipHoriz();
    // if (s.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(f.x, f.y);

    const xy1 = m1.computeCoord2(w, 0);

    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, s, f.x + dx, f.y + dy, w, h, api, recorder);
    afterShapeSizeChange(api, document, page, s);
}

/**
 * @deprecated
 */
export function scaleByB(api: Api, document: Document, page: Page, s: Shape, p: PageXY, recorder?: SizeRecorder) {
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
        // todo flip
        // api.shapeModifyVFlip(page, s, !s.isFlippedVertical);
        if (s.rotation) {
            // api.shapeModifyRotate(page, s, 360 - s.rotation);
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
    // todo flip
    // if (s.isFlippedHorizontal) m1.flipHoriz();
    // if (s.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(f.x, f.y);

    const xy1 = m1.computeCoord2(w, h);

    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, s, f.x + dx, f.y + dy, w, h, api, recorder);
    afterShapeSizeChange(api, document, page, s);
}

/**
 * @deprecated
 */
export function scaleByL(api: Api, document: Document, page: Page, s: Shape, p: PageXY, recorder?: SizeRecorder) {
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
        // todo flip
        // api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal)
        if (s.rotation) {
            // api.shapeModifyRotate(page, s, 360 - s.rotation);
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
    // todo flip
    // if (s.isFlippedHorizontal) m1.flipHoriz();
    // if (s.isFlippedVertical) m1.flipVert();
    m1.trans(cx1, cy1);
    m1.trans(f.x, f.y);

    const xy1 = m1.computeCoord2(0, h);

    dx = target.x - xy1.x;
    dy = target.y - xy1.y;

    setFrame(page, s, f.x + dx, f.y + dy, w, h, api, recorder);
    afterShapeSizeChange(api, document, page, s);
}

/**
 * @deprecated
 * @description 等比缩放
 * @param { number } scale 缩放比例
 */
export function erScaleByT(api: Api, document: Document, page: Page, s: Shape, scale: number, recorder?: SizeRecorder) {
    const p = s.parent;
    if (!p) return;
    const f = s.frame;
    const saveW = f.width;
    const saveH = f.height;
    if (scale < 0) {
        // todo flip
        // api.shapeModifyVFlip(page, s, !s.isFlippedVertical);
        // if (s.rotation) api.shapeModifyRotate(page, s, 360 - s.rotation);
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
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale, new ShapeFrame(f.x, f.y, saveW, saveH), recorder);
    afterShapeSizeChange(api, document, page, s);
}

/**
 * @deprecated
 */
export function erScaleByR(api: Api, document: Document, page: Page, s: Shape, scale: number, recorder?: SizeRecorder) {
    const p = s.parent;
    if (!p) return;
    const f = s.frame;
    const saveW = f.width;
    const saveH = f.height;
    if (scale < 0) {
        // todo flip
        // api.shapeModifyHFlip(page, s, !s.isFlippedVertical);
        // if (s.rotation) api.shapeModifyRotate(page, s, 360 - s.rotation);
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
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale, new ShapeFrame(f.x, f.y, saveW, saveH), recorder);
    afterShapeSizeChange(api, document, page, s);
}

/**
 * @deprecated
 */
export function erScaleByB(api: Api, document: Document, page: Page, s: Shape, scale: number, recorder?: SizeRecorder) {
    const p = s.parent;
    if (!p) return;
    const f = s.frame;
    const saveW = f.width;
    const saveH = f.height;
    if (scale < 0) {
        // todo flip
        // api.shapeModifyVFlip(page, s, !s.isFlippedVertical);
        // if (s.rotation) api.shapeModifyRotate(page, s, 360 - s.rotation);
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
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale, new ShapeFrame(f.x, f.y, saveW, saveH), recorder);
    afterShapeSizeChange(api, document, page, s);
}

/**
 * @deprecated
 */
export function erScaleByL(api: Api, document: Document, page: Page, s: Shape, scale: number, recorder?: SizeRecorder) {
    const p = s.parent;
    if (!p) return;
    const f = s.frame;
    const saveW = f.width;
    const saveH = f.height;
    if (scale < 0) {
        // todo flip
        // api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal);
        // if (s.rotation) api.shapeModifyRotate(page, s, 360 - s.rotation);
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
    if (s instanceof GroupShape) afterModifyGroupShapeWH(api, page, s, scale, scale, new ShapeFrame(f.x, f.y, saveW, saveH), recorder);
    afterShapeSizeChange(api, document, page, s);
}

function afterShapeSizeChange(api: Api, document: Document, page: Page, shape: Shape) {
    if (shape instanceof SymbolShape && !(shape instanceof SymbolUnionShape)) {
        const symId = shape.id;
        const refs = document.symbolsMgr.getRefs(symId);
        if (!refs) return;
        for (let [k, v] of refs) {
            if (v.isCustomSize) continue;
            const page = v.getPage();
            if (!page) throw new Error();
            api.shapeModifyWH(page as Page, v, shape.frame.width, shape.frame.height);
        }
    } else if (shape instanceof SymbolRefShape) {
        api.shapeModifyIsCustomSize(page, shape, true);
    }
}