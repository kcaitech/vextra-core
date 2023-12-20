import { expandTo } from "../../editor/frame";
import { Page } from "../../data/page";
import { PathShape, Shape } from "../../data/shape";
import { Api } from "../../editor/command/recordapi";
import { is_straight, update_frame_by_points } from "./path";
import { getHorizontalRadians } from "../../editor/page";

/**
 * @description 修改直线的width，操作的是直线段的第二个CurvePoint
 */
function modify_straight_length(api: Api, page: Page, shape: PathShape, val: number) {
    const points = shape.points;
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

    api.shapeModifyCurvPoint(page, shape, 1, new_rb);

    update_frame_by_points(api, page, shape);
}
/**
 * @description 主动修改图形的宽度为指定宽度val，这个函数因直线段而存在🤯
 */
export function modify_shapes_width(api: Api, page: Page, shapes: Shape[], val: number) {
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

        expandTo(api, page, shape, val, h);
    }
}

export function modify_shapes_height(api: Api, page: Page, shapes: Shape[], val: number) {
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

        expandTo(api, page, shape, w, val);
    }
}