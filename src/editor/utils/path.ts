import { Api } from "../../editor/command/recordapi";
import { CurveMode, CurvePoint } from "../../data/typesdefine";
import { PathShape } from "../../data/shape";
import { Page } from "../../data/page";

interface XY {
    x: number
    y: number
}


/**
 * @description 计算三次贝塞尔曲线上的点
 * @param t 0~1
 * @param p0 起点
 * @param p1 控制点
 * @param p2 控制点
 * @param p3 终点
 * @returns
 */
export function bezierCurvePoint(t: number, p0: XY, p1: XY, p2: XY, p3: XY): XY {
    return {
        x: Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x,
        y: Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y
    };
}

/**
 *  @description 计算三次贝塞尔曲线的包围盒
 *  @param p0 起点
 *  @param p1 控制点
 *  @param p2 控制点
 *  @param p3 终点
 *  @param numPoints 计算的点数
 */
export function bezierCurveBoundingBox(p0: XY, p1: XY, p2: XY, p3: XY, numPoints = 100) {

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const point = bezierCurvePoint(t, p0, p1, p2, p3);
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.x);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.x);
    }

    return [[minX, minY], [maxX, maxY]];
}

export function __anther_side_xy(curve_point: CurvePoint, handle_site: XY, current_side: 'from' | 'to') {
    const is_from = current_side === 'from';
    const _a_xy = { x: 0, y: 0 };
    if (curve_point.mode === CurveMode.Mirrored) {
        _a_xy.x = 2 * curve_point.x - handle_site.x;
        _a_xy.y = 2 * curve_point.y - handle_site.y;
        return _a_xy;
    } else if (curve_point.mode === CurveMode.Asymmetric) {
        _a_xy.x = is_from ? curve_point.toX || 0 : curve_point.fromX || 0;
        _a_xy.y = is_from ? curve_point.toY || 0 : curve_point.fromY || 0;
        const l = Math.hypot(_a_xy.x - curve_point.x, _a_xy.y - curve_point.y);
        const __angle = Math.atan2(handle_site.x - curve_point.x, handle_site.y - curve_point.y);
        const _l_x = Math.abs(Math.sin(__angle) * l);
        const _l_y = Math.abs(Math.cos(__angle) * l);
        const _delta_x = handle_site.x - curve_point.x;
        const _delta_y = handle_site.y - curve_point.y;
        _a_xy.x = curve_point.x - (_delta_x / Math.abs(_delta_x)) * _l_x;
        _a_xy.y = curve_point.y - (_delta_y / Math.abs(_delta_y)) * _l_y;
        return _a_xy;
    }
    _a_xy.x = is_from ? curve_point.toX || 0 : curve_point.fromX || 0;
    _a_xy.y = is_from ? curve_point.toY || 0 : curve_point.fromY || 0;
    return _a_xy;
}

export function __round_curve_point(shape: PathShape, index: number) {
    const points = shape.points;
    const previous_index = index === 0 ? points.length - 1 : index - 1;
    const next_index = index === points.length - 1 ? 0 : index + 1;
    return {
        previous: points[previous_index],
        next: points[next_index],
        previous_index,
        next_index
    }
}

export function init_curv(shape: PathShape, page: Page, api: Api, curve_point: CurvePoint, index: number) {
    const round = __round_curve_point(shape, index);
    const { previous, next } = round;
    if (new Set([previous.id, next.id, curve_point.id]).size !== 3) {
        console.log('duplicate point');
        return;
    }
    const k = Math.atan2(next.x - previous.x, next.y - previous.y);
    const dx = 0.35 * Math.sin(k);
    const dy = 0.35 * Math.cos(k);
    const from = { x: curve_point.x + dx, y: curve_point.y + dy };
    const to = { x: curve_point.x - dx, y: curve_point.y - dy };
    api.shapeModifyCurvFromPoint(page, shape, index, from);
    api.shapeModifyCurvToPoint(page, shape, index, to);
    api.modifyPointHasFrom(page, shape, index, true);
    api.modifyPointHasTo(page, shape, index, true);
}
export function init_straight(shape: PathShape, page: Page, api: Api, index: number) {
    api.shapeModifyCurvFromPoint(page, shape, index, { x: 0, y: 0 });
    api.shapeModifyCurvToPoint(page, shape, index, { x: 0, y: 0 });
    api.modifyPointHasFrom(page, shape, index, false);
    api.modifyPointHasTo(page, shape, index, false);
}
export function align_from(shape: PathShape, page: Page, api: Api, curve_point: CurvePoint, index: number) {
    if (curve_point.fromX === undefined || curve_point.fromY === undefined) {
        return;
    }
    const delta_x = 2 * curve_point.x - curve_point.fromX;
    const delta_y = 2 * curve_point.y - curve_point.fromY;
    api.shapeModifyCurvToPoint(page, shape, index, { x: delta_x, y: delta_y });
}
export function align_to(shape: PathShape, page: Page, api: Api, curve_point: CurvePoint, index: number) {
    if (curve_point.toX === undefined || curve_point.toY === undefined) {
        return;
    }
    const delta_x = 2 * curve_point.x - curve_point.toX;
    const delta_y = 2 * curve_point.y - curve_point.toY;
    api.shapeModifyCurvFromPoint(page, shape, index, { x: delta_x, y: delta_y });
}
export function _typing_modify(shape: PathShape, page: Page, api: Api, index: number, to_mode: CurveMode) {
    const point = shape.points[index];
    if (!point) {
        return;
    }
    if (point.mode === CurveMode.Straight && to_mode !== CurveMode.Straight) {
        init_curv(shape, page, api, point, index);
        return;
    }
    if (point.mode === CurveMode.Mirrored && to_mode === CurveMode.Straight) {
        init_straight(shape, page, api, index);
        return;
    }
    if (point.mode === CurveMode.Disconnected) {
        if (to_mode === CurveMode.Straight) {
            init_straight(shape, page, api, index);
        } else if (to_mode === CurveMode.Mirrored || to_mode === CurveMode.Asymmetric) {
            align_from(shape, page, api, point, index);
        }
        return;
    }
    if (point.mode === CurveMode.Asymmetric) {
        if (to_mode === CurveMode.Straight) {
            init_straight(shape, page, api, index);
        } else if (to_mode === CurveMode.Mirrored) {
            align_from(shape, page, api, point, index);
        }
    }
}