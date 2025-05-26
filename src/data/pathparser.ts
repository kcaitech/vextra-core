/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { CurvePoint } from "./baseclasses";
import { Point2D } from "./typesdefine"
import { Path, PathBuilder } from "@kcdesign/path"

/**
 * @description 在t的位置切割曲线，得到两根曲线，这两根曲线若拼接会与原曲线轨迹一致
 */
export function splitCubicBezierAtT(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number) {
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

    function interpolate(p1: Point2D, p2: Point2D, t: number) {
        return {
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
        }
    }
}

/**
 * @description 曲线上t处的一点
 */
function bezierCurvePointAtT(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
    return {
        x: Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x,
        y: Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y
    };
}

/**
 * @description 二次曲线转三次曲线
 */
export function qua2cube(p0: Point2D, p1: Point2D, p2: Point2D) {
    const p3 = { x: p0.x / 3 + 2 * p1.x / 3, y: p0.y / 3 + 2 * p1.y / 3 }
    const p4 = { x: p2.x / 3 + 2 * p1.x / 3, y: p2.y / 3 + 2 * p1.y / 3 }
    return [p0, p3, p4, p2];
}

function getCubic(start: CurvePoint, end: CurvePoint): Point2D[] {
    if (start.hasFrom && end.hasTo) {
        return [
            start,
            { x: start.fromX ?? 0, y: start.fromY ?? 0 },
            { x: end.toX ?? 0, y: end.toY ?? 0 },
            end,
        ];
    } else if (start.hasFrom) {
        return qua2cube(start, { x: start.fromX ?? 0, y: start.fromY ?? 0 }, end);
    } else {
        return qua2cube(start, { x: end.toX ?? 0, y: end.toY ?? 0 }, end);
    }
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

// 二分法求解参数t
function findTByLength(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, targetLength: number, epsilon = 1e-5) {
    let t0 = 0;
    let t1 = 1;
    let t = 0.5;

    while (t0 <= t1) {
        const currentLength = bezierLength(p0, p1, p2, p3, t);

        if (Math.abs(currentLength - targetLength) < epsilon || Number.isNaN(currentLength)) return t;

        if (currentLength < targetLength) {
            t0 = t;
            t += (t1 - t) * 0.5;
        } else {
            t1 = t;
            t -= (t - t0) * 0.5;
        }
    }

    return null;
}

function distanceTo(p0: Point2D, p1: Point2D) {
    return Math.hypot(p0.x - p1.x, p0.y - p1.y);
}

function calcAngleABC(A: CurvePoint, B: CurvePoint, C: CurvePoint, size: { width: number, height: number }) {
    const a: Point2D = { x: (B.toX ?? A.x) * size.width, y: (B.toY ?? A.y) * size.height };
    const b: Point2D = { x: B.x * size.width, y: B.y * size.height };
    const c: Point2D = { x: (B.fromX ?? C.x) * size.width, y: (B.fromY ?? C.y) * size.height };
    const ab = distanceTo(a, b);
    const bc = distanceTo(b, c);
    const ac = distanceTo(c, a);
    return Math.acos((bc * bc + ab * ab - ac * ac) / (2 * bc * ab));
}

// 用向量表示坐标上的两个点
function norm(p: Point2D) {
    const d = Math.hypot(p.x, p.y);
    return { x: p.x / d, y: p.y / d };
}

// add、minus、multiply为向量运算
function add(p: Point2D, pt: Point2D) {
    return { x: p.x + pt.x, y: p.y + pt.y };
}
function minus(p0: Point2D, p1: Point2D): Point2D {
    return { x: p0.x - p1.x, y: p0.y - p1.y };
}
function multiply(p: Point2D, d: number): Point2D {
    return { x: p.x * d, y: p.y * d };
}

/**
 * @require 分析函数之前，需要熟悉路径的表示、二次三次贝塞尔曲线的表示、圆角的表示、向量、三角函数
 */
export function parsePath(points: CurvePoint[], isClosed: boolean, width: number, height: number, fixedRadius: number = 0): Path {
    const len = points.length;
    if (len < 2) return new Path();

    const radiusCache: { [k: number]: { radius: number, offset: number } } = {};
    const fromCache: { [k: number]: { apex: Point2D; handleForCorner: Point2D; curve?: Point2D[] } } = {};

    let hasBegin = false;

    const builder = new PathBuilder();
    const cubicTo = (handle1: Point2D, handle2: Point2D, end: Point2D) => {
        builder.cubicTo(end.x, end.y, handle1.x, handle1.y, handle2.x, handle2.y);
    }
    const moveTo = (x: number, y: number) => {
        builder.moveTo(x, y);
    }
    const lineTo = (x: number, y: number) => {
        builder.lineTo(x, y);
    }
    const closePath = () => {
        builder.close();
    }

    const transformPoint = (x: number, y: number): Point2D => ({ x: x * width, y: y * height });
    const transformedPoints = points.map((p) => transformPoint(p.x, p.y));

    for (let i = 0; i < len - 1; i++) connect(i, i + 1);

    if (isClosed) {
        connect(len - 1, 0);
        closePath();
    }

    function isRound(idx: number) {
        const curvePoint = points[idx];
        if (!isClosed && (idx === 0 || idx === len - 1)) return false;
        if (curvePoint.hasFrom && curvePoint.hasTo) return false;
        return !!(curvePoint.radius ?? fixedRadius);
    }

    function getBaseRadius(point: CurvePoint) {
        return point.radius ?? fixedRadius;
    }
    /**
     * corner radius 可能非常大，绘制的时候需要加以限制。
     * 1.1 如果一个 corner 另外两端都没有 corner，那么 cornerRadius 实际最大值，以两侧较短一侧为准。
     * 1.2 如果 corner 另外两端也有 corner，那么 cornerRadius 实际最大值，要以较短一侧一半为准。
     */
    function getRadiusInfo(idx: number) {
        if (radiusCache[idx]) return radiusCache[idx];
        const preIndex = idx === 0 ? len - 1 : idx - 1;
        const nextIndex = idx === len - 1 ? 0 : idx + 1;
        const pre = points[preIndex];
        const cur = points[idx];
        const next = points[nextIndex];
        const prePoint = transformedPoints[preIndex];
        const curPoint = transformedPoints[idx];
        const nextPoint = transformedPoints[nextIndex];
        const lenAB = distanceTo(curPoint, prePoint);
        const lenBC = distanceTo(curPoint, nextPoint);
        const radian = calcAngleABC(pre, cur, next, { width, height });
        if (Number.isNaN(radian)) return;
        // 计算相切的点距离 curPoint 的距离， 在 radian 为 90 deg 的时候和 radius 相等。
        const tangent = Math.tan(radian / 2);

        let radius = getBaseRadius(cur);
        let dist = radius / tangent;
        const minDist = (() => {
            const pr = getBaseRadius(pre);
            const nr = getBaseRadius(next);
            const percent1 = (radius + pr) > lenAB ? lenAB * (radius / (radius + pr)) : radius;
            const percent2 = (radius + nr) > lenBC ? lenBC * (radius / (radius + nr)) : radius;
            return Math.min(percent1, percent2);
        })();
        if (dist > minDist) {
            radius = minDist * tangent;
            dist = minDist;
        }
        const kappa = (4 / 3) * Math.tan((Math.PI - radian) / 4);
        radiusCache[idx] = { radius: dist, offset: radius * kappa };
        return radiusCache[idx];
    }

    function getFromInfo(idx: number) {
        if (fromCache[idx]) return fromCache[idx];
        const radiusInfo = getRadiusInfo(idx);
        if (!radiusInfo) return;
        const { radius, offset } = radiusInfo;
        const nextIndex = idx === len - 1 ? 0 : idx + 1;
        const cur = points[idx];
        const next = points[nextIndex];
        if (cur.hasFrom || next.hasTo) { // 存在曲线
            const [curPoint, handle1, handle2, nextPoint] = getCubic(cur, next).map(i => transformPoint(i.x, i.y));
            const fromT = findTByLength(curPoint, handle1, handle2, nextPoint, radius);
            if (!fromT) return;
            const apex = bezierCurvePointAtT(curPoint, handle1, handle2, nextPoint, fromT);
            const slices = splitCubicBezierAtT(curPoint, handle1, handle2, nextPoint, fromT);
            const handle = slices[0][2];
            const vec = norm(minus(handle, apex));                      // 方向为apex指向handle的向量
            const handleForCorner = add(multiply(vec, offset), apex);   // 以apex为起点，与vec的方向相同，大小为offset的向量(从apex出发，往handle的方向偏移offset)
            const curve = slices[1];
            fromCache[idx] = { apex, handleForCorner, curve };
            return fromCache[idx];
        } else {
            const curPoint = transformedPoints[idx];
            const nextPoint = transformedPoints[nextIndex];
            const vec = norm(minus(nextPoint, curPoint));               // 方向为cur指向next的向量
            const apex = add(multiply(vec, radius), curPoint);          // 以cur为起点与vec方向相同，大小为radius的向量，这个加法运算中vec起到指定方向的作用
            const handleForCorner = add(multiply(vec, -offset), apex);  // 以apex为起点，与vec的方向相反，大小为offset的向量
            fromCache[idx] = { apex, handleForCorner };
            return fromCache[idx];
        }
    }

    function getToInfo(idx: number, curve?: Point2D[]) {
        const radiusInfo = getRadiusInfo(idx);
        if (!radiusInfo) return;
        if (curve) {
            const splitT = findTByLength(curve[0], curve[1], curve[2], curve[3], radiusInfo.radius);
            if (!splitT) return;
            const apex = bezierCurvePointAtT(curve[0], curve[1], curve[2], curve[3], 1 - splitT,);
            const slices = splitCubicBezierAtT(curve[0], curve[1], curve[2], curve[3], 1 - splitT);
            curve.forEach((_, i) => curve[i] = slices[0][i]);
            const handle = slices[1][1];
            const vec = norm(minus(handle, apex));
            const handleForCorner = add(multiply(vec, radiusInfo.offset), apex);
            return { apex, handleForCorner };
        } else {
            const curPoint = transformedPoints[idx];
            const preIndex = idx === 0 ? len - 1 : idx - 1;
            const prePoint = transformedPoints[preIndex];

            const { radius, offset } = radiusInfo;
            const vec = norm(minus(prePoint, curPoint));
            const apex = add(multiply(vec, radius), curPoint);
            const handleForCorner = add(multiply(vec, -offset), apex);

            return { apex, handleForCorner };
        }
    }

    function connect(fromIdx: number, toIdx: number) {
        let start: Point2D;
        let startHandle: Point2D | undefined;
        let end: Point2D;
        let endHandle: Point2D | undefined;
        let curve: Point2D[] | undefined;

        let from;
        if (isRound(fromIdx) && (from = getFromInfo(fromIdx))) {
            curve = from.curve; // 如果存在曲线(from.hasFrom || to.hasTo)，from的圆角值会影响曲线的参数
            start = from.apex;  // from的圆角值会决定起点start
        } else {
            start = transformedPoints[fromIdx]; // 不存在圆角的情况下，起点start是固定的
            const fromCurvePoint = points[fromIdx];
            startHandle = fromCurvePoint.hasFrom ? transformPoint(fromCurvePoint.fromX ?? 0, fromCurvePoint.fromY ?? 0) : undefined;

            end = transformedPoints[toIdx];
            const toCurvePoint = points[toIdx];
            endHandle = toCurvePoint.hasTo ? transformPoint(toCurvePoint.toX ?? 0, toCurvePoint.toY ?? 0) : undefined;
            if (startHandle && endHandle) { // 存在三次曲线
                curve = [start, startHandle, endHandle, end];
            } else if (startHandle || endHandle) { // 存在二次曲线，转为三次
                curve = [...qua2cube(start, (startHandle || endHandle) as Point2D, end)];
            }
        }
        // 自此，会得到一个确定的起点start，有可能会得到一条曲线curve，这条曲线后续还可能受到终点圆角值的影响。

        if (!hasBegin) {
            hasBegin = true;
            moveTo(start.x, start.y);
        }

        let to;
        let handleForCorner: Point2D | undefined;
        if (isRound(toIdx) && (to = getToInfo(toIdx, curve))) {
            handleForCorner = to.handleForCorner;
            end = to.apex; // to的圆角值同样会影响终点end的取值，并且会影响曲线curve的参数
        } else {
            end = transformedPoints[toIdx];
        }
        // 自此，会得到一个终点end，有可能得到一条的曲线，这条曲线的参数都已经确定

        curve ? cubicTo(curve[1], curve[2], curve[3]) : lineTo(end.x, end.y);

        // 如果终点处存在圆角，从end出发，拼接一条曲线表示圆角
        let next;
        if (handleForCorner && (next = getFromInfo(toIdx))) cubicTo(handleForCorner, next.handleForCorner, next.apex);
    }

    return builder.getPath();
}

