/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Operator } from "../../operator/operator";
import { BorderPosition, CurveMode, ShapeType } from "../../data/typesdefine";
import { CurvePoint, PathShape, Point2D, Shape } from "../../data/shape";
import { Page } from "../../data/page";
import { v4 } from "uuid";
import { uuid } from "../../basic/uuid";
import { BasicArray } from "../../data/basic";
import { PathType } from "../../data/consts";
import { importCurvePoint } from "../../data/baseimport";
import { Border } from "../../data";
import { ColVector3D } from "../../basic/matrix2";
import { ShapeView } from "../../dataview";
import { Path } from "@kcaitech/path";
import { qua2cube, splitCubicBezierAtT } from "../../data/pathparser";
import { Transform } from "../../data/transform";

const minimum_WH = 1; // 用户可设置最小宽高值。以防止宽高在缩放后为0

export function update_frame_by_points(op: Operator, page: Page, s: PathShape, reLayout = false) {
    const box = s.boundingBox3();
    if (!box) return;

    const m = s.matrix2Root();

    const f = s.frame;
    const w = f.width;
    const h = f.height;

    const m1 = (s.matrix2Parent());
    m1.preScale(w, h);

    const targetWidth = Math.max(box.width, minimum_WH);
    const targetHeight = Math.max(box.height, minimum_WH);

    let frameChange = false;
    if (w !== targetWidth || h !== targetHeight) {
        op.shapeModifyWH(page, s, targetWidth, targetHeight);
        frameChange = true;
    }

    const rootXY = m.computeCoord3(box);
    const targetXY = s.parent!.matrix2Root().inverseCoord(rootXY);
    const dx = targetXY.x - s.transform.translateX;
    const dy = targetXY.y - s.transform.translateY;

    if (dx || dy) {
        op.shapeModifyTransform(page, s, ((s.transform.clone()).setTranslate(ColVector3D.FromXY(targetXY.x, targetXY.y))));
        frameChange = true;
    }

    if (!(frameChange || reLayout)) return; // 只有宽高被改变，才会需要重排2D points.

    const m3 = s.matrix2Parent();
    m3.preScale(s.size.width, s.size.height);
    m1.multiAtLeft(m3.inverse);

    (s as PathShape).pathsegs.forEach((segment, index) => exe(index, m1, segment.points));

    function exe(segment: number, m: Transform, points: CurvePoint[]) {
        if (!points || !points.length) return false;

        for (let i = 0, len = points.length; i < len; i++) {
            const p = points[i];
            if (!p) continue;

            if (p.hasFrom) {
                op.shapeModifyCurvFromPoint(page, s, i, m.computeCoord2(p.fromX || 0, p.fromY || 0), segment);
            }

            if (p.hasTo) {
                op.shapeModifyCurvToPoint(page, s, i, m.computeCoord2(p.toX || 0, p.toY || 0), segment);
            }

            op.shapeModifyCurvPoint(page, s, i, m.computeCoord2(p.x, p.y), segment);
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
export function bezierCurvePoint(t: number, p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D {
    return {
        x: Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x,
        y: Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y
    } as Point2D;
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

export function init_curve(order: 2 | 3, shape: Shape, page: Page, op: Operator, curve_point: CurvePoint, index: number, segmentIndex: number, init = (Math.sqrt(2) / 4)) {
    const __shape = shape as PathShape;
    const points = __shape.pathsegs[segmentIndex]?.points;

    if (!points?.length) return;

    const apex = getApex(points, index);

    if (!apex) return;

    const { from, to } = apex;

    if (order === 3) {
        op.shapeModifyCurvFromPoint(page, __shape, index, from, segmentIndex);
        op.shapeModifyCurvToPoint(page, __shape, index, to, segmentIndex);
        op.modifyPointHasFrom(page, __shape, index, true, segmentIndex);
        op.modifyPointHasTo(page, __shape, index, true, segmentIndex);
    } else {
        op.shapeModifyCurvFromPoint(page, __shape, index, from, segmentIndex);
        op.modifyPointHasFrom(page, __shape, index, true, segmentIndex);
    }

    function getApex(points: CurvePoint[], index: number) {
        const round = __round_curve_point(points, index);

        const { previous, next } = round;
        const minL = Math.min(Math.hypot(curve_point.x - next.x, curve_point.y - next.y), Math.hypot(curve_point.x - previous.x, curve_point.y - previous.y));
        const k = Math.atan2(next.x - previous.x, next.y - previous.y);
        const dx = minL * init * Math.sin(k);
        const dy = minL * init * Math.cos(k);
        const from = { x: curve_point.x + dx, y: curve_point.y + dy };
        const to = { x: curve_point.x - dx, y: curve_point.y - dy };

        return { from, to };
    }
}

export function init_straight(shape: PathShape, page: Page, op: Operator, index: number, segmentIndex: number) {
    op.shapeModifyCurvFromPoint(page, shape, index, { x: 0, y: 0 }, segmentIndex);
    op.shapeModifyCurvToPoint(page, shape, index, { x: 0, y: 0 }, segmentIndex);
    op.modifyPointHasFrom(page, shape, index, false, segmentIndex);
    op.modifyPointHasTo(page, shape, index, false, segmentIndex);
}

export function align_from(shape: PathShape, page: Page, op: Operator, curve_point: CurvePoint, index: number, segmentIndex: number) {
    if (curve_point.fromX === undefined || curve_point.fromY === undefined) {
        return;
    }
    const delta_x = 2 * curve_point.x - curve_point.fromX;
    const delta_y = 2 * curve_point.y - curve_point.fromY;
    op.shapeModifyCurvToPoint(page, shape, index, { x: delta_x, y: delta_y }, segmentIndex);
}

export function _typing_modify(shape: PathShape, page: Page, op: Operator, index: number, to_mode: CurveMode, segmentIndex: number) {
    let point: CurvePoint | undefined;

    point = (shape as PathShape)?.pathsegs[segmentIndex]?.points[index];

    if (!point) return;

    if (point.mode === CurveMode.Straight && to_mode !== CurveMode.Straight) {
        init_curve(3, shape, page, op, point, index, segmentIndex, (Math.sqrt(2) / 4));
        return;
    }

    if (point.mode === CurveMode.Mirrored && to_mode === CurveMode.Straight) {
        init_straight(shape, page, op, index, segmentIndex);
        return;
    }

    if (point.mode === CurveMode.Disconnected) {
        if (to_mode === CurveMode.Straight) {
            init_straight(shape, page, op, index, segmentIndex);
        } else if (to_mode === CurveMode.Mirrored || to_mode === CurveMode.Asymmetric) {
            align_from(shape, page, op, point, index, segmentIndex);
        }
        return;
    }

    if (point.mode === CurveMode.Asymmetric) {
        if (to_mode === CurveMode.Straight) {
            init_straight(shape, page, op, index, segmentIndex);
        } else if (to_mode === CurveMode.Mirrored) {
            align_from(shape, page, op, point, index, segmentIndex);
        }
    }
}

function is_curve(p: CurvePoint, n: CurvePoint) {
    return p.hasFrom || n.hasTo;
}

function get_curve(p: CurvePoint, n: CurvePoint) {
    const start = { x: p.x, y: p.y } as Point2D;
    const from = { x: 0, y: 0 } as Point2D;
    const to = { x: 0, y: 0 } as Point2D;
    const end = { x: n.x, y: n.y } as Point2D;

    if (p.hasFrom && n.hasTo) {
        from.x = p.fromX!;
        from.y = p.fromY!;
        to.x = n.toX!;
        to.y = n.toY!;
    } else if (p.hasFrom) {
        const curve = qua2cube(start, { x: p.fromX!, y: p.fromY! }, end);
        from.x = curve[1].x;
        from.y = curve[1].y;
        to.x = curve[2].x;
        to.y = curve[2].y;
    } else {
        const curve = qua2cube(start, { x: n.toX!, y: n.toY! }, end);
        from.x = curve[1].x;
        from.y = curve[1].y;
        to.x = curve[2].x;
        to.y = curve[2].y;
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

function modify_previous_from_by_slice(page: Page, op: Operator, path_shape: PathShape, slice: Point2D[], previous: CurvePoint, index: number, segmentIndex: number) {
    if (!previous.hasTo) {
        op.modifyPointHasFrom(page, path_shape, index, true, segmentIndex);
    }
    if (previous.mode === CurveMode.Straight) {
        op.modifyPointCurveMode(page, path_shape, index, CurveMode.Disconnected, segmentIndex);
    }
    if (previous.mode === CurveMode.Mirrored) {
        op.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric, segmentIndex);
    }
    op.shapeModifyCurvFromPoint(page, path_shape, index, slice[1], segmentIndex);
}

function modify_next_to_by_slice(page: Page, op: Operator, path_shape: PathShape, slice: Point2D[], next: CurvePoint, index: number, segmentIndex: number) {
    if (!next.hasTo) {
        op.modifyPointHasTo(page, path_shape, index, true, segmentIndex);
    }
    if (next.mode === CurveMode.Straight) {
        op.modifyPointCurveMode(page, path_shape, index, CurveMode.Disconnected, segmentIndex);
    }
    if (next.mode === CurveMode.Mirrored) {
        op.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric, segmentIndex);
    }
    op.shapeModifyCurvToPoint(page, path_shape, index, slice[2], segmentIndex);
}

function modify_current_handle_slices(page: Page, op: Operator, path_shape: PathShape, slices: Point2D[][], index: number, segmentIndex: number) {
    op.modifyPointHasTo(page, path_shape, index, true, segmentIndex);
    op.modifyPointHasFrom(page, path_shape, index, true, segmentIndex);
    op.shapeModifyCurvToPoint(page, path_shape, index, slices[0][2], segmentIndex);
    op.shapeModifyCurvFromPoint(page, path_shape, index, slices[1][1], segmentIndex);
}

export function after_insert_point(page: Page, op: Operator, path_shape: PathShape, index: number, segmentIndex: number, apex?: { xy: Point2D, t?: number }) {
    let __segment = segmentIndex;

    let points: CurvePoint[] = (path_shape as PathShape)?.pathsegs[segmentIndex]?.points;

    if (!points) return;

    const { previous, next, previous_index, next_index } = __round_curve_point(points, index);

    const xy = apex?.xy ?? get_node_xy_by_round(previous, next);
    op.shapeModifyCurvPoint(page, path_shape, index, xy, __segment);

    if (!is_curve(previous, next)) return;

    op.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric, __segment);
    const { start, from, to, end } = get_curve(previous, next);
    const slices = splitCubicBezierAtT(start, from, to, end, apex?.t ?? 0.5) as Point2D[][];
    modify_previous_from_by_slice(page, op, path_shape, slices[0], previous, previous_index, __segment);
    modify_next_to_by_slice(page, op, path_shape, slices[1], next, next_index, __segment);
    modify_current_handle_slices(page, op, path_shape, slices, index, __segment);
}

export function __pre_curve(order: 2 | 3, page: Page, op: Operator, path_shape: PathShape, index: number, segmentIndex: number) {
    let point: CurvePoint | undefined = undefined;

    point = (path_shape as PathShape)?.pathsegs[segmentIndex]?.points[index];

    if (!point) {
        return;
    }

    if (order === 3) {
        if (point.mode !== CurveMode.Mirrored) {
            op.modifyPointCurveMode(page, path_shape, index, CurveMode.Mirrored, segmentIndex);
        }
    } else {
        if (point.mode !== CurveMode.Disconnected) {
            op.modifyPointCurveMode(page, path_shape, index, CurveMode.Disconnected, segmentIndex);
        }
    }

    init_curve(order, path_shape, page, op, point, index, segmentIndex, 0.01);
}

export function replace_path_shape_points(page: Page, shape: PathShape, op: Operator, points: CurvePoint[]) {
    // todo 连接线相关操作
    op.deletePoints(page, shape as PathShape, 0, shape.pathsegs[0].points.length, 0);
    for (let i = 0, len = points.length; i < len; i++) {
        const p = importCurvePoint((points[i]));
        p.id = v4();
        points[i] = p;
    }
    op.addPoints(page, shape as PathShape, points, 0);
}

export function modify_points_xy(op: Operator, page: Page, s: PathShape, actions: {
    segment: number;
    index: number;
    x: number;
    y: number;
}[]) {
    let m = (s.matrix2Parent());
    const f = s.size;
    m.preScale(f.width, f.height);

    m = (m.inverse);

    if (s.pathType !== PathType.Editable) {
        return;
    }

    for (let i = 0, l = actions.length; i < l; i++) {
        const action = actions[i];
        const new_xy = m.computeCoord2(action.x, action.y);
        op.shapeModifyCurvPoint(page, s, action.index, new_xy, action.segment);
    }

    update_frame_by_points(op, page, s);
}

export function is_straight(shape: Shape) {
    if (!(shape instanceof PathShape || shape.type === ShapeType.Contact)) {
        return false;
    }

    const points = (shape as PathShape).pathsegs[0].points;

    return points.length === 2 && !points[0].hasFrom && !points[1].hasTo; // 两个点的，那就是直线
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

export function borders2path(shape: ShapeView, border: Border | undefined): Path {
    // 还要判断边框的位置
    let insidewidth = 0;
    let outsidewidth = 0;
    if (border) {
        const isEnabled = border.strokePaints.some(p => p.isEnabled);
        if (isEnabled) {
            const sideSetting = border.sideSetting;
            // todo
            const thickness = (sideSetting.thicknessBottom + sideSetting.thicknessLeft + sideSetting.thicknessTop + sideSetting.thicknessRight) / 4;
            if (border.position === BorderPosition.Center) {
                insidewidth = Math.max(insidewidth, thickness / 2);
                outsidewidth = Math.max(outsidewidth, thickness / 2);
            } else if (border.position === BorderPosition.Inner) {
                insidewidth = Math.max(insidewidth, thickness);
            } else if (border.position === BorderPosition.Outer) {
                outsidewidth = Math.max(outsidewidth, thickness);
            }
        }
    }

    if (insidewidth === 0 && outsidewidth === 0) return new Path();

    if (insidewidth === outsidewidth) {
        const path = shape.getPath();
        const p0 = path.clone()
        p0.stroke({ width: (insidewidth + outsidewidth) });
        return p0;
    }
    if (insidewidth === 0) {
        const path = shape.getPathStr();
        const p0 = Path.fromSVGString(path);
        const p1 = p0.clone();
        p0.stroke({ width: outsidewidth * 2 });
        p0.subtract(p1);
        return p0;
    } else if (outsidewidth === 0) {
        const path = shape.getPathStr();
        const p0 = Path.fromSVGString(path);
        const p1 = p0.clone();
        // p0.dash(10, 10, 1);
        p0.stroke({ width: insidewidth * 2 });
        p0.intersection(p1);
        return p0;
    } else {
        const path = shape.getPathStr();
        const p0 = Path.fromSVGString(path);
        const p1 = p0.clone();
        const p2 = p0.clone();

        p0.stroke({ width: insidewidth * 2 });
        p1.stroke({ width: outsidewidth * 2 });

        if (insidewidth > outsidewidth) {
            p0.intersection(p2);
        } else {
            p1.subtract(p2);
        }
        p0.union(p1);
        return p0;
    }
}