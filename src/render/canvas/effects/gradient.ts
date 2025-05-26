/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Matrix } from "../../../basic/matrix";
import { ShapeSize, Gradient, GradientType, Stop, Color, Point2D, ShapeFrame } from "../../../data/classes";
const OneRadian = Math.PI / 180;
const defaultColor = Color.DefaultColor;

function applyStops(gradient: CanvasGradient, stops: Stop[]): any {
    for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const color = stop.color || defaultColor;
        const rgbColor = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
        gradient.addColorStop(stop.position, rgbColor);
    }
}

function getTransform(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, size: ShapeSize, from: Point2D, to: Point2D, stretchx: number, stretchy: number, rotate90: boolean) {
    let transform: DOMMatrix = ctx.getTransform();
    const { width, height } = size;
    const angle = getAngle(from, to);
    const center = { x: width / 2, y: height / 2 } as Point2D;
    scaleOfOuter(transform, center, stretchx, stretchy);
    rotateOfOuter(transform, center, rotate90 ? angle + 90 : angle);
    return transform
}

export function render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, value: Gradient, frame: ShapeSize, outerFrame?: ShapeFrame): CanvasGradient {
    if (value.gradientType === GradientType.Linear) {
        const x1 = value.from.x * frame.width;
        const y1 = value.from.y * frame.height;
        const x2 = value.to.x * frame.width;
        const y2 = value.to.y * frame.height;
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        applyStops(gradient, value.stops);
        return gradient;
    }
    else if (value.gradientType === GradientType.Radial) {
        const realFrom = { x: 0, y: 0 } as Point2D;
        const realTo = { x: 0, y: 0 } as Point2D;
        toPoint(value.from, frame, realFrom);
        toPoint(value.to, frame, realTo);
        // 渐变中心点
        const center = { x: frame.width / 2, y: frame.height / 2 } as Point2D;
        const length = outerFrame ? getDistance(outerFrame.width, outerFrame.height) : getDistance(frame.width, frame.height);
        const distance = getDistance(Math.abs(realTo.x - realFrom.x), Math.abs(realTo.y - realFrom.y));
        const stretchx = value.elipseLength ? Math.abs(value.elipseLength) * (frame.width / frame.height) : frame.width / frame.height;
        const stretchy = distance / (frame.height / 2);

        const diff = length / Math.min(stretchx * stretchy * frame.width, stretchy * frame.height);
        const transform = getTransform(ctx, frame, realFrom, realTo, stretchx * stretchy * diff, stretchy * diff, true);

        const angle = getAngle(realFrom, realTo);
        const m = new Matrix();
        m.trans(-center.x, -center.y);
        m.rotate(-((angle + 90) * OneRadian));
        m.scale(1 / (stretchx * stretchy * diff), 1 / (stretchy * diff));
        m.trans(center.x, center.y);
        const rt = m.computeCoord(realFrom);

        const gradient = ctx.createRadialGradient(rt.x, rt.y, 0, rt.x, rt.y, distance / stretchy / diff);
        applyStops(gradient, value.stops);
        ctx.setTransform(transform);
        return gradient;
    }
    else if (value.gradientType === GradientType.Angular) {
        const realFrom = { x: 0, y: 0 } as Point2D;
        const realTo = { x: 0, y: 0 } as Point2D;
        toPoint(value.from, frame, realFrom);
        toPoint(value.to, frame, realTo);
        const angle = getAngle(realFrom, realTo);
        const gradient = ctx.createConicGradient(angle * OneRadian, realFrom.x, realFrom.y);
        applyStops(gradient, value.stops);
        return gradient;
    } else {
        const x1 = value.from.x * frame.width;
        const y1 = value.from.y * frame.height;
        const x2 = value.to.x * frame.width;
        const y2 = value.to.y * frame.height;
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        applyStops(gradient, value.stops);
        return gradient;
    }
}
function getAngle(t1: Point2D, t2: Point2D) {
    return Math.atan2(t2.y - t1.y, t2.x - t1.x) / OneRadian;
}

function translate(t: DOMMatrix, x: number, y: number) {
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

function scaleOfOuter(t: DOMMatrix, origin: Point2D, scaleX: number, scaleY: number) {
    translateInner(t, origin.x, origin.y)
    scale(t, scaleX, scaleY)
    translateInner(t, -origin.x, -origin.y)
}

function translateInner(t: DOMMatrix, x: number, y: number) {
    t.e += t.a * x + t.c * y
    t.f += t.b * x + t.d * y
}

function scale(t: DOMMatrix, scaleX: number, scaleY: number) {
    t.a *= scaleX
    t.b *= scaleX
    t.c *= scaleY
    t.d *= scaleY
}

function rotate(t: DOMMatrix, rotation: number) {
    const { a, b, c, d } = t

    rotation *= OneRadian
    const cosR = Math.cos(rotation)
    const sinR = Math.sin(rotation)

    t.a = a * cosR - b * sinR
    t.b = a * sinR + b * cosR
    t.c = c * cosR - d * sinR
    t.d = c * sinR + d * cosR
}

function rotateOfOuter(t: DOMMatrix, origin: Point2D, rotation: number) {
    translateInner(t, origin.x, origin.y)
    rotate(t, rotation)
    translateInner(t, -origin.x, -origin.y)
}
