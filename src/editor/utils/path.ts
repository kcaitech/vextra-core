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
export function init_curv(shape: PathShape, page: Page, api: Api, curve_point: CurvePoint, index: number, init = 0.35) {
    const round = __round_curve_point(shape, index);
    const { previous, next } = round;
    if (new Set([previous.id, next.id, curve_point.id]).size !== 3) {
        console.log('duplicate point');
        return;
    }
    const k = Math.atan2(next.x - previous.x, next.y - previous.y);
    const dx = init * Math.sin(k);
    const dy = init * Math.cos(k);
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
export function cubic_bezier_angle(P0: XY, P1: XY, P2: XY, P3: XY, t = 0.5) {
    const a = -3 * (1 - t) ** 2;
    const b1 = 3 * (1 - t) ** 2;
    const b2 = 6 * (1 - t) * t;
    const c1 = 3 * (2 * t - 2 * t ** 2);
    const c2 = 6 * (1 - t) * t;
    const d = 3 * t ** 2
    const derivativeX = a * P0.x +
        (b1 - b2) * P1.x +
        (c1 - c2) * P2.x +
        d * P3.x;
    const derivativeY = a * P0.x +
        (b1 - b2) * P1.y +
        (c1 - c2) * P2.y +
        d * P3.y;
    return Math.atan2(derivativeY, derivativeX);
}
export function split_cubic_bezier(p0: XY, p1: XY, p2: XY, p3: XY) {
    const p01 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const p12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const p23 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
    const p012 = { x: (p01.x + p12.x) / 2, y: (p01.y + p12.y) / 2 };
    const p123 = { x: (p12.x + p23.x) / 2, y: (p12.y + p23.y) / 2 };
    const p0123 = { x: (p012.x + p123.x) / 2, y: (p012.y + p123.y) / 2 };
    return [
        [p0, p01, p012, p0123],
        [p0123, p123, p23, p3]
    ];
}
function is_curve(p: CurvePoint, n: CurvePoint) {
    return p.hasFrom || n.hasTo;
}
function get_curve(p: CurvePoint, n: CurvePoint) {
    const start = { x: p.x, y: p.y };
    const from = { x: 0, y: 0 };
    const to = { x: 0, y: 0 };
    const end = { x: n.x, y: n.y };
    if (p.hasFrom) {
        from.x = p.fromX || 0;
        from.y = p.fromY || 0;
    } else {
        from.x = p.x;
        from.y = p.y;
    }
    if (n.hasTo) {
        to.x = n.toX || 0;
        to.y = n.toY || 0;
    } else {
        to.x = n.x;
        to.y = n.y;
    }
    return { start, from, to, end };
}
function get_node_xy_by_round(p: CurvePoint, n: CurvePoint) {
    if (is_curve(p, n)) {
        const { start, from, to, end } = get_curve(p, n);
        return bezierCurvePoint(0.5, start, from, to, end);
    } else {
        return {
            x: (p.x + n.x) / 2,
            y: (p.y + n.y) / 2
        }
    }
}
function modify_previous_from_by_slice(page: Page, api: Api, path_shape: PathShape, slice: XY[], previous: CurvePoint, index: number) {
    if (previous.mode === CurveMode.Straight || !previous.hasFrom) {
        return;
    }
    if (previous.mode === CurveMode.Mirrored) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric);
    }
    api.shapeModifyCurvFromPoint(page, path_shape, index, slice[1]);
}
function modify_next_to_by_slice(page: Page, api: Api, path_shape: PathShape, slice: XY[], next: CurvePoint, index: number) {
    if (next.mode === CurveMode.Straight || !next.hasTo) {
        return;
    }
    if (next.mode === CurveMode.Mirrored) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric);
    }
    api.shapeModifyCurvToPoint(page, path_shape, index, slice[2]);
}
function modify_current_handle_slices(page: Page, api: Api, path_shape: PathShape, slices: XY[][], index: number) {
    api.modifyPointHasTo(page, path_shape, index, true);
    api.modifyPointHasFrom(page, path_shape, index, true);
    api.shapeModifyCurvToPoint(page, path_shape, index, slices[0][2]);
    api.shapeModifyCurvFromPoint(page, path_shape, index, slices[1][1]);
}
export function after_insert_point(page: Page, api: Api, path_shape: PathShape, index: number) {
    const { previous, next, previous_index, next_index } = __round_curve_point(path_shape, index);

    const xy = get_node_xy_by_round(previous, next);
    api.shapeModifyCurvPoint(page, path_shape, index, xy);

    if (!is_curve(previous, next)) {
        return;
    }

    api.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric);
    const { start, from, to, end } = get_curve(previous, next);
    const slices = split_cubic_bezier(start, from, to, end);

    modify_previous_from_by_slice(page, api, path_shape, slices[0], previous, previous_index);
    modify_next_to_by_slice(page, api, path_shape, slices[1], next, next_index);
    modify_current_handle_slices(page, api, path_shape, slices, index);
}

export function __pre_curve(page: Page, api: Api, path_shape: PathShape, index: number) {
    const point = path_shape.points[index];
    if (!point) {
        return;
    }
    if (point.mode !== CurveMode.Mirrored) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Mirrored);
    }
    init_curv(path_shape, page, api, point, index, 0.01);
}