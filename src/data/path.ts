import { uuid } from "../basic/uuid";
import { Matrix } from "../basic/matrix";
import { CurveMode, CurvePoint, Point2D } from "./baseclasses";
import { float_accuracy } from "../basic/consts";

// ----------------------------------------------------------------------------------
// transform
const transfromHandler: { [key: string]: (m: Matrix, item: any[]) => void } = {}
function transformAbsPoint(m: Matrix, x: number, y: number): { x: number, y: number } {
    return m.computeCoord(x, y)
}
function transfromRefPoint(m: Matrix, dx: number, dy: number): { x: number, y: number } {
    const xy = m.computeCoord(dx, dy)
    xy.x -= m.m02;
    xy.y -= m.m12;
    return xy;
}
function transformPoint(m: Matrix, item: any[]) {
    const xy = transformAbsPoint(m, item[1], item[2])
    item[1] = xy.x;
    item[2] = xy.y;
}
function transformRef(m: Matrix, item: any[]) {
    const xy = transfromRefPoint(m, item[1], item[2])
    item[1] = xy.x;
    item[2] = xy.y;
}
transfromHandler['M'] = transformPoint;
transfromHandler['m'] = transformRef;
transfromHandler['L'] = transformPoint;
transfromHandler['l'] = transformRef;
transfromHandler['A'] = function (m: Matrix, item: any[]) {
    // todo
    // (rx ry x-axis-rotation large-arc-flag sweep-flag x y)
    let xy = transfromRefPoint(m, item[1], item[2])
    item[1] = xy.x;
    item[2] = xy.y;
    xy = transformAbsPoint(m, item[6], item[7])
    item[6] = xy.x;
    item[7] = xy.y;
}
transfromHandler['a'] = function (m: Matrix, item: any[]) {
    // todo
    let xy = transfromRefPoint(m, item[1], item[2])
    item[1] = xy.x;
    item[2] = xy.y;
    xy = transfromRefPoint(m, item[6], item[7])
    item[6] = xy.x;
    item[7] = xy.y;
}

transfromHandler['H'] = function (m: Matrix, item: any[]) {
    const xy = transformAbsPoint(m, item[1], 0)
    item[1] = xy.x;
}
transfromHandler['h'] = function (m: Matrix, item: any[]) {
    const xy = transfromRefPoint(m, item[1], 0)
    item[1] = xy.x;
}
transfromHandler['V'] = function (m: Matrix, item: any[]) {
    const xy = transformAbsPoint(m, 0, item[1])
    item[1] = xy.y;
}
transfromHandler['v'] = function (m: Matrix, item: any[]) {
    const xy = transfromRefPoint(m, 0, item[1])
    item[1] = xy.y;
}
transfromHandler['C'] = function (m: Matrix, item: any[]) {
    // C x1 y1, x2 y2, x y
    let xy;
    xy = transformAbsPoint(m, item[1], item[2])
    item[1] = xy.x;
    item[2] = xy.y;
    xy = transformAbsPoint(m, item[3], item[4])
    item[3] = xy.x;
    item[4] = xy.y;
    xy = transformAbsPoint(m, item[5], item[6])
    item[5] = xy.x;
    item[6] = xy.y;
}
transfromHandler['c'] = function (m: Matrix, item: any[]) {
    // c dx1 dy1, dx2 dy2, dx dy
    let xy;
    xy = transfromRefPoint(m, item[1], item[2])
    item[1] = xy.x;
    item[2] = xy.y;
    xy = transfromRefPoint(m, item[3], item[4])
    item[3] = xy.x;
    item[4] = xy.y;
    xy = transfromRefPoint(m, item[5], item[6])
    item[5] = xy.x;
    item[6] = xy.y;
}
transfromHandler['Z'] = function (m: Matrix, item: any[]) {
}
transfromHandler['z'] = function (m: Matrix, item: any[]) {
}
/**
 * 
 * @param matrix
 */
function transformPath(matrix: Matrix) {
    return (item: any[]) => {
        transfromHandler[item[0]](matrix, item)
        return item;
    }
}


const translateHandler: { [key: string]: (item: any[], x: number, y: number) => void } = {}

translateHandler['M'] = function (item: any[], x: number, y: number) {
    item[1] += x;
    item[2] += y;
}
translateHandler['m'] = function (item: any[], x: number, y: number) {
    //
}
translateHandler['L'] = function (item: any[], x: number, y: number) {
    item[1] += x;
    item[2] += y;
}
translateHandler['l'] = function (item: any[], x: number, y: number) {
    //
}
translateHandler['A'] = function (item: any[], x: number, y: number) {
    // todo
    // (rx ry x-axis-rotation large-arc-flag sweep-flag x y)
    item[6] += x;
    item[7] += y;
}
translateHandler['a'] = function (item: any[], x: number, y: number) {
    //
}

translateHandler['H'] = function (item: any[], x: number, y: number) {
    item[1] += x;
}
translateHandler['h'] = function (item: any[], x: number, y: number) {
    //
}
translateHandler['V'] = function (item: any[], x: number, y: number) {
    item[1] += y;
}
translateHandler['v'] = function (item: any[], x: number, y: number) {
    //
}
translateHandler['C'] = function (item: any[], x: number, y: number) {
    // C x1 y1, x2 y2, x y
    item[1] += x;
    item[2] += y;
    item[3] += x;
    item[4] += y;
    item[5] += x;
    item[6] += y;
}
translateHandler['c'] = function (item: any[], x: number, y: number) {
    // c dx1 dy1, dx2 dy2, dx dy
}
translateHandler['Z'] = function (item: any[], x: number, y: number) {
}
translateHandler['z'] = function (item: any[], x: number, y: number) {
}

function translatePath(x: number, y: number) {
    return (item: any[]) => {
        translateHandler[item[0]](item, x, y)
        return item;
    }
}

// ----------------------------------------------------------------------------------
// bounds

type Bounds = {
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
}

/**
 * expand the x-bounds, if the value lies outside the bounding box
 */
function expandXBounds(bounds: Bounds, value: number) {
    if (bounds.minX > value) bounds.minX = value;
    else if (bounds.maxX < value) bounds.maxX = value;
}

/**
 * expand the y-bounds, if the value lies outside the bounding box
 */
function expandYBounds(bounds: Bounds, value: number) {
    if (bounds.minY > value) bounds.minY = value;
    else if (bounds.maxY < value) bounds.maxY = value;
}

/**
 * Calculate the bezier value for one dimension at distance 't'
 */
function calculateBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
    const mt = 1 - t;
    return (mt * mt * mt * p0) + (3 * mt * mt * t * p1) + (3 * mt * t * t * p2) + (t * t * t * p3);
}

/**
 * Calculate the bounding box for this bezier curve.
 * http://pomax.nihongoresources.com/pages/bezier/
 */
function canculateBoundingBox(x1: number, y1: number,
    cx1: number, cy1: number,
    cx2: number, cy2: number,
    x2: number, y2: number) {
    const bounds: Bounds = { minX: Math.min(x1, x2), minY: Math.min(y1, y2), maxX: Math.max(x1, x2), maxY: Math.max(y1, y2) };

    const dcx0 = cx1 - x1;
    const dcy0 = cy1 - y1;
    const dcx1 = cx2 - cx1;
    const dcy1 = cy2 - cy1;
    const dcx2 = x2 - cx2;
    const dcy2 = y2 - cy2;

    if (cx1 < bounds.minX || cx1 > bounds.maxX || cx2 < bounds.minX || cx2 > bounds.maxX) {
        // Just for better reading because we are doing middle school math here
        let a = dcx0;
        let b = dcx1;
        let c = dcx2;

        if (a + c !== 2 * b) b += 0.0001;

        const numerator = 2 * (a - b);
        let denominator = 2 * (a - 2 * b + c);
        if (denominator === 0) denominator = 0.0001;
        const quadroot = (2 * b - 2 * a) * (2 * b - 2 * a) - 2 * a * denominator;
        const root = Math.sqrt(quadroot);

        const t1 = (numerator + root) / denominator;
        const t2 = (numerator - root) / denominator;

        if (0 < t1 && t1 < 1) {
            expandXBounds(bounds, calculateBezier(t1, x1, cx1, cx2, x2));
        }
        if (0 < t2 && t2 < 1) {
            expandXBounds(bounds, calculateBezier(t2, x1, cx1, cx2, x2));
        }
    }

    if (cy1 < bounds.minY || cy1 > bounds.maxY || cy2 < bounds.minY || cy2 > bounds.maxY) {
        let a = dcy0;
        let b = dcy1;
        let c = dcy2;

        if (a + c !== 2 * b) b += 0.0001;

        const numerator = 2 * (a - b);
        let denominator = 2 * (a - 2 * b + c);
        if (denominator === 0) denominator = 0.0001;
        const quadroot = (2 * b - 2 * a) * (2 * b - 2 * a) - 2 * a * denominator;
        const root = Math.sqrt(quadroot);

        const t1 = (numerator + root) / denominator;
        const t2 = (numerator - root) / denominator;

        if (0 < t1 && t1 < 1) {
            expandYBounds(bounds, calculateBezier(t1, y1, cy1, cy2, y2));
        }
        if (0 < t2 && t2 < 1) {
            expandYBounds(bounds, calculateBezier(t2, y1, cy1, cy2, y2));
        }
    }
    return bounds;
    // return [
    //     bounds.minX, bounds.minY,
    //     bounds.minX, bounds.maxY,
    //     bounds.maxX, bounds.maxY,
    //     bounds.maxX, bounds.minY,
    // ];
}

// ----------------------------------------------------------------------------------
// arc to bezier
const PI2 = Math.PI * 2;

function mapToEllipse(x: number, y: number, rx: number, ry: number, cosphi: number, sinphi: number, centerx: number, centery: number) {
    x *= rx;
    y *= ry;

    const xp = cosphi * x - sinphi * y;
    const yp = sinphi * x + cosphi * y;

    return {
        x: xp + centerx,
        y: yp + centery
    };
}

function approxUnitArc(ang1: number, ang2: number) {
    const a = 4 / 3 * Math.tan(ang2 / 4);

    const x1 = Math.cos(ang1);
    const y1 = Math.sin(ang1);
    const x2 = Math.cos(ang1 + ang2);
    const y2 = Math.sin(ang1 + ang2);

    return [
        {
            x: x1 - y1 * a,
            y: y1 + x1 * a
        },
        {
            x: x2 + y2 * a,
            y: y2 - x2 * a
        },
        {
            x: x2,
            y: y2
        }
    ];
}

function vectorAngle(ux: number, uy: number, vx: number, vy: number) {
    const sign = (ux * vy - uy * vx < 0) ? -1 : 1;
    const umag = Math.sqrt(ux * ux + uy * uy);
    const vmag = Math.sqrt(ux * ux + uy * uy);
    const dot = ux * vx + uy * vy;

    let div = dot / (umag * vmag);

    if (div > 1) div = 1;
    if (div < -1) div = -1;

    return sign * Math.acos(div);
}

function getArcCenter(px: number, py: number, cx: number, cy: number, rx: number, ry: number, largeArcFlag: number, sweepFlag: number, sinphi: number, cosphi: number, pxp: number, pyp: number) {
    const rxsq = Math.pow(rx, 2);
    const rysq = Math.pow(ry, 2);
    const pxpsq = Math.pow(pxp, 2);
    const pypsq = Math.pow(pyp, 2);

    let radicant = (rxsq * rysq) - (rxsq * pypsq) - (rysq * pxpsq);

    if (radicant < 0) radicant = 0;

    radicant /= (rxsq * pypsq) + (rysq * pxpsq);
    radicant = Math.sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1);

    const centerxp = radicant * rx / ry * pyp;
    const centeryp = radicant * -ry / rx * pxp;

    const centerx = cosphi * centerxp - sinphi * centeryp + (px + cx) / 2;
    const centery = sinphi * centerxp + cosphi * centeryp + (py + cy) / 2;

    const vx1 = (pxp - centerxp) / rx;
    const vy1 = (pyp - centeryp) / ry;
    const vx2 = (-pxp - centerxp) / rx;
    const vy2 = (-pyp - centeryp) / ry;

    const ang1 = vectorAngle(1, 0, vx1, vy1);
    let ang2 = vectorAngle(vx1, vy1, vx2, vy2);

    if (sweepFlag === 0 && ang2 > 0) {
        ang2 -= PI2;
    }

    if (sweepFlag === 1 && ang2 < 0) {
        ang2 += PI2;
    }

    return [centerx, centery, ang1, ang2];
}

// credit to https://github.com/colinmeinke/svg-arc-to-cubic-bezier
function arcToBezier(lastPoint: { x: number, y: number }, arcParams: number[]) {
    const px = lastPoint.x; // prevX
    const py = lastPoint.y; // prevY
    const cx = arcParams[5]; // currX
    const cy = arcParams[6]; // currY
    let rx = arcParams[0];
    let ry = arcParams[1];
    const xAxisRotation = arcParams[2];
    const largeArcFlag = arcParams[3];
    const sweepFlag = arcParams[4];

    const curves = [];

    if (rx === 0 || ry === 0) {
        return null;
    }

    const sinphi = Math.sin(xAxisRotation * Math.PI / 180);
    const cosphi = Math.cos(xAxisRotation * Math.PI / 180);

    const pxp = cosphi * (px - cx) / 2 + sinphi * (py - cy) / 2;
    const pyp = -sinphi * (px - cx) / 2 + cosphi * (py - cy) / 2;

    if (pxp === 0 && pyp === 0) return null;

    const lambda = Math.pow(pxp, 2) / Math.pow(rx, 2) + Math.pow(pyp, 2) / Math.pow(ry, 2);
    if (lambda > 1) {
        rx *= Math.sqrt(lambda);
        ry *= Math.sqrt(lambda);
    }

    const arcCenter = getArcCenter(px, py, cx, cy, rx, ry, largeArcFlag, sweepFlag, sinphi, cosphi, pxp, pyp);
    const centerx = arcCenter[0];
    const centery = arcCenter[1];
    let ang1 = arcCenter[2];
    let ang2 = arcCenter[3];

    const segments = Math.max(Math.ceil(Math.abs(ang2) / (PI2 / 4)), 1);

    ang2 /= segments;

    for (let i = 0; i < segments; i++) {
        curves.push(approxUnitArc(ang1, ang2));
        ang1 += ang2;
    }

    return curves.map(function (curve) {
        const m1 = mapToEllipse(curve[0].x, curve[0].y, rx, ry, cosphi, sinphi, centerx, centery);
        const m2 = mapToEllipse(curve[1].x, curve[1].y, rx, ry, cosphi, sinphi, centerx, centery);
        const m = mapToEllipse(curve[2].x, curve[2].y, rx, ry, cosphi, sinphi, centerx, centery);

        return [m1.x, m1.y, m2.x, m2.y, m.x, m.y];
    });
}

// ----------------------------------------------------------------------------------
// 将路径中的相对值转换为绝对坐标
type BoundsCtx = { beginpoint: { x: number, y: number }, prepoint: { x: number, y: number }, bounds: Bounds, boundsinited: boolean }

const boundsHandler: { [key: string]: (ctx: BoundsCtx, item: any[]) => void } = {}

function expandBounds(ctx: BoundsCtx, x: number, y: number) {
    if (!ctx.boundsinited) {
        ctx.boundsinited = true;
        ctx.bounds.minX = ctx.bounds.maxX = ctx.prepoint.x;
        ctx.bounds.minY = ctx.bounds.maxY = ctx.prepoint.y;
    }
    else {
        expandXBounds(ctx.bounds, x);
        expandYBounds(ctx.bounds, y);
    }
}

boundsHandler['M'] = (ctx: BoundsCtx, item: any[]) => {
    const x = item[1];
    const y = item[2];
    ctx.beginpoint.x = x;
    ctx.beginpoint.y = y;
    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}
boundsHandler['m'] = (ctx: BoundsCtx, item: any[]) => {
    const x = ctx.prepoint.x + item[1];
    const y = ctx.prepoint.y + item[2];
    ctx.beginpoint.x = x;
    ctx.beginpoint.y = y;
    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}
boundsHandler['L'] = (ctx: BoundsCtx, item: any[]) => {
    const x = item[1];
    const y = item[2];
    expandBounds(ctx, ctx.prepoint.x, ctx.prepoint.y);
    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}
boundsHandler['l'] = (ctx: BoundsCtx, item: any[]) => {
    const x = ctx.prepoint.x + item[1];
    const y = ctx.prepoint.y + item[2];
    expandBounds(ctx, ctx.prepoint.x, ctx.prepoint.y);
    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}
boundsHandler['A'] = (ctx: BoundsCtx, item: any[]) => {
    // (rx ry x-axis-rotation large-arc-flag sweep-flag x y)
    const x = item[6];
    const y = item[7];

    const curves = arcToBezier(ctx.prepoint, item.slice(1))
    if (curves) for (let i = 0, len = curves.length; i < len; i++) {
        // C x1 y1, x2 y2, x y
        item = ['C', ...curves[i]]
        const x = item[5];
        const y = item[6];
        const x1 = item[1];
        const y1 = item[2];
        const x2 = item[3];
        const y2 = item[4];
        const bounds = canculateBoundingBox(ctx.prepoint.x, ctx.prepoint.y, x1, y1, x2, y2, x, y);
        expandBounds(ctx, bounds.minX, bounds.minY)
        expandBounds(ctx, bounds.maxX, bounds.maxY)
    }

    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}
boundsHandler['a'] = (ctx: BoundsCtx, item: any[]) => {
    // (rx ry x-axis-rotation large-arc-flag sweep-flag dx dy)
    const x = ctx.prepoint.x + item[6];
    const y = ctx.prepoint.y + item[7];
    item = item.slice(0);
    item[0] = 'A';
    item[6] = x;
    item[7] = y;

    const curves = arcToBezier(ctx.prepoint, item.slice(1))
    if (curves) for (let i = 0, len = curves.length; i < len; i++) {
        // C x1 y1, x2 y2, x y
        item = ['C', ...curves[i]]
        const x = item[5];
        const y = item[6];
        const x1 = item[1];
        const y1 = item[2];
        const x2 = item[3];
        const y2 = item[4];
        const bounds = canculateBoundingBox(ctx.prepoint.x, ctx.prepoint.y, x1, y1, x2, y2, x, y);
        expandBounds(ctx, bounds.minX, bounds.minY)
        expandBounds(ctx, bounds.maxX, bounds.maxY)
    }

    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}

boundsHandler['H'] = (ctx: BoundsCtx, item: any[]) => {
    const x = item[1];
    const y = ctx.prepoint.y;
    expandBounds(ctx, ctx.prepoint.x, ctx.prepoint.y);
    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}
boundsHandler['h'] = (ctx: BoundsCtx, item: any[]) => {
    const x = ctx.prepoint.x + item[1];
    const y = ctx.prepoint.y;
    expandBounds(ctx, ctx.prepoint.x, ctx.prepoint.y);
    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}
boundsHandler['V'] = (ctx: BoundsCtx, item: any[]) => {
    const x = ctx.prepoint.x;
    const y = item[1];
    expandBounds(ctx, ctx.prepoint.x, ctx.prepoint.y);
    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}
boundsHandler['v'] = (ctx: BoundsCtx, item: any[]) => {
    const x = ctx.prepoint.x;
    const y = ctx.prepoint.y + item[1];
    expandBounds(ctx, ctx.prepoint.x, ctx.prepoint.y);
    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}
boundsHandler['C'] = (ctx: BoundsCtx, item: any[]) => {
    // C x1 y1, x2 y2, x y
    const x = item[5];
    const y = item[6];
    const x1 = item[1];
    const y1 = item[2];
    const x2 = item[3];
    const y2 = item[4];
    const bounds = canculateBoundingBox(ctx.prepoint.x, ctx.prepoint.y, x1, y1, x2, y2, x, y);
    expandBounds(ctx, bounds.minX, bounds.minY)
    expandBounds(ctx, bounds.maxX, bounds.maxY)
    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}
boundsHandler['c'] = (ctx: BoundsCtx, item: any[]) => {
    // c dx1 dy1, dx2 dy2, dx dy
    const x = ctx.prepoint.x + item[5];
    const y = ctx.prepoint.y + item[6];
    const x1 = ctx.prepoint.x + item[1];
    const y1 = ctx.prepoint.y + item[2];
    const x2 = ctx.prepoint.x + item[3];
    const y2 = ctx.prepoint.y + item[4];
    const bounds = canculateBoundingBox(ctx.prepoint.x, ctx.prepoint.y, x1, y1, x2, y2, x, y);
    expandBounds(ctx, bounds.minX, bounds.minY)
    expandBounds(ctx, bounds.maxX, bounds.maxY)
    ctx.prepoint.x = x;
    ctx.prepoint.y = y;
}
boundsHandler['Z'] = (ctx: BoundsCtx, item: any[]) => {
    expandBounds(ctx, ctx.prepoint.x, ctx.prepoint.y);
    ctx.prepoint.x = ctx.beginpoint.x;
    ctx.prepoint.y = ctx.beginpoint.y;
}
boundsHandler['z'] = (ctx: BoundsCtx, item: any[]) => {
    expandBounds(ctx, ctx.prepoint.x, ctx.prepoint.y);
    ctx.prepoint.x = ctx.beginpoint.x;
    ctx.prepoint.y = ctx.beginpoint.y;
}

function calcPathBounds(path: any[]): Bounds {
    const ctx: BoundsCtx = {
        beginpoint: { x: 0, y: 0 },
        prepoint: { x: 0, y: 0 },
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
        boundsinited: false
    }

    for (let i = 0, len = path.length; i < len; i++) {
        const item = path[i];
        boundsHandler[item[0]](ctx, item)
    }
    if (path[path.length - 1][0].toLowerCase() !== 'z') { // 闭合
        boundsHandler['z'](ctx, path[path.length - 1])
    }
    return ctx.bounds;
}

// eslint-disable-next-line
const pathCommand = /([achlmrqstvz])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig;
// eslint-disable-next-line
const pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\s]*,?[\s]*/ig;

export function parsePathString(pathString: string): (string | number)[][] {
    if (!pathString) {
        return [];
    }
    // const pth = paths(pathString);
    // if (pth.arr) {
    //     return pathClone(pth.arr);
    // }

    const paramCounts: any = { a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0 };
    const data: (string | number)[][] = [];
    // if (R.is(pathString, array) && R.is(pathString[0], array)) { // rough assumption
    //     data = pathClone(pathString);
    // }
    // if (!data.length) {
    pathString.replace(pathCommand, function (a: string, b: string, c: string): string {
        const params: (string | number)[] = [];
        let name = b.toLowerCase();
        c.replace(pathValues, function (a: string, b: string): string {
            b && params.push(+b);
            return "";
        });
        if (name == "m" && params.length > 2) {
            data.push(([b] as (string | number)[]).concat(params.splice(0, 2)));
            name = "l";
            b = b == "m" ? "l" : "L";
        }
        if (name == "r") {
            data.push(([b] as (string | number)[]).concat(params));
        } else while (params.length >= paramCounts[name]) {
            data.push(([b] as (string | number)[]).concat(params.splice(0, paramCounts[name])));
            if (!paramCounts[name]) {
                break;
            }
        }
        return "";// todo
    });

    // }
    // data.toString = R._path2string;
    // pth.arr = pathClone(data);
    return data;
}

// path -> curvpoint[]
// ----------------------------------------------------------------------------------
// 将路径中的相对值转换为绝对坐标
type CurvSeg = {
    beginpoint: { x: number, y: number },
    prepoint: { x: number, y: number },
    points: CurvePoint[],
    isClosed?: boolean,
}

type CurvCtx = {
    width: number,
    height: number,
    segs: CurvSeg[], // 初始化时至少给一个
}

const curvHandler: { [key: string]: (ctx: CurvCtx, item: any[]) => void } = {}

function convertPath2CurvePoints(path: any[], width: number, height: number): {
    points: CurvePoint[],
    isClosed?: boolean
}[] {
    const ctx: CurvCtx = {
        width,
        height,
        segs: []
    };
    ctx.segs.push({
        beginpoint: { x: 0, y: 0 },
        prepoint: { x: 0, y: 0 },
        points: []
    });

    for (let i = 0, len = path.length; i < len; i++) {
        const item = path[i];
        curvHandler[item[0]](ctx, item)
    }

    // 最后个
    for (let i = 0, len = ctx.segs.length; i < len; i++) {
        const seg = ctx.segs[i];
        if (seg.points.length <= 1) continue;
        const p0 = seg.points[0];
        const pe = seg.points[seg.points.length - 1];
        if (Math.abs(pe.point.x - p0.point.x) < float_accuracy && Math.abs(pe.point.y - p0.point.y) < float_accuracy) {
            seg.isClosed = true;
            if (pe.hasCurveTo) {
                p0.hasCurveTo = true;
                p0.curveTo = pe.curveTo;
            }

            seg.points.splice(seg.points.length - 1, 1); // 删掉最后个重复的
        }
    }

    const ret: {
        points: CurvePoint[],
        isClosed: boolean
    }[] = []

    for (let i = 0, len = ctx.segs.length; i < len; i++) {
        const seg = ctx.segs[i];
        if (seg.points.length <= 1) continue;

        ret.push({points: seg.points, isClosed: !!seg.isClosed})
    }

    ret.forEach((seg) => {
        seg.points = seg.points.map((p) => {
            if (p.hasCurveFrom) {
                p.curveFrom.x /= width;
                p.curveFrom.y /= height;
            }
            if (p.hasCurveTo) {
                p.curveTo.x /= width;
                p.curveTo.y /= height;
            }
            p.point.x /= width;
            p.point.y /= height;
            return p;
        })
    })

    return ret;
}

curvHandler['M'] = (ctx: CurvCtx, item: any[]) => {
    const x = item[1];
    const y = item[2];
    const seg = {
        beginpoint: { x, y },
        prepoint: { x, y },
        points: [],
    }
    ctx.segs.push(seg);
}
curvHandler['m'] = (ctx: CurvCtx, item: any[]) => {
    const preseg = ctx.segs[ctx.segs.length - 1];
    const x = preseg.prepoint.x || 0 + item[1];
    const y = preseg.prepoint.y || 0 + item[2];
    const seg = {
        beginpoint: { x, y },
        prepoint: { x, y },
        points: [],
    }
    ctx.segs.push(seg);
}

function curveHandleLine(seg: CurvSeg, x: number, y: number) {
    if (seg.points.length === 0) {
        const point = new CurvePoint(uuid(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(seg.beginpoint.x, seg.beginpoint.y));
        seg.points.push(point);
    }
    const point = new CurvePoint(uuid(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(x, y));
    seg.points.push(point);
}

curvHandler['L'] = (ctx: CurvCtx, item: any[]) => {
    const seg = ctx.segs[ctx.segs.length - 1];
    const x = item[1];
    const y = item[2];
    curveHandleLine(seg, x, y);
    seg.prepoint.x = x;
    seg.prepoint.y = y;
}
curvHandler['l'] = (ctx: CurvCtx, item: any[]) => {
    const seg = ctx.segs[ctx.segs.length - 1];
    const x = seg.prepoint.x + item[1];
    const y = seg.prepoint.y + item[2];
    curveHandleLine(seg, x, y);
    seg.prepoint.x = x;
    seg.prepoint.y = y;
}

function curveHandleBezier(seg: CurvSeg, x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    if (seg.points.length > 0) {
        const prePoint = seg.points[seg.points.length - 1];
        prePoint.hasCurveFrom = true;
        prePoint.curveFrom.x = x1;
        prePoint.curveFrom.y = y1;
    }
    else {
        const point = new CurvePoint(uuid(), 0, new Point2D(x1, y1), new Point2D(0, 0), true, false, CurveMode.Asymmetric, new Point2D(seg.beginpoint.x, seg.beginpoint.y));
        seg.points.push(point);
    }
    const point = new CurvePoint(uuid(), 0, new Point2D(0, 0), new Point2D(x2, y2), false, true, CurveMode.Asymmetric, new Point2D(x, y));
    seg.points.push(point);
}

curvHandler['A'] = (ctx: CurvCtx, item: any[]) => {
    // (rx ry x-axis-rotation large-arc-flag sweep-flag x y)
    const seg = ctx.segs[ctx.segs.length - 1];
    const x = item[6];
    const y = item[7];
    const curves = arcToBezier(seg.prepoint, item.slice(1))
    if (curves) for (let i = 0, len = curves.length; i < len; i++) {
        // C x1 y1, x2 y2, x y
        item = ['C', ...curves[i]]
        const x = item[5];
        const y = item[6];
        const x1 = item[1];
        const y1 = item[2];
        const x2 = item[3];
        const y2 = item[4];
        curveHandleBezier(seg, x1, y1, x2, y2, x, y);
    }
    seg.prepoint.x = x;
    seg.prepoint.y = y;
}
curvHandler['a'] = (ctx: CurvCtx, item: any[]) => {
    // (rx ry x-axis-rotation large-arc-flag sweep-flag dx dy)
    const seg = ctx.segs[ctx.segs.length - 1];
    const x = seg.prepoint.x + item[6];
    const y = seg.prepoint.y + item[7];
    item = item.slice(0);
    item[0] = 'A';
    item[6] = x;
    item[7] = y;
    const curves = arcToBezier(seg.prepoint, item.slice(1))
    if (curves) for (let i = 0, len = curves.length; i < len; i++) {
        // C x1 y1, x2 y2, x y
        item = ['C', ...curves[i]]
        const x = item[5];
        const y = item[6];
        const x1 = item[1];
        const y1 = item[2];
        const x2 = item[3];
        const y2 = item[4];
        curveHandleBezier(seg, x1, y1, x2, y2, x, y);
    }
    seg.prepoint.x = x;
    seg.prepoint.y = y;
}

curvHandler['H'] = (ctx: CurvCtx, item: any[]) => {
    const seg = ctx.segs[ctx.segs.length - 1];
    const x = item[1];
    const y = seg.prepoint.y;
    curveHandleLine(seg, x, y);
    seg.prepoint.x = x;
    seg.prepoint.y = y;
}
curvHandler['h'] = (ctx: CurvCtx, item: any[]) => {
    const seg = ctx.segs[ctx.segs.length - 1];
    const x = seg.prepoint.x + item[1];
    const y = seg.prepoint.y;
    curveHandleLine(seg, x, y);
    seg.prepoint.x = x;
    seg.prepoint.y = y;
}
curvHandler['V'] = (ctx: CurvCtx, item: any[]) => {
    const seg = ctx.segs[ctx.segs.length - 1];
    const x = seg.prepoint.x;
    const y = item[1];
    curveHandleLine(seg, x, y);
    seg.prepoint.x = x;
    seg.prepoint.y = y;
}
curvHandler['v'] = (ctx: CurvCtx, item: any[]) => {
    const seg = ctx.segs[ctx.segs.length - 1];
    const x = seg.prepoint.x;
    const y = seg.prepoint.y + item[1];
    curveHandleLine(seg, x, y);
    seg.prepoint.x = x;
    seg.prepoint.y = y;
}
curvHandler['C'] = (ctx: CurvCtx, item: any[]) => {
    const seg = ctx.segs[ctx.segs.length - 1];
    // C x1 y1, x2 y2, x y
    const x = item[5];
    const y = item[6];
    const x1 = item[1];
    const y1 = item[2];
    const x2 = item[3];
    const y2 = item[4];
    curveHandleBezier(seg, x1, y1, x2, y2, x, y);
    seg.prepoint.x = x;
    seg.prepoint.y = y;
}
curvHandler['c'] = (ctx: CurvCtx, item: any[]) => {
    const seg = ctx.segs[ctx.segs.length - 1];
    // c dx1 dy1, dx2 dy2, dx dy
    const x = seg.prepoint.x + item[5];
    const y = seg.prepoint.y + item[6];
    const x1 = seg.prepoint.x + item[1];
    const y1 = seg.prepoint.y + item[2];
    const x2 = seg.prepoint.x + item[3];
    const y2 = seg.prepoint.y + item[4];
    curveHandleBezier(seg, x1, y1, x2, y2, x, y);
    seg.prepoint.x = x;
    seg.prepoint.y = y;
}
curvHandler['Z'] = (ctx: CurvCtx, item: any[]) => {
    const seg = ctx.segs[ctx.segs.length - 1];
    seg.isClosed = true;
    seg.prepoint.x = seg.beginpoint.x;
    seg.prepoint.y = seg.beginpoint.y;
}
curvHandler['z'] = (ctx: CurvCtx, item: any[]) => {
    const seg = ctx.segs[ctx.segs.length - 1];
    seg.isClosed = true;
    seg.prepoint.x = seg.beginpoint.x;
    seg.prepoint.y = seg.beginpoint.y;
}
// -------------------------------------------------------------

export class Path {
    private m_segs: any[];
    private __bounds?: Bounds;

    constructor(path?: any[] | string) {
        if (typeof path === 'string') this.m_segs = parsePathString(path);
        else if (path) this.m_segs = path;
        else this.m_segs = [];
    }
    get length() {
        return this.m_segs.length;
    }
    push(...paths: Path[]) {
        paths.forEach((p) => {
            if (p) this.m_segs.push(...p.m_segs);
        })
        this.__bounds = undefined; // todo
    }
    clone(): Path {
        const segs = JSON.parse(JSON.stringify(this.m_segs))
        const path = new Path(segs);
        path.__bounds = this.__bounds;
        return path;
    }
    // 提供个比transform更高效点的方法
    translate(x: number, y: number) {
        this.m_segs = this.m_segs.map(translatePath(x, y));
        if (this.__bounds) {
            this.__bounds.maxX += x;
            this.__bounds.minX += x;
            this.__bounds.maxY += y;
            this.__bounds.minY += y;
        }
    }
    transform(m: Matrix) {
        this.m_segs = this.m_segs.map(transformPath(m));
        this.__bounds = undefined;
    }
    toString() {
        return this.m_segs.map((v) => v.join(" ")).join(" ");
    }
    calcBounds() {
        if (this.__bounds) return this.__bounds;
        this.__bounds = calcPathBounds(this.m_segs);
        // Object.freeze(this.__bounds);
        return this.__bounds;
    }
    toCurvePoints(width: number, height: number): { points: CurvePoint[], isClosed?: boolean }[] {
        return convertPath2CurvePoints(this.m_segs, width, height);
    }
}