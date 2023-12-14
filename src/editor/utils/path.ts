import { Api } from "../../editor/command/recordapi";
import { CurveMode, ShapeType } from "../../data/typesdefine";
import { CurvePoint, GroupShape, PathShape, Shape, ShapeFrame } from "../../data/shape";
import { Page } from "../../data/page";
import { importCurvePoint, importStyle } from "../../data/baseimport";
import { exportCurvePoint, exportStyle } from "../../data/baseexport";
import { v4 } from "uuid";
import { uuid } from "../../basic/uuid";
import { BasicArray } from "../../data/basic";
import { Matrix } from "../../basic/matrix";
import { group } from "../../editor/group";
import { addCommonAttr, newGroupShape } from "../../editor/creator";
import { getHorizontalAngle } from "../../editor/page";
interface XY {
    x: number
    y: number
}
const minimum_WH = 1; // 用户可设置最小宽高值。以防止宽高在缩放后为0

/**
 * @description 以点为操作目标编辑路径
 * @param index 点的数组索引
 * @param end 点的目标🎯位置（root）
 */
export function pathEdit(api: Api, page: Page, s: PathShape, index: number, end: XY, matrix?: Matrix) {
    const w = s.frame.width, h = s.frame.height;
    let m = matrix ? matrix : new Matrix();
    if (!matrix) {
        m.multiAtLeft(s.matrix2Root());
        m.preScale(w, h);
        m = new Matrix(m.inverse);
    }
    const p = s.points[index];
    if (!p) {
        return false;
    }
    const save = { x: p.x, y: p.y };
    const _val = m.computeCoord3(end);
    api.shapeModifyCurvPoint(page, s as PathShape, index, _val);
    const delta = { x: _val.x - save.x, y: _val.y - save.y };
    if (!delta.x && !delta.y) {
        return;
    }
    if (p.hasFrom) {
        api.shapeModifyCurvFromPoint(page, s as PathShape, index, { x: (p.fromX || 0) + delta.x, y: (p.fromY || 0) + delta.y });
    }
    if (p.hasTo) {
        api.shapeModifyCurvToPoint(page, s as PathShape, index, { x: (p.toX || 0) + delta.x, y: (p.toY || 0) + delta.y });
    }
}

/**
 * @description 多点编辑
 */
export function pointsEdit(api: Api, page: Page, s: PathShape, indexes: number[], dx: number, dy: number) {
    const points = s.points;
    for (let i = 0, l = indexes.length; i < l; i++) {
        const index = indexes[i];
        const __p = points[index];
        if (!__p) {
            continue;
        }
        api.shapeModifyCurvPoint(page, s, index, { x: __p.x + dx, y: __p.y + dy });
        if (__p.hasFrom) {
            api.shapeModifyCurvFromPoint(page, s as PathShape, index, { x: (__p.fromX || 0) + dx, y: (__p.fromY || 0) + dy });
        }
        if (__p.hasTo) {
            api.shapeModifyCurvToPoint(page, s as PathShape, index, { x: (__p.toX || 0) + dx, y: (__p.toY || 0) + dy });
        }
    }
}

/**
 * @description 连接线编辑
 */
export function contact_edit(api: Api, page: Page, s: Shape, index1: number, index2: number, dx: number, dy: number) { // 以边为操作目标编辑路径
    const m = new Matrix(s.matrix2Root());
    const w = s.frame.width, h = s.frame.height;

    m.preScale(w, h);

    const m_in = new Matrix(m.inverse);  // 图形单位坐标系，0-1
    let p1 = s.points[index1];
    let p2 = s.points[index2];

    if (!p1 || !p2) {
        return false;
    }

    p1 = m.computeCoord2(p1.x, p1.y), p2 = m.computeCoord2(p2.x, p2.y);

    if (dx) {
        p1.x = p1.x + dx, p2.x = p2.x + dx;
    }
    if (dy) {
        p1.y = p1.y + dy, p2.y = p2.y + dy;
    }

    p1 = m_in.computeCoord3(p1);
    p2 = m_in.computeCoord3(p2);

    api.shapeModifyCurvPoint(page, s as PathShape, index1, p1);
    api.shapeModifyCurvPoint(page, s as PathShape, index2, p2);
}
export function update_frame_by_points(api: Api, page: Page, s: PathShape) {
    const nf = s.boundingBox2();
    const w = s.frame.width, h = s.frame.height;

    const mp = s.matrix2Parent();
    mp.preScale(w, h);

    if (s.rotation) {
        api.shapeModifyRotate(page, s, 0);
    }
    if (s.isFlippedHorizontal) {
        api.shapeModifyHFlip(page, s, false);
    }
    if (s.isFlippedVertical) {
        api.shapeModifyVFlip(page, s, false);
    }

    api.shapeModifyX(page, s, nf.x);
    api.shapeModifyY(page, s, nf.y);
    api.shapeModifyWH(page, s, Math.max(nf.width, minimum_WH), Math.max(nf.height, minimum_WH));

    const f = s.frame;

    const mp2 = s.matrix2Parent();
    mp2.preScale(f.width, f.height);
    mp.multiAtLeft(mp2.inverse);

    const points = s.points;

    if (!points || !points.length) {
        return false;
    }

    for (let i = 0, len = points.length; i < len; i++) {
        const p = points[i];
        if (!p) {
            continue;
        }

        if (p.hasFrom) {
            api.shapeModifyCurvFromPoint(page, s, i, mp.computeCoord2(p.fromX || 0, p.fromY || 0));
        }

        if (p.hasTo) {
            api.shapeModifyCurvToPoint(page, s, i, mp.computeCoord2(p.toX || 0, p.toY || 0));
        }

        api.shapeModifyCurvPoint(page, s, i, mp.computeCoord2(p.x, p.y));
    }

    console.log(s.name, 'update frame by "update_frame_by_points"');
}
export function update_frame_by_points2(api: Api, page: Page, s: PathShape) {
    const nf = s.boundingBox2();
    const w = s.frame.width, h = s.frame.height;
    const mp = s.matrix2Parent();
    mp.preScale(w, h);
    if (s.rotation) {
        api.shapeModifyRotate(page, s, 0);
    }
    if (s.isFlippedHorizontal) {
        api.shapeModifyHFlip(page, s, false);
    }
    if (s.isFlippedVertical) {
        api.shapeModifyVFlip(page, s, false);
    }
    api.shapeModifyX(page, s, nf.x);
    api.shapeModifyY(page, s, nf.y);
    api.shapeModifyWH(page, s, nf.width, nf.height);
    const mp2 = s.matrix2Parent();
    mp2.preScale(nf.width, nf.height);
    mp.multiAtLeft(mp2.inverse);
    const points = s.points;
    if (!points?.length) {
        return false;
    }
    for (let i = 0, len = points.length; i < len; i++) {
        const p = points[i];
        if (!p) continue;
        if (p.hasFrom && p.fromX !== undefined && p.fromY !== undefined) {
            api.shapeModifyCurvFromPoint(page, s as PathShape, i, mp.computeCoord2(p.fromX, p.fromY));
        }
        if (p.hasTo && p.toX !== undefined && p.toY !== undefined) {
            api.shapeModifyCurvToPoint(page, s as PathShape, i, mp.computeCoord2(p.toX, p.toY));
        }
        api.shapeModifyCurvPoint(page, s as PathShape, i, mp.computeCoord2(p.x, p.y));
    }
    console.log('update frame by update_frame_by_points2');
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
export function replace_path_shape_points(page: Page, shape: PathShape, api: Api, points: CurvePoint[]) {
    const len = points.length;
    api.deletePoints(page, shape as PathShape, 0, len);
    for (let i = 0, len = points.length; i < len; i++) {
        const p = importCurvePoint(exportCurvePoint(points[i]));
        p.id = v4();
        points[i] = p;
    }
    api.addPoints(page, shape as PathShape, points);
}
function _sort_after_clip(path_shape: PathShape, index: number) {
    const points = path_shape.points;
    if (index === points.length - 1) {
        return points.map(i => i);
    }
    const result: CurvePoint[] = [];
    for (let i = index + 1, l = points.length; i < l; i++) {
        result.push(points[i]);
    }
    result.push(...points.slice(0, index + 1));
    return result;
}
function after_clip(page: Page, api: Api, path_shape: PathShape): number {
    if (path_shape.points.length < 2) {
        const parent = path_shape.parent;
        if (!parent) {
            console.log('!parent');
            return 0;
        }
        const index = (parent as GroupShape).indexOfChild(path_shape);
        if (index < 0) {
            console.log('index < 0');
            return 0;
        }
        api.shapeDelete(page, parent as GroupShape, index);
        return 1;
    }
    return 0;
}
function points_mapping_to_parent(points: CurvePoint[], path_shape: PathShape) {
    const f = path_shape.frame;
    const m = path_shape.matrix2Parent();
    m.preScale(f.width, f.height);
    for (let i = 0, l = points.length; i < l; i++) {
        const _p = points[i];
        const xy = m.computeCoord2(_p.x, _p.y);
        points[i].x = xy.x;
        points[i].y = xy.y;
    }
}
function _apart_points(points: CurvePoint[], index: number) {
    const _idx = index + 1;
    const path1: CurvePoint[] = points.slice(0, _idx);
    const path2: CurvePoint[] = points.slice(_idx);
    return { path1, path2 }
}
function get_frame_by_points(points: CurvePoint[]) {
    const frame = new ShapeFrame(0, 0, 0, 0);
    if (points.length < 2) {
        console.log('points.length < 2');
        return frame;
    }
    const first = points[0];
    frame.x = first.x;
    frame.y = first.y;
    let right = frame.x;
    let bottom = frame.y;
    for (let i = 1, l = points.length; i < l; i++) {
        const p = points[i];
        if (!p) {
            console.log('get_frame_by_points: !p');
            break;
        }
        if (p.x < frame.x) {
            frame.x = p.x;
        }
        if (p.y < frame.y) {
            frame.y = p.y;
        }
        if (p.x > right) {
            right = p.x;
        }
        if (p.y > bottom) {
            bottom = p.y;
        }
    }
    frame.width = Math.max(minimum_WH, right - frame.x);
    frame.height = Math.max(minimum_WH, bottom - frame.y);
    return frame;
}
function create_path_shape_by_frame(origin: PathShape, frame: ShapeFrame, slice_name: string) {
    const __style = importStyle(exportStyle(origin.style));
    const __points = new BasicArray<CurvePoint>();
    const __ps = new PathShape(uuid(), slice_name, ShapeType.Path, frame, __style, __points, false);
    addCommonAttr(__ps)
    return __ps;
}
function insert_part_to_doc(page: Page, origin: PathShape, part: PathShape, api: Api) {
    const parent: GroupShape = origin.parent as GroupShape;
    if (!parent) {
        console.log('!parent');
        return;
    }
    const index = parent.indexOfChild(origin);
    return api.shapeInsert(page, parent, part, index);
}
function update_points_xy(page: Page, part: PathShape, points: CurvePoint[], api: Api) {
    const __m = part.matrix2Parent();
    __m.preScale(part.frame.width, part.frame.height);
    const m = new Matrix(__m.inverse);
    points.forEach(p => {
        const _p = m.computeCoord2(p.x, p.y);
        p.x = _p.x;
        p.y = _p.y;
    })
    api.addPoints(page, part, points);
}
function assemble(page: Page, parts: PathShape[], origin: PathShape, api: Api) {
    const parent = origin.parent as GroupShape;
    if (!parent) {
        console.log('assemble: !parent');
        return;
    }
    const index = parent.indexOfChild(origin);
    if (index < 0) {
        console.log('assemble: index < 0');
        return;
    }
    const gshape = newGroupShape('图形');
    return group(page, parts, gshape, parent, index, api);
}
function delele_origin(page: Page, origin: PathShape, api: Api) {
    const parent = origin.parent as GroupShape;
    if (!parent) {
        console.log('delele_origin: !parent');
        return;
    }
    const index = parent.indexOfChild(origin);
    if (index < 0) {
        console.log('delele_origin: index < 0');
        return;
    }
    api.shapeDelete(page, parent, index);
}
export function apart_path_shape(page: Page, api: Api, path_shape: PathShape, index: number, slice_name: string) {
    // 将要拆分图形

    // 拆分结果
    const data: { code: number, ex: Shape | undefined } = { code: 0, ex: undefined };

    // 闭合路径不存在拆分
    if (path_shape.isClosed) {
        console.log('path_shape.isClosed');
        data.code = -1;
        return data;
    }

    // 拷贝points数据
    const points = path_shape.points.map(i => importCurvePoint(exportCurvePoint(i)));

    if (index === 0 || index === points.length - 2) {
        console.log('index === 0 || index === points.length - 2');
        data.code = -1;
        return data;
    }

    // 数据验证、验证完成，开始拆分

    // 1.把点映射到原先图形的父亲坐标系上
    points_mapping_to_parent(points, path_shape);
    // 2.根据裁剪位置拆分点
    const apart = _apart_points(points, index);

    // 3.根据各部分点计算各部分的frame
    const frame1 = get_frame_by_points(apart.path1);
    const frame2 = get_frame_by_points(apart.path2);

    // 4.根据计算的frame，按照原有图形的样式来生成两个path对象
    const __part1 = create_path_shape_by_frame(path_shape, frame1, slice_name);
    const __part2 = create_path_shape_by_frame(path_shape, frame2, slice_name);

    // 5.把生成的path对象加入文档
    const part1 = insert_part_to_doc(page, path_shape, __part1, api) as PathShape;
    const part2 = insert_part_to_doc(page, path_shape, __part2, api) as PathShape;

    if (!part1 || !part2) {
        console.log('!part1 || !part2');
        data.code = -1;
        return data;
    }

    // 6.把1中生成的点映射到生成的path对象上
    update_points_xy(page, part1, apart.path1, api);
    update_points_xy(page, part2, apart.path2, api);

    // 7.更新frame
    update_path_shape_frame(api, page, [part1, part2]);

    // 8.把生成的path组合
    const g = assemble(page, [part1, part2], path_shape, api);
    data.ex = g;

    // 9.删除原先图形 done
    delele_origin(page, path_shape, api);

    return data;
}
export function _clip(page: Page, api: Api, path_shape: PathShape, index: number, slice_name: string) {
    let data: { code: number, ex: Shape | undefined } = { code: 0, ex: undefined };
    if (path_shape.isClosed) {
        api.setCloseStatus(page, path_shape, false);
        const points = _sort_after_clip(path_shape, index);
        replace_path_shape_points(page, path_shape, api, points);
        data.code = -1;
        return data;
    }
    const points = path_shape.points;
    if (index === 0) {
        api.deletePoint(page, path_shape, index);
        data.code = after_clip(page, api, path_shape);
        return data;
    }
    if (index === points.length - 2) {
        api.deletePoint(page, path_shape, points.length - 1);
        data.code = after_clip(page, api, path_shape);
        return data;
    }
    data = apart_path_shape(page, api, path_shape, index, slice_name);
    return data;
}
export function update_path_shape_frame(api: Api, page: Page, shapes: PathShape[]) {
    for (let i = 0, l = shapes.length; i < l; i++) {
        const shape = shapes[i];
        update_frame_by_points(api, page, shape);
    }
}
export function init_points(api: Api, page: Page, s: Shape, points: CurvePoint[]) {
    api.deletePoints(page, s as PathShape, 0, s.points.length);
    api.addPoints(page, s as PathShape, points);
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
export function is_straight(shape: Shape) {
    if (!(shape instanceof PathShape)) {
        return false;
    }
    if (shape.type === ShapeType.Contact) {
        return false;
    }
    const points = shape.points;
    if (points.length !== 2) {
        return false;
    }
    return !points[0].hasFrom && !points[1].hasTo;
}
export function get_rotate_for_straight(shape: PathShape, v: number) {
    const points = (shape as PathShape).points;

    const f = shape.frame, m = shape.matrix2Root();
    m.preScale(f.width, f.height);
    const p1 = points[0];
    const p2 = points[1];

    if (!p1 || !p2) {
        return 0;
    }

    const lt = m.computeCoord2(p1.x, p1.y);
    const rb = m.computeCoord2(p2.x, p2.y);
    const real_r = Number(getHorizontalAngle(lt, rb).toFixed(2));

    let dr = v - real_r;
    if (shape.isFlippedHorizontal) {
        dr = -dr;
    }
    if (shape.isFlippedVertical) {
        dr = -dr;
    }

    return (shape.rotation || 0) + dr;
}