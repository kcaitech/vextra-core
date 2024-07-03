import { expandTo, translate, translateTo } from "../../editor/frame";
import { Page } from "../../data/page";
import { GroupShape, PathShape, Shape, ShapeFrame } from "../../data/shape";
import { Api } from "../coop/recordapi";
import { is_straight, update_frame_by_points } from "./path";
import { getHorizontalRadians } from "../../editor/page";
import { Artboard } from "../../data/artboard";
import { Point2D } from "../../data/typesdefine";
import { float_accuracy } from "../../basic/consts";
import { Document } from "../../data/document";
import { reLayoutBySizeChanged } from "../asyncApiHandler";

function equal_with_mean(a: number, b: number) {
    return Math.abs(a - b) < float_accuracy;
}

/**
 * @description 修改直线的width，操作的是直线段的第二个CurvePoint
 */
function modify_straight_length(api: Api, page: Page, shape: PathShape, val: number) {
    const points = shape.pathsegs[0].points;
    const p1 = points[0];
    const p2 = points[1];

    const m = shape.matrix2Parent();
    const f = shape.frame;

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
export function modify_shapes_width(api: Api, document: Document, page: Page, shapes: Shape[], val: number) {
    for (let i = 0, l = shapes.length; i < l; i++) {
        const shape = shapes[i];

        if (is_straight(shape)) {
            modify_straight_length(api, page, shape as PathShape, val);
            continue;
        }

        const w = shape.frame.width;

        let h = shape.frame.height;

        if (shape.constrainerProportions) {
            const rate = w / val;
            h = h / rate;
        }

        expandTo(api, document, page, shape, val, h);

        if (shape instanceof GroupShape) {
            reLayoutBySizeChanged(api, page, shape, {
                x: val / w,
                y: h / shape.frame.height
            });
        }
    }
}

export function modify_shapes_height(api: Api, document: Document, page: Page, shapes: Shape[], val: number) {
    for (let i = 0, l = shapes.length; i < l; i++) {
        const shape = shapes[i];

        if (is_straight(shape)) {
            continue; // 直线段的高度不可修改恒定为0.01
        }

        let w = shape.frame.width;

        const h = shape.frame.height;

        if (shape.constrainerProportions) {
            const rate = h / val;
            w = w / rate;
        }

        expandTo(api, document, page, shape, w, val);

        if (shape instanceof GroupShape) {
            reLayoutBySizeChanged(api, page, shape, {
                x: w / shape.frame.width,
                y: val / h
            });
        }
    }
}

/**
 * @description 裁剪容器空白区域(保留自身transform)
 */
export function adapt_for_artboard(api: Api, page: Page, artboard: Artboard) {
    const minimum_WH = 0.01;
    const children = artboard.childs;
    if (!children.length) {
        console.log('adapt_for_artboard: !children.length');
        return;
    }


    const m_artboard_to_root = artboard.matrix2Root();

    const f = artboard.frame;
    const box = get_new_box();

    if (no_need_to_adapt()) {
        throw new Error("adapt_for_artboard: no_need_to_adapt");
    }

    re_children_layout();

    api.shapeModifyWH(page, artboard, Math.max(box.width, minimum_WH), Math.max(box.height, minimum_WH));

    const artboard_xy = m_artboard_to_root.computeCoord2(box.x, box.y);
    translateTo(api, page, artboard, artboard_xy.x, artboard_xy.y);

    // utils
    function get_new_box() {
        const points: Point2D[] = [];

        children.forEach(c => {
            const f = c.frame;
            const m2p = c.matrix2Parent();
            points.push(
                ...[
                    { x: 0, y: 0 },
                    { x: f.width, y: 0 },
                    { x: f.width, y: f.height },
                    { x: 0, y: f.height }
                ]
                    .map(i => m2p.computeCoord3(i))
            )
        })

        const minx = points.reduce((pre, cur) => Math.min(pre, cur.x), points[0].x);
        const maxx = points.reduce((pre, cur) => Math.max(pre, cur.x), points[0].x);
        const miny = points.reduce((pre, cur) => Math.min(pre, cur.y), points[0].y);
        const maxy = points.reduce((pre, cur) => Math.max(pre, cur.y), points[0].y);

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
            api.shapeModifyX(page, c, c.frame.x - box.x);
            api.shapeModifyY(page, c, c.frame.y - box.y);
        })
    }
}