/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Page } from "../data/page";
import { Matrix } from "../basic/matrix";
import {
    Shape,
    SymbolShape,
    TextShape
} from "../data/shape";
import { TextBehaviour } from "../data/typesdefine";
import { fixTextShapeFrameByLayout } from "./utils/other";
import { ResizingConstraints2 } from "../data/consts";
import { Operator } from "../coop/recordop";
import { Document } from "../data/document";
import { ShapeSize, SymbolUnionShape } from "../data/classes";
import { SymbolRefShape } from "../data/symbolref";


export type SizeRecorder = Map<string, { toRight: number, exceededX: boolean, toBottom: number, exceededY: boolean }>;

export const minimum_WH = 0.01; // 用户可设置最小宽高值。以防止宽高在缩放后为0

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

function setSize(page: Page, shape: Shape, w: number, h: number, api: Operator): boolean {
    if (!shape.hasSize()) {
        return false;
    }
    const frame = shape.size;
    let changed = false;
    // if (x !== frame.x) {
    //     api.shapeModifyX(page, shape, x)
    //     changed = true;
    // }
    // if (y !== frame.y) {
    //     api.shapeModifyY(page, shape, y)
    //     changed = true;
    // }
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
        }
        // else if (shape instanceof GroupShape) {
        //     // const saveW = frame.width;
        //     // const saveH = frame.height;
        //     api.shapeModifyWH(page, shape, w, h)
        //     // const scaleX = frame.width / saveW;
        //     // const scaleY = frame.height / saveH;
        //
        //     // 这个scaleX, scaleY 不对
        //     // afterModifyGroupShapeWH(api, page, shape, scaleX, scaleY, new ShapeFrame(frame.x, frame.y, saveW, saveH), recorder);
        // }
        else {
            api.shapeModifyWH(page, shape, w, h)
        }
        changed = true;
    }
    return changed;
}

export function translateTo(api: Operator, page: Page, shape: Shape, x: number, y: number) {
    const p = shape.parent;
    if (!p) return;
    const m1 = p.matrix2Root();
    const m0 = shape.matrix2Parent();
    const target = m1.inverseCoord(x, y);
    const cur = m0.computeCoord(0, 0);
    const dx = target.x - cur.x;
    const dy = target.y - cur.y;
    api.shapeModifyXY(page, shape, shape.transform.translateX + dx, shape.transform.translateY + dy)
}

export function translate(api: Operator, page: Page, shape: Shape, dx: number, dy: number, round: boolean = true) {
    const xy = shape.frame2Root();
    let x = xy.x + dx;
    let y = xy.y + dy;
    if (round) {
        x = Math.round(x);
        y = Math.round(y);
    }
    translateTo(api, page, shape, x, y);
}

export function expandTo(api: Operator, document: Document, page: Page, shape: Shape, w: number, h: number) {
    if (w < minimum_WH) w = minimum_WH;
    if (h < minimum_WH) h = minimum_WH;
    let changed;
    if (shape.isNoTransform()) {
        changed = setSize(page, shape, w, h, api);
    } else {
        // todo
        // const frame = shape.frame;
        // // 修改frame后的matrix，用来判断修改后(0,0)点的偏移位置
        // const cx1 = w / 2;
        // const cy1 = h / 2;
        // const m1 = new Matrix();
        // m1.trans(-cx1, -cy1);
        // if (shape.rotation) m1.rotate(shape.rotation / 180 * Math.PI);
        // m1.trans(cx1, cy1);
        // m1.trans(frame.x, frame.y);
        // const m = shape.matrix2Parent();
        // const xy = m.computeCoord(0, 0);
        // const xy1 = m1.computeCoord(0, 0);
        // const dx = xy.x - xy1.x;
        // const dy = xy.y - xy1.y;
        // api.shapeModifyX(page, shape, shape.transform.translateX + dx)
        // api.shapeModifyY(page, shape, shape.transform.translateY + dy)

        changed = setSize(page, shape, w, h, api);
    }

    // if (changed) updateFrame(shape);
    if (changed || !shape.hasSize()) afterShapeSizeChange(api, document, page, shape);
}

export function expand(api: Operator, document: Document, page: Page, shape: Shape, dw: number, dh: number, round: boolean = true) {
    const frame = shape.size;
    let w = frame.width + dw;
    let h = frame.height + dh;
    if (round) {
        w = Math.round(w);
        h = Math.round(h);
    }
    expandTo(api, document, page, shape, w, h);
}


/**
 * @deprecated
 */
export function adjustRB2(api: Operator, document: Document, page: Page, shape: Shape, x: number, y: number, recorder?: SizeRecorder) {
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
        // if (shape.rotation) {
        //     // api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        // }
        w = -w;
    }
    if (h < 0) {
        // todo flip
        // api.shapeModifyVFlip(page, shape, !shape.isFlippedVertical);
        // if (shape.rotation) {
        //     // api.shapeModifyRotate(page, shape, 360 - shape.rotation);
        // }
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
    api.shapeModifyXY(page, shape, shape.transform.translateX + dx, shape.transform.translateY + dy)
    setSize(page, shape, w, h, api);
    afterShapeSizeChange(api, document, page, shape);
}

function afterShapeSizeChange(api: Operator, document: Document, page: Page, shape: Shape) {
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