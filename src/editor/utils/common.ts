/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { expandTo, translateTo } from "../frame";
import { Operator } from "../../coop/recordop";
import { is_straight, update_frame_by_points } from "./path";
import { getHorizontalRadians } from "../page";
import { Artboard, Document, PathShape, ShapeFrame, Page } from "../../data";
import { Point2D, StackSizing } from "../../data/typesdefine";
import { float_accuracy } from "../../basic/consts";
import { reLayoutBySizeChanged } from "../asyncapi";
import { adapt2Shape, ArtboardView, GroupShapeView, PageView, ShapeView } from "../../dataview";
import { shape4Autolayout } from "../symbol";

function equal_with_mean(a: number, b: number) {
    return Math.abs(a - b) < float_accuracy;
}

/**
 * @description 修改直线的width，操作的是直线段的第二个CurvePoint
 */
function modify_straight_length(api: Operator, page: Page, shape: PathShape, val: number) {
    const points = shape.pathsegs[0].points;
    const p1 = points[0];
    const p2 = points[1];

    const m = shape.matrix2Parent();
    const f = shape.size;

    m.preScale(f.width, f.height);

    const lt = m.computeCoord2(p1.x, p1.y);
    const rb = m.computeCoord2(p2.x, p2.y);

    const real_r = getHorizontalRadians(lt, rb);

    const x = Math.cos(real_r) * val + lt.x;
    const y = Math.sin(real_r) * val + lt.y;

    const new_rb = m.inverseCoord({ x, y });

    api.shapeModifyCurvPoint(page, shape, 1, new_rb, 0);

    update_frame_by_points(api, page, shape);
}

/**
 * @description 主动修改图形的宽度为指定宽度val，这个函数因直线段而存在🤯
 */
export function modify_shapes_width(api: Operator, document: Document, page: Page, shapes: ShapeView[], val: number) {
    for (let i = 0, l = shapes.length; i < l; i++) {
        const view = shapes[i];
        const shape = adapt2Shape(view);

        if (is_straight(shape)) {
            modify_straight_length(api, page, shape as PathShape, val);
            continue;
        }

        const w = view.frame.width;

        let h = view.frame.height;

        if (shape.constrainerProportions) {
            const rate = w / val;
            h = h / rate;
        }
        const origin_h = view.frame.height;
        expandTo(api, document, page, shape, val, h);
        if ((view as ArtboardView).autoLayout) {
            const _shape = shape4Autolayout(api, view, view.getPage() as PageView);
            api.shapeModifyAutoLayoutSizing(page, _shape, StackSizing.Fixed, 'hor');
        }
        if (view instanceof GroupShapeView) {
            reLayoutBySizeChanged(api, page, view, { x: val / w, y: h / origin_h });
        }
    }
}

export function modify_shapes_height(api: Operator, document: Document, page: Page, shapes: ShapeView[], val: number) {
    for (let i = 0, l = shapes.length; i < l; i++) {
        const view = shapes[i];
        const shape = adapt2Shape(view);

        if (is_straight(shape)) {
            continue; // 直线段的高度不可修改恒定为0.01
        }

        let w = view.frame.width;

        const h = view.frame.height;

        if (shape.constrainerProportions) {
            const rate = h / val;
            w = w / rate;
        }

        const origin_w = view.frame.width;
        expandTo(api, document, page, shape, w, val);
        if ((view as ArtboardView).autoLayout) {
            const _shape = shape4Autolayout(api, view, view.getPage() as PageView);
            api.shapeModifyAutoLayoutSizing(page, _shape, StackSizing.Fixed, 'ver');
        }
        if (view instanceof GroupShapeView) {
            reLayoutBySizeChanged(api, page, view, {
                x: w / origin_w,
                y: val / h
            });
        }
    }
}

/**
 * @description 裁剪容器空白区域(保留自身transform)
 */
export function adapt_for_artboard(api: Operator, page: Page, artboard: ArtboardView) {
    const minimum_WH = 1;
    const children = artboard.childs;
    if (!children.length) throw new Error('!children.length') ;

    const m_artboard_to_root = artboard.matrix2Root();

    const f = artboard.size;
    const box = get_new_box();

    if (no_need_to_adapt()) throw new Error('invalid action');

    re_children_layout();

    const a = adapt2Shape(artboard);

    api.shapeModifyWH(page, a, Math.max(box.width, minimum_WH), Math.max(box.height, minimum_WH));

    const artboard_xy = m_artboard_to_root.computeCoord3(box);
    translateTo(api, page, a, artboard_xy.x, artboard_xy.y);

    return true;

    function get_new_box() {
        const points: Point2D[] = [];

        children.forEach(c => {
            const f = c.frame;
            const m = c.matrix2Parent();
            const r = f.x + f.width;
            const b = f.y + f.height;

            points.push(...[
                { x: f.x, y: f.y },
                { x: r, y: f.y },
                { x: r, y: b },
                { x: f.x, y: b }
            ].map(i => m.computeCoord3(i)));
        });

        let minx = points.reduce((pre, cur) => Math.min(pre, cur.x), points[0].x);
        let maxx = points.reduce((pre, cur) => Math.max(pre, cur.x), points[0].x);
        let miny = points.reduce((pre, cur) => Math.min(pre, cur.y), points[0].y);
        let maxy = points.reduce((pre, cur) => Math.max(pre, cur.y), points[0].y);

        const layout = artboard.autoLayout;
        if (layout) {
            const { stackHorizontalPadding, stackVerticalPadding, stackPaddingBottom, stackPaddingRight } = layout;
            minx -= stackHorizontalPadding;
            miny -= stackVerticalPadding;
            maxx += stackPaddingRight;
            maxy += stackPaddingBottom;
        }

        return new ShapeFrame(minx, miny, maxx - minx, maxy - miny);
    }

    function no_need_to_adapt() {
        return equal_with_mean(0, box.x)
            && equal_with_mean(0, box.y)
            && equal_with_mean(f.width, box.width)
            && equal_with_mean(f.height, box.height)
    }

    function re_children_layout() {
        children.forEach(c => {
            const d = adapt2Shape(c);
            api.shapeModifyXY(page, d, c.transform.translateX - box.x, c.transform.translateY - box.y);
        });
    }
}