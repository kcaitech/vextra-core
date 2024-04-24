import { Api } from "../coop/recordapi";
import * as types from "../../data/typesdefine";
import { ContactForm, CurveMode, ShapeType } from "../../data/typesdefine";
import { CurvePoint, GroupShape, PathSegment, PathShape, PathShape2, Shape, ShapeFrame } from "../../data/shape";
import { Page } from "../../data/page";
import { importCurvePoint, importShapeFrame, importStyle } from "../../data/baseimport";
import { exportCurvePoint, exportShapeFrame, exportStyle } from "../../data/baseexport";
import { v4 } from "uuid";
import { uuid } from "../../basic/uuid";
import { BasicArray } from "../../data/basic";
import { Matrix } from "../../basic/matrix";
import { group } from "../group";
import { addCommonAttr, newGroupShape } from "../creator";
import { getHorizontalAngle } from "../page";
import { ContactShape } from "../../data/contact";
import { get_box_pagexy, get_nearest_border_point } from "../../data/utils";
import { Document } from "../../data/document";
import { PathType } from "../../data/consts";

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
    // let m = matrix ? matrix : new Matrix();
    // if (!matrix) {
    //     const w = s.frame.width, h = s.frame.height;
    //     if (w === 0 || h === 0) throw new Error(); // 不可以为0
    //     m.multiAtLeft(s.matrix2Root());
    //     m.preScale(w, h);
    //     m = new Matrix(m.inverse);
    // }
    // const p = s.points[index];
    // if (!p) {
    //     return false;
    // }
    // const save = { x: p.x, y: p.y };
    // const _val = m.computeCoord3(end);
    // api.shapeModifyCurvPoint(page, s as PathShape, index, _val);
    // const delta = { x: _val.x - save.x, y: _val.y - save.y };
    // if (!delta.x && !delta.y) {
    //     return;
    // }
    // if (p.hasFrom) {
    //     api.shapeModifyCurvFromPoint(page, s as PathShape, index, {
    //         x: (p.fromX || 0) + delta.x,
    //         y: (p.fromY || 0) + delta.y
    //     });
    // }
    // if (p.hasTo) {
    //     api.shapeModifyCurvToPoint(page, s as PathShape, index, {
    //         x: (p.toX || 0) + delta.x,
    //         y: (p.toY || 0) + delta.y
    //     });
    // }
    // todo
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

    api.shapeModifyCurvPoint(page, s, index1, p1);
    api.shapeModifyCurvPoint(page, s, index2, p2);
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

export function update_frame_by_points(api: Api, page: Page, s: Shape) {
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

    if (!frameChange) { // 只有宽高被改变，才会需要重排2D points.
        return;
    }

    const m3 = new Matrix(s.matrix2Parent());
    m3.preScale(f.width, f.height);
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

export function init_curv(shape: Shape, page: Page, api: Api, curve_point: CurvePoint, index: number, init = 0.35, segment = -1) {
    if (segment > -1) {
        const __shape = shape as PathShape2;
        const points = __shape.pathsegs[segment]?.points;

        if (!points?.length) {
            return;
        }

        const apex = getApex(points, index);

        if (!apex) {
            return;
        }

        const { from, to } = apex;

        api.shapeModifyCurvFromPoint(page, __shape, index, from, segment);
        api.shapeModifyCurvToPoint(page, __shape, index, to, segment);
        api.modifyPointHasFrom(page, __shape, index, true, segment);
        api.modifyPointHasTo(page, __shape, index, true, segment);

    }

    function getApex(points: CurvePoint[], index: number) {
        const round = __round_curve_point(points, index);

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

        return { from, to };
    }
}

export function init_straight(shape: Shape, page: Page, api: Api, index: number, segment = -1) {
    api.shapeModifyCurvFromPoint(page, shape, index, { x: 0, y: 0 }, segment);
    api.shapeModifyCurvToPoint(page, shape, index, { x: 0, y: 0 }, segment);
    api.modifyPointHasFrom(page, shape, index, false, segment);
    api.modifyPointHasTo(page, shape, index, false, segment);
}

export function align_from(shape: Shape, page: Page, api: Api, curve_point: CurvePoint, index: number, segment = -1) {
    if (curve_point.fromX === undefined || curve_point.fromY === undefined) {
        return;
    }
    const delta_x = 2 * curve_point.x - curve_point.fromX;
    const delta_y = 2 * curve_point.y - curve_point.fromY;
    api.shapeModifyCurvToPoint(page, shape, index, { x: delta_x, y: delta_y }, segment);
}

export function _typing_modify(shape: Shape, page: Page, api: Api, index: number, to_mode: CurveMode, segment = -1) {
    let point: CurvePoint | undefined;

    if (segment > -1) {
        point = (shape as PathShape).pathsegs[segment]?.points[index];
    }

    if (!point) {
        return;
    }

    if (point.mode === CurveMode.Straight && to_mode !== CurveMode.Straight) {
        init_curv(shape, page, api, point, index, 0.35, segment);
        return;
    }

    if (point.mode === CurveMode.Mirrored && to_mode === CurveMode.Straight) {
        init_straight(shape, page, api, index, segment);
        return;
    }

    if (point.mode === CurveMode.Disconnected) {
        if (to_mode === CurveMode.Straight) {
            init_straight(shape, page, api, index, segment);
        } else if (to_mode === CurveMode.Mirrored || to_mode === CurveMode.Asymmetric) {
            align_from(shape, page, api, point, index, segment);
        }
        return;
    }

    if (point.mode === CurveMode.Asymmetric) {
        if (to_mode === CurveMode.Straight) {
            init_straight(shape, page, api, index, segment);
        } else if (to_mode === CurveMode.Mirrored) {
            align_from(shape, page, api, point, index, segment);
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

function modify_previous_from_by_slice(page: Page, api: Api, path_shape: Shape, slice: XY[], previous: CurvePoint, index: number, segment = -1) {
    if (previous.mode === CurveMode.Straight || !previous.hasFrom) {
        return;
    }
    if (previous.mode === CurveMode.Mirrored) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric, segment);
    }
    api.shapeModifyCurvFromPoint(page, path_shape, index, slice[1], segment);
}

function modify_next_to_by_slice(page: Page, api: Api, path_shape: Shape, slice: XY[], next: CurvePoint, index: number, segment = -1) {
    if (next.mode === CurveMode.Straight || !next.hasTo) {
        return;
    }
    if (next.mode === CurveMode.Mirrored) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric, segment);
    }

    api.shapeModifyCurvToPoint(page, path_shape, index, slice[2], segment);
}

function modify_current_handle_slices(page: Page, api: Api, path_shape: Shape, slices: XY[][], index: number, segment = -1) {
    api.modifyPointHasTo(page, path_shape, index, true, segment);
    api.modifyPointHasFrom(page, path_shape, index, true, segment);
    api.shapeModifyCurvToPoint(page, path_shape, index, slices[0][2], segment);
    api.shapeModifyCurvFromPoint(page, path_shape, index, slices[1][1], segment);
}

export function after_insert_point(page: Page, api: Api, path_shape: Shape, index: number, segment = -1) {
    let __segment = segment;

    let points: CurvePoint[] = (path_shape as PathShape)?.pathsegs[segment]?.points;


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

export function __pre_curve(page: Page, api: Api, path_shape: Shape, index: number, segment = -1) {
    let point: CurvePoint | undefined = undefined;

    if (segment > -1) {
        point = (path_shape as PathShape2)?.pathsegs[segment].points[index];
    }

    if (!point) {
        return;
    }

    if (point.mode !== CurveMode.Mirrored) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Mirrored, segment);
    }
    init_curv(path_shape, page, api, point, index, 0.01, segment);
}

export function replace_path_shape_points(page: Page, shape: PathShape, api: Api, points: CurvePoint[]) {
    // todo
    // api.deletePoints(page, shape as PathShape, 0, shape.points.length);
    // for (let i = 0, len = points.length; i < len; i++) {
    //     const p = importCurvePoint((points[i]));
    //     p.id = v4();
    //     points[i] = p;
    // }
    // api.addPoints(page, shape as PathShape, points);
}

function _sort_after_clip(points: CurvePoint[], index: number) {
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

function after_clip(document: Document, page: Page, api: Api, path_shape: PathShape): number {
    // if (path_shape.points.length < 2) {
    //     const parent = path_shape.parent;
    //     if (!parent) {
    //         console.log('!parent');
    //         return 0;
    //     }
    //     const index = (parent as GroupShape).indexOfChild(path_shape);
    //     if (index < 0) {
    //         console.log('index < 0');
    //         return 0;
    //     }
    //     api.shapeDelete(document, page, parent as GroupShape, index);
    //     return 1;
    // }
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

function apartPathShape(document: Document, page: Page, api: Api, shape: Shape, index: number, segment = -1) {
    const __shape = shape as PathShape2;

    if (segment < 0) {
        return __shape;
    }

    const segments = __shape.pathsegs;
    const __seg = segments[segment];

    if (!__seg) {
        return __shape;
    }

    const points = __seg.points.map(i => importCurvePoint(exportCurvePoint(i)));
    const _idx = index + 1;
    const __points1 = new BasicArray<CurvePoint>(...points.slice(0, _idx));
    const __points2 = new BasicArray<CurvePoint>(...points.slice(_idx));

    __points1[0].hasTo = false;
    __points2[0].hasTo = false;

    __points1[__points1.length - 1].hasTo = false;
    __points2[__points2.length - 1].hasTo = false;

    let i = __seg.crdtidx[0];
    let si = segment;

    if (__points1.length > 1) {
        const s1 = new PathSegment([++i] as BasicArray<number>, uuid(), __points1, false);
        api.insertSegmentAt(page, __shape, ++si, s1);
    }
    if (__points2.length > 1) {
        const s2 = new PathSegment([++i] as BasicArray<number>, uuid(), __points2, false);
        api.insertSegmentAt(page, __shape, ++si, s2);
    }

    api.deleteSegmentAt(page, __shape, segment);

    return __shape;
}

export function _clip(document: Document, page: Page, api: Api, path_shape: Shape, index: number, segment: number) {
    // todo
    // if (path_shape.pathType === PathType.Editable) {
    //     const shape = path_shape as PathShape
    //     if (shape.isClosed) {
    //         api.setCloseStatus(page, path_shape, false);
    //         const points = _sort_after_clip(shape.points, index);
    //         replace_path_shape_points(page, shape, api, points);
    //         return path_shape;
    //     }
    //     const points = shape.points;
    //
    //     if (points.length < 3) {
    //         return shape;
    //     }
    //
    //     if (index === 0) {
    //         api.deletePoint(page, shape, index);
    //         after_clip(document, page, api, shape);
    //         return shape;
    //     }
    //     if (index === points.length - 2) {
    //         api.deletePoint(page, shape, points.length - 1);
    //         after_clip(document, page, api, shape);
    //         return shape;
    //     }
    //
    //     if (shape.type === ShapeType.Image) {
    //         return shape;
    //     }
    //
    //     return apartPathShape(document, page, api, shape, index, segment);
    // } else if (path_shape.pathType === PathType.Multi) {
    //     const shape = path_shape as PathShape2
    //     const __segment = shape.pathsegs[segment];
    //
    //     if (!__segment) {
    //         return shape;
    //     }
    //
    //     if (__segment.isClosed) {
    //         const crdtidx = __segment.crdtidx;
    //         const points = new BasicArray<CurvePoint>(..._sort_after_clip(__segment.points, index));
    //         const s = new PathSegment(crdtidx, uuid(), points, false);
    //         api.insertSegmentAt(page, shape, segment, s);
    //         api.deleteSegmentAt(page, shape, segment + 1);
    //         return shape;
    //     }
    //
    //     const points = __segment.points;
    //
    //     if (points.length < 3) {
    //         return shape;
    //     }
    //
    //     if (index === 0) {
    //         api.deletePoint(page, shape, index, segment);
    //         return shape;
    //     }
    //
    //     if (index === points.length - 2) {
    //         api.deletePoint(page, shape, points.length - 1, segment);
    //
    //         if (__segment.points.length < 2) {
    //             api.deleteSegmentAt(page, shape, segment);
    //         }
    //         return shape;
    //     }
    //
    //     return apartPathShape(document, page, api, shape, index, segment);
    // }
    return path_shape;
}

export function update_path_shape_frame(api: Api, page: Page, shapes: PathShape[]) {
    for (let i = 0, l = shapes.length; i < l; i++) {
        const shape = shapes[i];
        update_frame_by_points(api, page, shape);
    }
}

export function init_points(api: Api, page: Page, s: PathShape, points: CurvePoint[]) {
    // todo
    // api.deletePoints(page, s as PathShape, 0, s.points.length);
    // api.addPoints(page, s as PathShape, points);
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
    if (shape.isFlippedHorizontal) {
        dr = -dr;
    }
    if (shape.isFlippedVertical) {
        dr = -dr;
    }

    return (shape.rotation || 0) + dr;
}