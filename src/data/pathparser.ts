import { CurvePoint } from "./baseclasses";
import { Point2D } from "./typesdefine"

type CornerCalcInfo = {
    curPoint: Point2D;
    preTangent: Point2D;
    nextTangent: Point2D;
    preHandle: Point2D;
    nextHandle: Point2D;
    preSlices: Point2D[][];
    nextSlices: Point2D[][];
};


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

/**
 * 另外关于 curvePoint
 * curveMode 默认 1， 应该表示没有 curve，直来直去
 *    只有 curveMode = 1 的时候，cornerRadius 才有效
 * curveMode 2, 表示 control point 是对称的，长度一样
 * curveMode 4, disconnected, control point 位置随意
 * curveMode 3, 也是对称，长度可以不一样
 */
export function parsePath(points: CurvePoint[], isClosed: boolean, width: number, height: number, fixedRadius: number = 0): (string | number)[][] {
    let hasBegin = false;


    const len = points.length;
    if (len < 2) return [];

    const cacheCornerCalcInfo: { [k: number]: CornerCalcInfo } = {};

    const path: (string | number)[][] = []

    const bezierCurveTo = (x1: number, y1: number, x2: number, y2: number, tx: number, ty: number) => {
        path.push(["C", x1, y1, x2, y2, tx, ty]);
    }
    const moveTo = (x: number, y: number) => {
        path.push(["M", x, y]);
    }
    const lineTo = (x: number, y: number) => {
        path.push(["L", x, y])
    }
    const closePath = () => {
        path.push(["Z"]);
    }

    const transformPoint = (x: number, y: number): Point2D => ({ x: x * width, y: y * height });

    const transformedPoints = points.map((p) => transformPoint(p.x, p.y));

    for (let i = 0; i < len - 1; i++) {
        _connectTwo(i, i + 1);
    }
    if (isClosed) {
        _connectTwo(len - 1, 0);
        closePath();
    }

    function _isCornerRadius(idx: number) {
        const curvePoint = points[idx];

        if (!isClosed && (idx === 0 || idx === len - 1)) {
            return false;
        }

        if (curvePoint.hasFrom || curvePoint.hasTo) {
            return false;
        }

        return ((curvePoint.radius || 0) > 0 || fixedRadius > 0);
    }

    /**
     * # Notice 1
     * sketch 可以设置并存储的 corner radius 可能非常大，绘制的时候需要加以限制。
     * 1.1 如果一个 corner 另外两端都没有 corner，那么 cornerRadius 实际最大值，以两侧较短一侧为准。
     * 1.2 如果 corner 另外两端也有 corner，那么 cornerRadius 实际最大值，要以较短一侧一半为准。
     *
     *
     * @param idx
     * @returns
     */
    function _getCornerInfo(idx: number): CornerCalcInfo | undefined {
        if (cacheCornerCalcInfo[idx]) {
            return cacheCornerCalcInfo[idx];
        }
        const preIndex = idx === 0 ? len - 1 : idx - 1;
        const nextIndex = idx === len - 1 ? 0 : idx + 1;

        const pre = points[preIndex];
        // if (pre.hasFrom && !pointEquals(pre.x, pre.y, pre.fromX || 0, pre.fromY || 0)) return;
        const cur = points[idx];
        const next = points[nextIndex];
        // if (next.hasTo && !pointEquals(next.x, next.y, next.toX || 0, next.toY || 0)) return;
        // 拿到三个点
        const prePoint = transformedPoints[preIndex]; //pre.point; // A
        const curPoint = transformedPoints[idx]; //cur.point; // B
        const nextPoint = transformedPoints[nextIndex] //next.point; // C

        const lenAB = distanceTo(curPoint, prePoint);
        const lenBC = distanceTo(curPoint, nextPoint);

        // 三点之间的夹角
        const radian = calcAngleABC(prePoint, curPoint, nextPoint);
        if (Number.isNaN(radian)) {
            return;
        }

        let radius = cur.radius || fixedRadius;
        // 计算相切的点距离 curPoint 的距离， 在 radian 为 90 deg 的时候和 radius 相等。
        const tangent = Math.tan(radian / 2);
        let dist = radius / tangent;

        // 校准 dist，用户设置的 cornerRadius 可能太大，而实际显示 cornerRadius 受到 AB BC 两边长度限制。
        // 如果 B C 端点设置了 cornerRadius，可用长度减半
        const minDist = Math.min(
            (pre.radius || fixedRadius) > 0 ? lenAB / 2 : lenAB,
            (next.radius || fixedRadius) > 0 ? lenBC / 2 : lenBC
        );

        if (dist > minDist) {
            dist = minDist;
            radius = dist * tangent;
        }

        // 方向向量
        const vPre = norm(minus(prePoint, curPoint));
        const vNext = norm(minus(nextPoint, curPoint));

        // 相切的点
        let preTangent = add(multiply(vPre, dist), curPoint);
        let nextTangent = add(multiply(vNext, dist), curPoint);

        // 计算 cubic handler 位置
        const kappa = (4 / 3) * Math.tan((Math.PI - radian) / 4);

        let preHandle = add(multiply(vPre, -radius * kappa), preTangent);
        let nextHandle = add(multiply(vNext, -radius * kappa), nextTangent);

        let preSlices: Point2D[][] = [];
        let nextSlices: Point2D[][] = [];

        if (pre.hasFrom) {
            const _p2 = transformPoint(pre.fromX || 0, pre.fromY || 0);
            const t = findTForLength(curPoint, curPoint, _p2, prePoint, dist);
            if (t !== null) {
                const nt = bezierCurvePoint(t, curPoint, curPoint, _p2, prePoint);
                preTangent = nt ? nt : preTangent;
                preSlices = splitCubicBezierAtT(curPoint, curPoint, _p2, prePoint, t);
                preHandle = preSlices[0][2];
            }
        }

        if (next.hasTo) {
            const _p2 = transformPoint(next.toX || 0, next.toY || 0);
            const t = findTForLength(curPoint, curPoint, _p2, nextPoint, dist);
            if (t !== null) {
                const nt = bezierCurvePoint(t, curPoint, curPoint, _p2, nextPoint);
                nextTangent = nt ? nt : nextTangent;
                nextSlices = splitCubicBezierAtT(curPoint, curPoint, _p2, nextPoint, t);
                nextHandle = nextSlices[0][2];
            }
        }

        cacheCornerCalcInfo[idx] = {
            curPoint,
            preTangent,
            nextTangent,
            preHandle,
            nextHandle,
            preSlices,
            nextSlices
        };

        return cacheCornerCalcInfo[idx];
    }

    // #####
    // curveFrom: 表示作为 from 点的时候的控制点
    // curveTo: 表示作为 to 点的时候的控制点
    // #####
    function _connectTwo(fromIdx: number, toIdx: number) {
        let startPt: Point2D;
        let startHandle: Point2D | undefined;

        let endPt: Point2D;
        let endHandle: Point2D | undefined;

        let cornerInfo;

        let nee_update_end_handle: boolean = true;

        // 获取起始点信息
        if (_isCornerRadius(fromIdx) && (cornerInfo = _getCornerInfo(fromIdx))) {
            const { nextTangent, nextSlices } = cornerInfo;
            startPt = nextTangent;
            if (nextSlices.length) {
                startHandle = nextSlices[1][1];
                endHandle = nextSlices[1][2];
            }
            nee_update_end_handle = false;
        } else {
            const fromCurvePoint = points[fromIdx];
            startPt = transformedPoints[fromIdx]
            startHandle = fromCurvePoint.hasFrom ? transformPoint(fromCurvePoint.fromX || 0, fromCurvePoint.fromY || 0) : undefined;
        }

        if (!hasBegin) {
            hasBegin = true;
            moveTo(startPt.x, startPt.y);
        }

        // 获取终点信息
        const isCorEnd = _isCornerRadius(toIdx);
        if (isCorEnd) {
            cornerInfo = _getCornerInfo(toIdx);
        }

        if (isCorEnd) {
            const { preTangent, preSlices } = cornerInfo as any;
            endPt = preTangent;
            if (preSlices.length) {
                startHandle = preSlices[1][2];
                endHandle = preSlices[1][1];
            }
        } else {
            const toCurvePoint = points[toIdx];
            endPt = transformedPoints[toIdx];
            if (nee_update_end_handle) {
                endHandle = toCurvePoint.hasTo ? transformPoint(toCurvePoint.toX || 0, toCurvePoint.toY || 0) : undefined;
            }
        }

        // 根据有没有 handle 选择 cubic 或者 line 连接
        if (startHandle || endHandle) {
            bezierCurveTo(
                startHandle?.x ?? startPt?.x,
                startHandle?.y ?? startPt.y,
                endHandle?.x ?? endPt.x,
                endHandle?.y ?? endPt.y,
                endPt.x,
                endPt.y
            );
        } else {
            lineTo(endPt.x, endPt.y);
        }

        // 如果 end 的时候是 corner，绘制圆角
        if (isCorEnd) {
            const { nextTangent, preHandle, nextHandle } = cornerInfo as any;
            bezierCurveTo(preHandle.x, preHandle.y, nextHandle.x, nextHandle.y, nextTangent.x, nextTangent.y);
        }
    }

    return path;
}

