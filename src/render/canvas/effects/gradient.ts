import { Matrix } from "../../../basic/matrix";
import { ShapeSize, Gradient, GradientType, Stop, Color, Point2D } from "../../../data/classes";
const OneRadian = Math.PI / 180;
const defaultColor = Color.DefaultColor;
interface IMatrixData {
    a: number
    b: number
    c: number
    d: number
    e: number
    f: number
}

function applyStops(gradient: CanvasGradient, stops: Stop[]): any {
    for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const color = stop.color || defaultColor;
        const rgbColor = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
        gradient.addColorStop(stop.position, rgbColor);
    }
}

function getTransform(ctx: CanvasRenderingContext2D, size: ShapeSize, from: Point2D, to: Point2D, stretchx: number, stretchy: number, rotate90: boolean) {
    let transform: IMatrixData = ctx.getTransform();
    const { width, height } = size;
    const angle = getAngle(from, to);
    const center = { x: width / 2, y: height / 2 } as Point2D;
    scaleOfOuter(transform, center, stretchx, stretchy);
    rotateOfOuter(transform, center, rotate90 ? angle + 90 : angle);
    const offsetx = width / 2 - from.x;
    const offsety = height / 2 - from.y;
    translate(transform, -offsetx, -offsety)
    return transform
}

export function render(ctx: CanvasRenderingContext2D, value: Gradient, frame: ShapeSize): CanvasGradient | undefined {
    if (value.gradientType == GradientType.Linear) {
        const x1 = value.from.x * frame.width;
        const y1 = value.from.y * frame.height;
        const x2 = value.to.x * frame.width;
        const y2 = value.to.y * frame.height;
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        applyStops(gradient, value.stops);
        return gradient;
    }
    else if (value.gradientType == GradientType.Radial) {
        const realFrom = { x: 0, y: 0 } as Point2D;
        const realTo = { x: 0, y: 0 } as Point2D;
        toPoint(value.from, frame, realFrom);
        toPoint(value.to, frame, realTo);
        // 渐变中心点
        const center = { x: frame.width / 2, y: frame.height / 2 } as Point2D;
        const distance = getDistance(Math.abs(realTo.x - realFrom.x), Math.abs(realTo.y - realFrom.y));
        const distance1 = getDistance(Math.abs(value.to.x - value.from.x), Math.abs(value.to.y - value.from.y));
        const stretchx = value.elipseLength ? value.elipseLength * (frame.width / frame.height) : frame.width / frame.height;
        const stretchy = distance1 / 0.5 * (frame.width / frame.height);
        const transform = getTransform(ctx, frame, realFrom, realTo, stretchx * stretchy, stretchy, true);
        const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, distance / stretchy);
        applyStops(gradient, value.stops);
        ctx.setTransform(transform);
        return gradient;
    }
    else if (value.gradientType == GradientType.Angular) {
        const realFrom = { x: 0, y: 0 } as Point2D;
        const realTo = { x: 0, y: 0 } as Point2D;
        toPoint(value.from, frame, realFrom);
        toPoint(value.to, frame, realTo);
        const angle = getAngle(realFrom, realTo);
        const gradient = ctx.createConicGradient(angle * OneRadian, realFrom.x, realFrom.y);
        applyStops(gradient, value.stops);
        return gradient;
    }
}
function getAngle(t1: Point2D, t2: Point2D) {
    return Math.atan2(t2.y - t1.y, t2.x - t1.x) / OneRadian;
}

function translate(t: IMatrixData, x: number, y: number) {
    t.e += x
    t.f += y
}

function getDistance(x: number, y: number): number {
    return Math.sqrt(x * x + y * y)
}

function toPoint(origin: Point2D, size: ShapeSize, real: Point2D) {
    real.x = origin.x * size.width;
    real.y = origin.y * size.height;
}

function scaleOfOuter(t: IMatrixData, origin: Point2D, scaleX: number, scaleY: number) {
    translateInner(t, origin.x, origin.y)
    scale(t, scaleX, scaleY)
    translateInner(t, -origin.x, -origin.y)
}

function translateInner(t: IMatrixData, x: number, y: number) {
    t.e += t.a * x + t.c * y
    t.f += t.b * x + t.d * y
}

function scale(t: IMatrixData, scaleX: number, scaleY = scaleX) {
    t.a *= scaleX
    t.b *= scaleX
    t.c *= scaleY
    t.d *= scaleY
}

function rotate(t: IMatrixData, rotation: number) {
    const { a, b, c, d } = t

    rotation *= OneRadian
    const cosR = Math.cos(rotation)
    const sinR = Math.sin(rotation)

    t.a = a * cosR - b * sinR
    t.b = a * sinR + b * cosR
    t.c = c * cosR - d * sinR
    t.d = c * sinR + d * cosR
}

function rotateOfOuter(t: IMatrixData, origin: Point2D, rotation: number) {
    translateInner(t, origin.x, origin.y)
    rotate(t, rotation)
    translateInner(t, -origin.x, -origin.y)
}
