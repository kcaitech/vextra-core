/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { float_accuracy } from "../basic/consts";
import { CurvePoint } from "./shape";
import { CurveMode, Point2D } from "./typesdefine"

function interpolate(p1: Point2D, p2: Point2D, t: number) {
    return {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t
    }
}

function splitCubicBezierAtT(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number) {
    const p01 = interpolate(p0, p1, t);
    const p12 = interpolate(p1, p2, t);
    const p23 = interpolate(p2, p3, t);

    const p012 = interpolate(p01, p12, t);
    const p123 = interpolate(p12, p23, t);

    const p0123 = interpolate(p012, p123, t);

    return [
        [p0, p01, p012, p0123],
        [p0123, p123, p23, p3]
    ];
}

function bezierCurvePoint(t: number, p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D {
    return {
        x: Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x,
        y: Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y
    };
}

// 计算三次贝塞尔曲线上某一点到起始点的长度
function bezierLength(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number) {
    const dx = 3 * (p1.x - p0.x);
    const dy = 3 * (p1.y - p0.y);
    const cx = 3 * (p2.x - p1.x) - dx;
    const cy = 3 * (p2.y - p1.y) - dy;
    const bx = p3.x - p0.x - dx - cx;
    const by = p3.y - p0.y - dy - cy;

    const x = t * (dx + t * (cx + t * bx));
    const y = t * (dy + t * (cy + t * by));

    return Math.sqrt(x * x + y * y);
}

// 通过二分法求解参数t
function findTForLength(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, targetLength: number, epsilon = 1e-5) {
    let t0 = 0;
    let t1 = 1;
    let t = 0.5;

    while (t0 <= t1) {
        const currentLength = bezierLength(p0, p1, p2, p3, t);

        if (Math.abs(currentLength - targetLength) < epsilon) {
            return t;
        }

        if (currentLength < targetLength) {
            t0 = t;
            t += (t1 - t) * 0.5;
        } else {
            t1 = t;
            t -= (t - t0) * 0.5;
        }
    }

    return null; // 如果未找到合适的参数t，返回null
}

// 寻找合适的贝塞尔曲线起点
function findCtrlPoint(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, radius: number) {
    const t = findTForLength(p0, p1, p2, p3, radius);
    if (t === null) {
        return t;
    }
    return bezierCurvePoint(t, p0, p1, p2, p3);
}

function distanceTo(p0: Point2D, p1: Point2D) {
    return Math.hypot(p0.x - p1.x, p0.y - p1.y);
}

function calcAngleABC(A: Point2D, B: Point2D, C: Point2D) {
    const AB = distanceTo(A, B);
    const BC = distanceTo(B, C);
    const AC = distanceTo(C, A);
    return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
}

function minus(p0: Point2D, p1: Point2D): Point2D {
    return { x: p0.x - p1.x, y: p0.y - p1.y };
}

function norm(p: Point2D) {
    const d = Math.hypot(p.x, p.y);
    // invariant(d !== 0, 'cant norm a vector whos len is zero');
    return { x: p.x / d, y: p.y / d };
}

function multiply(p: Point2D, d: number): Point2D {
    return { x: p.x * d, y: p.y * d };
}

function add(p: Point2D, pt: Point2D) {
    return { x: p.x + pt.x, y: p.y + pt.y };
}

function _is_corner_radius(points: CurvePoint[], idx: number, isClosed: boolean, fixedRadius: number) {
    const len = points.length;
    const curvePoint = points[idx];

    if (!isClosed && (idx === 0 || idx === len - 1)) {
        return false;
    }

    if (curvePoint.hasFrom || curvePoint.hasTo) {
        return false;
    }

    return (curvePoint.radius || 0) > 0 || fixedRadius > 0;
}

function transformPoint(x: number, y: number, offsetX: number, offsetY: number, width: number, height: number): Point2D {
    return { x: offsetX + x * width, y: offsetY + y * height };
}

interface Segment {
    type: 'straight' | 'curve'
    start: Point2D;
    handle1: Point2D;
    handle2: Point2D;
    end: Point2D;
    needCorner: boolean
}

function modify_segment_for_straight_to_curve(segment: Segment, points: CurvePoint[], from_index: number, isClosed: boolean, fixedRadius: number) {
    if (!_is_corner_radius(points, from_index, isClosed, fixedRadius)) {
        return;
    }

    const fromCurvePoint = points[from_index];
    const l = fixedRadius || fromCurvePoint.radius || 0;
    if (!l) {
        return;
    }

    const { start, handle2, end } = segment;
    const t = findTForLength(start, start, handle2, end, l);
    if (t === null) {
        return;
    }
    const slices = splitCubicBezierAtT(start, start, handle2, end, t);
    segment.start = slices[1][0];
    segment.handle1 = slices[1][1];
    segment.handle2 = slices[1][2];
    segment.end = slices[1][3];
}

/**
 * @description 只需要处理起点部分的圆角，根据圆角大小移动自己的起点
 */
function from_straight_to_curve(
    from_index: number,
    to_index: number,
    points: CurvePoint[],
    transformed_points: Point2D[],
    isClosed: boolean,
    fixedRadius: number,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
) {
    const toCurvePoint = points[to_index];

    const start = transformed_points[from_index];
    const handle2 = transformPoint(toCurvePoint.toX || 0, toCurvePoint.toY || 0, offsetX, offsetY, width, height);
    const end = transformed_points[to_index];

    const segment: Segment = {
        type: 'curve',
        start,
        handle1: start,
        handle2,
        end,
        needCorner: false
    }
    modify_segment_for_straight_to_curve(segment, points, from_index, isClosed, fixedRadius);
    return segment;
}

/**
 * @description 两头都是曲线，不需要处理圆角
 */
function from_curve_to_curve(
    from_index: number,
    to_index: number,
    points: CurvePoint[],
    transformed_points: Point2D[],
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
): Segment {
    const fromCurvePoint = points[from_index];
    const toCurvePoint = points[to_index];

    const start = transformed_points[from_index];
    const handle1 = transformPoint(fromCurvePoint.fromX || 0, fromCurvePoint.fromY || 0, offsetX, offsetY, width, height);
    const handle2 = transformPoint(toCurvePoint.toX || 0, toCurvePoint.toY || 0, offsetX, offsetY, width, height);
    const end = transformed_points[to_index];

    return {
        type: 'curve',
        start,
        handle1,
        handle2,
        end,
        needCorner: false
    }
}
function modify_segment_for_straight_to_straight(segment: Segment, points: CurvePoint[], from_index: number, to_index: number, isClosed: boolean, fixedRadius: number) {
    const __L = Math.hypot(segment.end.x - segment.start.x, segment.end.y - segment.start.y);

    if (_is_corner_radius(points, from_index, isClosed, fixedRadius)) {
        const toCurvePoint = points[to_index];
        const l = fixedRadius || toCurvePoint.radius || 0;
        if (l) {
            const ratio = 1 - l / __L;
            if (0 < ratio && ratio < 1) {
                segment.needCorner = true;
                const s = segment.start;
                const e = segment.end;
                segment.end.x = s.x + (e.x - s.x) * ratio;
                segment.end.y = s.y + (e.y - s.y) * ratio;
            }
        }
    }

    if (!_is_corner_radius(points, from_index, isClosed, fixedRadius)) {
        return;
    }
    const fromCurvePoint = points[from_index];
    const l = fixedRadius || fromCurvePoint.radius || 0;
    if (!l) {
        return;
    }
    const ratio = l / __L;
    if (0 < ratio && ratio < 1) {
        const s = segment.start;
        const e = segment.end;
        segment.start.x = s.x + (e.x - s.x) * ratio;
        segment.start.y = s.y + (e.y - s.y) * ratio;
    }
}

function from_straight_to_straight(
    from_index: number,
    to_index: number,
    points: CurvePoint[],
    transformed_points: Point2D[],
    isClosed: boolean,
    fixedRadius: number,
) {
    const start = transformed_points[from_index];
    const end = transformed_points[to_index];

    const segment: Segment = {
        type: 'straight',
        start,
        handle1: start,
        handle2: end,
        end,
        needCorner: false
    }
    modify_segment_for_straight_to_straight(segment, points, from_index, to_index, isClosed, fixedRadius)
    return segment;
}
function modify_segment_for_curve_to_straight(segment: Segment, points: CurvePoint[], to_index: number, isClosed: boolean, fixedRadius: number) {
    if (!_is_corner_radius(points, to_index, isClosed, fixedRadius)) {
        return;
    }
    const toCurvePoint = points[to_index];
    const l = fixedRadius || toCurvePoint.radius || 0;
    if (!l) {
        return;
    }
    const { start, handle1, end } = segment;
    const t = findTForLength(end, end, handle1, start, l);
    if (t === null) {
        return;
    }

    const slices = splitCubicBezierAtT(end, end, handle1, start, t);
    segment.handle2 = slices[1][1];
    segment.end = slices[1][0];
    segment.needCorner = true;
}
function from_curve_to_straight(
    from_index: number,
    to_index: number,
    points: CurvePoint[],
    transformed_points: Point2D[],
    offsetX: number,
    offsetY: number,
    width: number,
    height: number,
    isClosed: boolean,
    fixedRadius: number
) {
    const fromCurvePoint = points[from_index];

    const start = transformed_points[from_index];
    const handle1 = transformPoint(fromCurvePoint.fromX || 0, fromCurvePoint.fromY || 0, offsetX, offsetY, width, height);
    const end = transformed_points[to_index];

    const segment: Segment = {
        type: 'curve',
        start,
        handle1,
        handle2: end,
        end,
        needCorner: false
    }
    modify_segment_for_curve_to_straight(segment, points, to_index, isClosed, fixedRadius);

    return segment;
}
const bezierCurveTo = (path: any[], x1: number, y1: number, x2: number, y2: number, tx: number, ty: number) => {
    path.push(["C", x1, y1, x2, y2, tx, ty]);
}
const moveTo = (path: any[], x: number, y: number) => {
    path.push(["M", x, y]);
}
const lineTo = (path: any[], x: number, y: number) => {
    path.push(["L", x, y])
}
const closePath = (path: any[]) => {
    path.push(["Z"]);
}
/**
 * 另外关于 curvePoint
 * curveMode 默认 1， 应该表示没有 curve，直来直去
 *    只有 curveMode = 1 的时候，cornerRadius 才有效
 * curveMode 2, 表示 control point 是对称的，长度一样
 * curveMode 4, disconnected, control point 位置随意
 * curveMode 3, 也是对称，长度可以不一样
 */
export function parsePath(points: CurvePoint[], isClosed: boolean, offsetX: number, offsetY: number, width: number, height: number, fixedRadius: number = 0): any[] {
    const len = points.length;
    if (len < 2) return [];

    const segments: Segment[] = [];
    const path: any[] = [];



    const transformPoint = (x: number, y: number): Point2D => {
        return { x: offsetX + x * width, y: offsetY + y * height };
    }

    const transformedPoints = points.map((p) => transformPoint(p.x, p.y));

    function _connectTwo(fromIdx: number, toIdx: number) {
        const fromCurvePoint = points[fromIdx];
        const toCurvePoint = points[toIdx];
        if (fromCurvePoint.mode === CurveMode.Straight && toCurvePoint.hasTo) {
            segments.push(from_straight_to_curve(fromIdx, toIdx, points, transformedPoints, isClosed, fixedRadius, offsetX, offsetY, width, height));
            return;
        }
        if (fromCurvePoint.hasFrom && toCurvePoint.hasTo) {
            segments.push(from_curve_to_curve(fromIdx, toIdx, points, transformedPoints, offsetX, offsetY, width, height));
            return;
        }
        if (fromCurvePoint.mode === CurveMode.Straight && toCurvePoint.mode === CurveMode.Straight) {
            segments.push(from_straight_to_straight(fromIdx, toIdx, points, transformedPoints, isClosed, fixedRadius));
            return;
        }
        if (fromCurvePoint.hasFrom && toCurvePoint.mode === CurveMode.Straight) {
            segments.push(from_curve_to_straight(fromIdx, toIdx, points, transformedPoints, offsetX, offsetY, width, height, isClosed, fixedRadius));
        }
    }
    function segments_to_path() {
        if (!segments.length) {
            console.log('segments_to_path: !segments.length');
            return;
        }

        const startPt = segments[0].start;
        moveTo(path, startPt.x, startPt.y);

        for (let i = 0, l = segments.length; i < l; i++) {
            const seg = segments[i];
            const { type, start, handle1, handle2, end, needCorner } = seg;
            if (type === 'curve') {
                bezierCurveTo(path, handle1.x, handle1.y, handle2.x, handle2.y, end.x, end.y);
            } else {
                lineTo(path, end.x, end.y);
            }
        }

        if (isClosed) {
            closePath(path);
        }
    }

    for (let i = 0; i < len - 1; i++) {
        _connectTwo(i, i + 1);
    }

    if (isClosed) {
        _connectTwo(len - 1, 0);
    }

    segments_to_path();

    return path;
}
