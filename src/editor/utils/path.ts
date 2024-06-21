import { Api } from "../coop/recordapi";
import { ContactForm, CurveMode, ShapeType } from "../../data/typesdefine";
import { CurvePoint, PathShape, PathShape2, Shape } from "../../data/shape";
import { Page } from "../../data/page";
import { v4 } from "uuid";
import { uuid } from "../../basic/uuid";
import { BasicArray } from "../../data/basic";
import { Matrix } from "../../basic/matrix";
import { getHorizontalAngle } from "../page";
import { ContactShape } from "../../data/contact";
import { get_box_pagexy, get_nearest_border_point } from "../../data/utils";
import { PathType } from "../../data/consts";
import { importCurvePoint } from "../../data/baseimport";

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
    // todo 连接线相关操作
    let m = matrix ? matrix : new Matrix();
    if (!matrix) {
        const w = s.frame.width, h = s.frame.height;
        if (w === 0 || h === 0) throw new Error(); // 不可以为0
        m.multiAtLeft(s.matrix2Root());
        m.preScale(w, h);
        m = new Matrix(m.inverse);
    }

    const p = (s as PathShape).pathsegs[0].points[index];
    if (!p) {
        return false;
    }
    const save = { x: p.x, y: p.y };
    const _val = m.computeCoord3(end);
    api.shapeModifyCurvPoint(page, s as PathShape, index, _val, 0);
    const delta = { x: _val.x - save.x, y: _val.y - save.y };
    if (!delta.x && !delta.y) {
        return;
    }
    if (p.hasFrom) {
        api.shapeModifyCurvFromPoint(page, s as PathShape, index, {
            x: (p.fromX || 0) + delta.x,
            y: (p.fromY || 0) + delta.y
        }, 0);
    }
    if (p.hasTo) {
        api.shapeModifyCurvToPoint(page, s as PathShape, index, {
            x: (p.toX || 0) + delta.x,
            y: (p.toY || 0) + delta.y
        }, 0);
    }
}

/**
 * @description 多点编辑
 */
export function pointsEdit(api: Api, page: Page, s: Shape, points: CurvePoint[], indexes: number[], dx: number, dy: number, segment = -1) {
    for (let i = 0, l = indexes.length; i < l; i++) {
        const index = indexes[i];
        const __p = points[index];
        if (!__p) {
            continue;
        }
        api.shapeModifyCurvPoint(page, s, index, { x: __p.x + dx, y: __p.y + dy }, segment);
        if (__p.hasFrom) {
            api.shapeModifyCurvFromPoint(page, s as PathShape, index,
                {
                    x: (__p.fromX || 0) + dx,
                    y: (__p.fromY || 0) + dy
                },
                segment
            );
        }
        if (__p.hasTo) {
            api.shapeModifyCurvToPoint(page, s as PathShape, index,
                {
                    x: (__p.toX || 0) + dx,
                    y: (__p.toY || 0) + dy
                },
                segment
            );
        }
    }
}

/**
 * @description 连接线编辑
 */
export function contact_edit(api: Api, page: Page, s: ContactShape, index1: number, index2: number, dx: number, dy: number) { // 以边为操作目标编辑路径
    // todo 连接线相关操作
    const m = new Matrix(s.matrix2Root());
    const w = s.frame.width, h = s.frame.height;

    m.preScale(w, h);

    const m_in = new Matrix(m.inverse);  // 图形单位坐标系，0-1

    let p1: { x: number, y: number } = s.points[index1];
    let p2: { x: number, y: number } = s.points[index2];

    if (!p1 || !p2) {
        return false;
    }

    p1 = m.computeCoord2(p1.x, p1.y);
    p2 = m.computeCoord2(p2.x, p2.y);

    if (dx) {
        p1.x = p1.x + dx, p2.x = p2.x + dx;
    }
    if (dy) {
        p1.y = p1.y + dy, p2.y = p2.y + dy;
    }

    p1 = m_in.computeCoord3(p1);
    p2 = m_in.computeCoord3(p2);

    api.shapeModifyCurvPoint(page, s, index1, p1, 0);
    api.shapeModifyCurvPoint(page, s, index2, p2, 0);
}

export function get_points_for_init(page: Page, shape: ContactShape, index: number, points: CurvePoint[]) {
    let len = points.length;
    let result = [...points];

    if (index === 0) { // 如果编辑的线为第一根线；
        const from = shape.from;
        if (!from) {
            const p = result[0];
            result.splice(1, 0, new CurvePoint([1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const fromShape = page.getShape((from as ContactForm).shapeId);
        if (!fromShape) {
            const p = result[0];
            result.splice(1, 0, new CurvePoint([1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const xy_result = get_box_pagexy(fromShape);
        if (!xy_result) {
            const p = result[0];
            result.splice(1, 0, new CurvePoint([1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const { xy1, xy2 } = xy_result;
        let p = get_nearest_border_point(fromShape, from.contactType, fromShape.matrix2Root(), xy1, xy2);
        if (!p) {
            const p = result[0];
            result.splice(1, 0, new CurvePoint([1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result
        }

        const m1 = shape.matrix2Root();
        const f = shape.frame;
        m1.preScale(f.width, f.height);
        const m2 = new Matrix(m1.inverse);

        p = m2.computeCoord3(p);
        const cp = new CurvePoint([1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight);
        const cp2 = new CurvePoint([2] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight);
        result.splice(1, 0, cp, cp2);
    }
    if (index === len - 2) { // 编辑的线为最后一根线；
        len = result.length; // 更新一下长度，因为部分场景下，编辑的线会同时为第一根线和最后一根线，若是第一根线的话，原数据已经更改，需要在下次更改数据前并判定为最后一根线后去更新result长度。
        const to = shape.to;
        if (!to) {
            const p = points[points.length - 1];
            result.splice(len - 1, 0, new CurvePoint([len - 1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const toShape = page.getShape((to as ContactForm).shapeId);
        if (!toShape) {
            const p = points[points.length - 1];
            result.splice(len - 1, 0, new CurvePoint([len - 1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const xy_result = get_box_pagexy(toShape);
        if (!xy_result) {
            const p = points[points.length - 1];
            result.splice(len - 1, 0, new CurvePoint([len - 1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const { xy1, xy2 } = xy_result;
        let p = get_nearest_border_point(toShape, to.contactType, toShape.matrix2Root(), xy1, xy2);
        if (!p) {
            const p = points[points.length - 1];
            result.splice(len - 1, 0, new CurvePoint([len - 1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const m1 = shape.matrix2Root();
        const f = shape.frame;
        m1.preScale(f.width, f.height);
        const m2 = new Matrix(m1.inverse);

        p = m2.computeCoord3(p);
        const cp = new CurvePoint([len - 1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight);
        const cp2 = new CurvePoint([len] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight);
        result.splice(len - 1, 0, cp, cp2)
    }
    return result;
}

export function before_modify_side(api: Api, page: Page, shape: ContactShape, index: number) {
    const points = get_points_for_init(page, shape, index, shape.getPoints());

    replace_path_shape_points(page, shape, api, points);

    update_frame_by_points(api, page, shape);

    api.contactModifyEditState(page, shape, true);
}

export function update_frame_by_points(api: Api, page: Page, s: Shape, reLayout = false) {
    const box = s.boundingBox3();

    if (!box) {
        return;
    }

    const m = s.matrix2Root();

    const f = s.frame;
    const w = f.width;
    const h = f.height;

    const m1 = new Matrix(s.matrix2Parent());
    m1.preScale(w, h);

    const targetWidth = Math.max(box.width, minimum_WH);
    const targetHeight = Math.max(box.height, minimum_WH);

    let frameChange = false;
    if (w !== targetWidth || h !== targetHeight) {
        api.shapeModifyWH(page, s, targetWidth, targetHeight);
        frameChange = true;
    }

    const rootXY = m.computeCoord2(box.x, box.y);
    const targetXY = s.parent!.matrix2Root().inverseCoord(rootXY);
    const __targetXY = s.matrix2Parent().computeCoord2(0, 0);

    const dx = targetXY.x - __targetXY.x;
    const dy = targetXY.y - __targetXY.y;

    if (dx) {
        api.shapeModifyX(page, s, f.x + dx);
    }
    if (dy) {
        api.shapeModifyY(page, s, f.y + dy);
    }

    if (!(frameChange || reLayout)) { // 只有宽高被改变，才会需要重排2D points.
        return;
    }
    const m3 = new Matrix(s.matrix2Parent());
    m3.preScale(s.frame.width, s.frame.height);
    m1.multiAtLeft(m3.inverse);

    (s as PathShape).pathsegs.forEach((segment, index) => {
        exe(index, m1, segment.points);
    });

    function exe(segment: number, m: Matrix, points: CurvePoint[]) {
        if (!points || !points.length) {
            return false;
        }

        for (let i = 0, len = points.length; i < len; i++) {
            const p = points[i];
            if (!p) {
                continue;
            }

            if (p.hasFrom) {
                api.shapeModifyCurvFromPoint(page, s, i, m.computeCoord2(p.fromX || 0, p.fromY || 0), segment);
            }

            if (p.hasTo) {
                api.shapeModifyCurvToPoint(page, s, i, m.computeCoord2(p.toX || 0, p.toY || 0), segment);
            }

            api.shapeModifyCurvPoint(page, s, i, m.computeCoord2(p.x, p.y), segment);
        }
    }
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


export function __round_curve_point(points: CurvePoint[], index: number) {
    const previous_index = index === 0 ? points.length - 1 : index - 1;
    const next_index = index === points.length - 1 ? 0 : index + 1;
    return {
        previous: points[previous_index],
        next: points[next_index],
        previous_index,
        next_index
    }
}

export function init_curv(order: 2 | 3, shape: Shape, page: Page, api: Api, curve_point: CurvePoint, index: number, segmentIndex: number, init = (Math.sqrt(2) / 4)) {
    const __shape = shape as PathShape2;
    const points = __shape.pathsegs[segmentIndex]?.points;

    if (!points?.length) {
        return;
    }

    const apex = getApex(points, index);

    if (!apex) {
        return;
    }

    const { from, to } = apex;

    if (order === 3) {
        api.shapeModifyCurvFromPoint(page, __shape, index, from, segmentIndex);
        api.shapeModifyCurvToPoint(page, __shape, index, to, segmentIndex);
        api.modifyPointHasFrom(page, __shape, index, true, segmentIndex);
        api.modifyPointHasTo(page, __shape, index, true, segmentIndex);
    } else {
        api.shapeModifyCurvFromPoint(page, __shape, index, from, segmentIndex);
        api.modifyPointHasFrom(page, __shape, index, true, segmentIndex);
    }

    function getApex(points: CurvePoint[], index: number) {
        const round = __round_curve_point(points, index);

        const { previous, next } = round;
        //
        // if (new Set([previous.id, next.id, curve_point.id]).size !== 3) {
        //     console.log('duplicate point');
        //     return;
        // }

        const k = Math.atan2(next.x - previous.x, next.y - previous.y);
        const dx = init * Math.sin(k);
        const dy = init * Math.cos(k);
        const from = { x: curve_point.x + dx, y: curve_point.y + dy };
        const to = { x: curve_point.x - dx, y: curve_point.y - dy };

        return { from, to };
    }
}

export function init_straight(shape: Shape, page: Page, api: Api, index: number, segmentIndex: number) {
    api.shapeModifyCurvFromPoint(page, shape, index, { x: 0, y: 0 }, segmentIndex);
    api.shapeModifyCurvToPoint(page, shape, index, { x: 0, y: 0 }, segmentIndex);
    api.modifyPointHasFrom(page, shape, index, false, segmentIndex);
    api.modifyPointHasTo(page, shape, index, false, segmentIndex);
}

export function align_from(shape: Shape, page: Page, api: Api, curve_point: CurvePoint, index: number, segmentIndex: number) {
    if (curve_point.fromX === undefined || curve_point.fromY === undefined) {
        return;
    }
    const delta_x = 2 * curve_point.x - curve_point.fromX;
    const delta_y = 2 * curve_point.y - curve_point.fromY;
    api.shapeModifyCurvToPoint(page, shape, index, { x: delta_x, y: delta_y }, segmentIndex);
}

export function _typing_modify(shape: Shape, page: Page, api: Api, index: number, to_mode: CurveMode, segmentIndex: number) {
    let point: CurvePoint | undefined;

    point = (shape as PathShape)?.pathsegs[segmentIndex]?.points[index];

    if (!point) {
        return;
    }

    if (point.mode === CurveMode.Straight && to_mode !== CurveMode.Straight) {
        init_curv(3, shape, page, api, point, index, segmentIndex, (Math.sqrt(2) / 4));
        return;
    }

    if (point.mode === CurveMode.Mirrored && to_mode === CurveMode.Straight) {
        init_straight(shape, page, api, index, segmentIndex);
        return;
    }

    if (point.mode === CurveMode.Disconnected) {
        if (to_mode === CurveMode.Straight) {
            init_straight(shape, page, api, index, segmentIndex);
        } else if (to_mode === CurveMode.Mirrored || to_mode === CurveMode.Asymmetric) {
            align_from(shape, page, api, point, index, segmentIndex);
        }
        return;
    }

    if (point.mode === CurveMode.Asymmetric) {
        if (to_mode === CurveMode.Straight) {
            init_straight(shape, page, api, index, segmentIndex);
        } else if (to_mode === CurveMode.Mirrored) {
            align_from(shape, page, api, point, index, segmentIndex);
        }
    }
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

function modify_previous_from_by_slice(page: Page, api: Api, path_shape: Shape, slice: XY[], previous: CurvePoint, index: number, segmentIndex: number) {
    if (previous.mode === CurveMode.Straight || !previous.hasFrom) {
        return;
    }
    if (previous.mode === CurveMode.Mirrored) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric, segmentIndex);
    }
    api.shapeModifyCurvFromPoint(page, path_shape, index, slice[1], segmentIndex);
}

function modify_next_to_by_slice(page: Page, api: Api, path_shape: Shape, slice: XY[], next: CurvePoint, index: number, segmentIndex: number) {
    if (next.mode === CurveMode.Straight || !next.hasTo) {
        return;
    }
    if (next.mode === CurveMode.Mirrored) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric, segmentIndex);
    }

    api.shapeModifyCurvToPoint(page, path_shape, index, slice[2], segmentIndex);
}

function modify_current_handle_slices(page: Page, api: Api, path_shape: Shape, slices: XY[][], index: number, segmentIndex: number) {
    api.modifyPointHasTo(page, path_shape, index, true, segmentIndex);
    api.modifyPointHasFrom(page, path_shape, index, true, segmentIndex);
    api.shapeModifyCurvToPoint(page, path_shape, index, slices[0][2], segmentIndex);
    api.shapeModifyCurvFromPoint(page, path_shape, index, slices[1][1], segmentIndex);
}

export function after_insert_point(page: Page, api: Api, path_shape: Shape, index: number, segmentIndex: number) {
    let __segment = segmentIndex;

    let points: CurvePoint[] = (path_shape as PathShape)?.pathsegs[segmentIndex]?.points;

    if (!points) return;

    const { previous, next, previous_index, next_index } = __round_curve_point(points, index);

    const xy = get_node_xy_by_round(previous, next);
    api.shapeModifyCurvPoint(page, path_shape, index, xy, __segment);

    if (!is_curve(previous, next)) {
        return;
    }

    api.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric, __segment);
    const { start, from, to, end } = get_curve(previous, next);
    const slices = split_cubic_bezier(start, from, to, end);

    modify_previous_from_by_slice(page, api, path_shape, slices[0], previous, previous_index, __segment);
    modify_next_to_by_slice(page, api, path_shape, slices[1], next, next_index, __segment);
    modify_current_handle_slices(page, api, path_shape, slices, index, __segment);
}

export function __pre_curve(order: 2 | 3, page: Page, api: Api, path_shape: Shape, index: number, segmentIndex: number) {
    let point: CurvePoint | undefined = undefined;

    point = (path_shape as PathShape)?.pathsegs[segmentIndex]?.points[index];

    if (!point) {
        return;
    }

    if (order === 3) {
        if (point.mode !== CurveMode.Mirrored) {
            api.modifyPointCurveMode(page, path_shape, index, CurveMode.Mirrored, segmentIndex);
        }
    } else {
        if (point.mode !== CurveMode.Disconnected) {
            api.modifyPointCurveMode(page, path_shape, index, CurveMode.Disconnected, segmentIndex);
        }
    }

    init_curv(order, path_shape, page, api, point, index, segmentIndex, 0.01);
}

export function replace_path_shape_points(page: Page, shape: PathShape, api: Api, points: CurvePoint[]) {
    // todo 连接线相关操作
    api.deletePoints(page, shape as PathShape, 0, shape.pathsegs[0].points.length, 0);
    for (let i = 0, len = points.length; i < len; i++) {
        const p = importCurvePoint((points[i]));
        p.id = v4();
        points[i] = p;
    }
    api.addPoints(page, shape as PathShape, points, 0);
}

export function modify_points_xy(api: Api, page: Page, s: Shape, actions: {
    segment: number;
    index: number;
    x: number;
    y: number;
}[]) {
    let m = new Matrix(s.matrix2Parent());
    const f = s.frame;
    m.preScale(f.width, f.height);

    m = new Matrix(m.inverse);

    if (s.pathType !== PathType.Editable) {
        return;
    }

    for (let i = 0, l = actions.length; i < l; i++) {
        const action = actions[i];
        const new_xy = m.computeCoord2(action.x, action.y);
        api.shapeModifyCurvPoint(page, s, action.index, new_xy, action.segment);
    }

    update_frame_by_points(api, page, s);
}

export function is_straight(shape: Shape) {
    if (!(shape instanceof PathShape || shape.type === ShapeType.Contact)) {
        return false;
    }

    const points = (shape as PathShape).pathsegs[0].points;

    return points.length === 2 && !points[0].hasFrom && !points[1].hasTo; // 两个点的，那就是直线
}

export function get_rotate_for_straight(shape: PathShape, v: number) {
    const points = (shape as PathShape)?.pathsegs[0]?.points;

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
    // todo flip
    // if (shape.isFlippedHorizontal) {
    //     dr = -dr;
    // }
    // if (shape.isFlippedVertical) {
    //     dr = -dr;
    // }

    return (shape.rotation || 0) + dr;
}

// 生成一个顶点为 (0.5, 0)，中心点为 (0.5, 0.5)，边数为 n 的等边多边形的顶点坐标
export function getPolygonVertices(sidesCount: number, offsetPercent?: number) {
    const cx = 0.5;
    const cy = 0.5;
    const angleStep = (2 * Math.PI) / sidesCount;

    let vertices = [{ x: 0.5, y: 0 }];
    for (let i = 1; i < sidesCount; i++) {
        const angle = i * angleStep;
        let x = cx + (0.5 - cx) * Math.cos(angle) - (0 - cy) * Math.sin(angle);
        let y = cy + (0.5 - cx) * Math.sin(angle) + (0 - cy) * Math.cos(angle);
        if (i % 2 === 1 && offsetPercent) {
            // 计算偏移后的点
            const offsetX = (x - cx) * offsetPercent;
            const offsetY = (y - cy) * offsetPercent;
            x = cx + offsetX;
            y = cy + offsetY;
        }
        vertices.push({ x, y });
    }

    return vertices;
}

export function getPolygonPoints(counts: XY[], radius?: number) {
    const curvePoint = new BasicArray<CurvePoint>();
    for (let i = 0; i < counts.length; i++) {
        const count = counts[i];
        const point = new CurvePoint([i] as BasicArray<number>, uuid(), count.x, count.y, CurveMode.Straight);
        if (radius) point.radius = radius;
        curvePoint.push(point);
    }
    return curvePoint;
}

export function calculateInnerAnglePosition(percent: number, angle: number) {
    const cx = 0.5;
    const cy = 0.5;
    let x = cx + (0.5 - cx) * Math.cos(angle) - (0 - cy) * Math.sin(angle);
    let y = cy + (0.5 - cx) * Math.sin(angle) + (0 - cy) * Math.cos(angle);
    const maxpoint = { x, y }

    const newX = cx + ((maxpoint.x - cx) * percent);
    const newY = cy + ((maxpoint.y - cy) * percent);

    return { x: newX, y: newY };
}
