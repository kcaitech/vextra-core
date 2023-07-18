import { PathShape } from "./shape";
import { CurveMode, Point2D } from "./typesdefine"

type CornerCalcInfo = {
    curPoint: Point2D;
    preTangent: Point2D;
    nextTangent: Point2D;
    preHandle: Point2D;
    nextHandle: Point2D;
};

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
export function parsePath(shape: PathShape, isClosed: boolean, offsetX: number, offsetY: number, width: number, height: number): any[] {
    let hasBegin = false;


    const len = shape.points.length;
    if (len < 2) return [];

    const cacheCornerCalcInfo: { [k: number]: CornerCalcInfo } = {};

    const path: any[] = []

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

    const transformPoint = (point: Point2D): Point2D => {
        return { x: offsetX + point.x * width, y: offsetY + point.y * height };
    }

    const transformedPoints = shape.points.map((p) => transformPoint(p.point));

    for (let i = 0; i < len - 1; i++) {
        _connectTwo(i, i + 1);
    }
    if (isClosed) {
        _connectTwo(len - 1, 0);
        closePath();
    }

    function _isCornerRadius(idx: number) {
        const curvePoint = shape.points[idx];
        if (!isClosed && (idx === 0 || idx === len - 1)) {
            return false;
        }
        return curvePoint.curveMode === CurveMode.Straight && curvePoint.cornerRadius > 0;
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
    function _getCornerInfo(idx: number): CornerCalcInfo {
        if (cacheCornerCalcInfo[idx]) {
            return cacheCornerCalcInfo[idx];
        }
        const preIndex = idx === 0 ? len - 1 : idx - 1;
        const nextIndex = idx === len - 1 ? 0 : idx + 1;
        const pre = shape.points[preIndex];
        const cur = shape.points[idx];
        const next = shape.points[nextIndex];
        // 拿到三个点
        const prePoint = transformedPoints[preIndex]; //pre.point; // A
        const curPoint = transformedPoints[idx]; //cur.point; // B
        const nextPoint = transformedPoints[nextIndex] //next.point; // C

        const lenAB = distanceTo(curPoint, prePoint);
        const lenBC = distanceTo(curPoint, nextPoint);

        // 三点之间的夹角
        const radian = calcAngleABC(prePoint, curPoint, nextPoint);

        let radius = cur.cornerRadius;
        // 计算相切的点距离 curPoint 的距离， 在 radian 为 90 deg 的时候和 radius 相等。
        const tangent = Math.tan(radian / 2);
        let dist = radius / tangent;

        // 校准 dist，用户设置的 cornerRadius 可能太大，而实际显示 cornerRadius 受到 AB BC 两边长度限制。
        // 如果 B C 端点设置了 cornerRadius，可用长度减半
        const minDist = Math.min(
            pre.curveMode === CurveMode.Straight && pre.cornerRadius > 0 ? lenAB / 2 : lenAB,
            next.curveMode === CurveMode.Straight && next.cornerRadius > 0 ? lenBC / 2 : lenBC
        );

        if (dist > minDist) {
            dist = minDist;
            radius = dist * tangent;
        }

        // 方向向量
        const vPre = norm(minus(prePoint, curPoint));
        const vNext = norm(minus(nextPoint, curPoint));

        // 相切的点
        const preTangent = add(multiply(vPre, dist), curPoint);
        const nextTangent = add(multiply(vNext, dist), curPoint);

        // 计算 cubic handler 位置
        const kappa = (4 / 3) * Math.tan((Math.PI - radian) / 4);

        const preHandle = add(multiply(vPre, -radius * kappa), preTangent);
        const nextHandle = add(multiply(vNext, -radius * kappa), nextTangent);

        cacheCornerCalcInfo[idx] = {
            curPoint,
            preTangent,
            nextTangent,
            preHandle,
            nextHandle,
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

        // 获取起始点信息
        if (_isCornerRadius(fromIdx)) {
            const { nextTangent } = _getCornerInfo(fromIdx);

            startPt = nextTangent;
        } else {
            const fromCurvePoint = shape.points[fromIdx];
            startPt = transformedPoints[fromIdx]
            startHandle = fromCurvePoint.hasCurveFrom ? fromCurvePoint.curveFrom : undefined;
            if (startHandle) startHandle = transformPoint(startHandle)
        }

        if (!hasBegin) {
            hasBegin = true;
            moveTo(startPt.x, startPt.y);
        }

        // 获取终点信息
        if (_isCornerRadius(toIdx)) {
            const { preTangent } = _getCornerInfo(toIdx);
            endPt = preTangent;
        } else {
            const toCurvePoint = shape.points[toIdx];
            endPt = transformedPoints[toIdx];
            endHandle = toCurvePoint.hasCurveTo ? toCurvePoint.curveTo : undefined;
            if (endHandle) endHandle = transformPoint(endHandle);
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
        if (_isCornerRadius(toIdx)) {
            const { nextTangent, preHandle, nextHandle } = _getCornerInfo(toIdx);
            bezierCurveTo(preHandle.x, preHandle.y, nextHandle.x, nextHandle.y, nextTangent.x, nextTangent.y);
        }
    }

    return path;
}
