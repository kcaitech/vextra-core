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