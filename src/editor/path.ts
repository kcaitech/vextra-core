import {CurvePoint, PathShape, Shape} from "../data/shape";
import {Api} from "./command/recordapi";
import {Page} from "../data/page";
import {Matrix} from "../basic/matrix";

function get_box_by_points(s: Shape, points: CurvePoint[]) {
    const point_raw = points;
    if (!point_raw) return false;
    const w = s.frame.width, h = s.frame.height, m = s.matrix2Parent();
    m.preScale(w, h);
    let x = 0, y = 0, right = 0, bottom = 0, width = w, height = h;
    if (point_raw.length > 1) {
        const p = m.computeCoord(point_raw[0].x, point_raw[0].y);
        x = p.x, y = p.y, right = p.x, bottom = p.y;
    } else return false;
    for (let i = 1, len = point_raw.length || 0; i < len; i++) {
        // const point = point_raw[i].point;
        // if (!point) continue;
        const p = m.computeCoord(point_raw[i].x, point_raw[i].y);

        if (p.x < x) x = p.x, width = right - x;
        else if (p.x > right) right = p.x, width = right - x;

        if (p.y < y) y = p.y, height = bottom - y;
        else if (p.y > bottom) bottom = p.y, height = bottom - y;
    }
    return {x, y, width, height};
}

export function init_points(api: Api, page: Page, s: Shape, points: CurvePoint[]) {
    api.deletePoints(page, s as PathShape, 0, s.points.length);
    api.addPoints(page, s as PathShape, points);
}

/**
 * @description 根据points更新shape frame
 */
export function update_frame_by_points(api: Api, page: Page, s: Shape) {
    const nf = get_box_by_points(s, (s as PathShape).points);
    if (!nf) return;
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

export function modify_points_xy(api: Api, page: Page, s: PathShape, actions: {
    index: number,
    x: number,
    y: number
}[]) {
    let m = new Matrix();
    const f = s.frame;
    m.preScale(f.width, f.height);
    m.multiAtLeft(s.matrix2Parent());
    m = new Matrix(m.inverse);
    for (let i = 0, l = actions.length; i < l; i++) {
        const action = actions[i];
        const new_xy = m.computeCoord2(action.x, action.y);
        api.shapeModifyCurvPoint(page, s, action.index, new_xy);
    }
    update_frame_by_points(api, page, s);
}