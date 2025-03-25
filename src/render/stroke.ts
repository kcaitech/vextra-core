/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Cap, Join, Path } from "@kcdesign/path";
import { Matrix } from "../basic/matrix";
import { CornerType, MarkerType, BorderPosition, CurvePoint } from "../data/typesdefine";
import { ContactLineView, PathShapeView, ShapeView } from "../dataview";

interface XY {
    x: number
    y: number
}

export function stroke(shape: ShapeView) {
   const border = shape.getBorder();
    const dashPath = (p: Path) => p.dash(10, 10, 1);

    const position = border.position;
    const setting = border.sideSetting;
    const isDash = border.borderStyle.gap;

    const startMarker = shape.startMarkerType;
    const endMarker = shape.endMarkerType;

    const width = shape.frame.width;
    const height = shape.frame.height;

    // 尺寸小于或等于14，会出现线条走样，这里把它放到到20，返回出去的时候再等比例放回来
    const radio = Math.min(width / 20, height / 20);

    const mark = (shape instanceof PathShapeView)
        && !!(startMarker || endMarker)
        && shape.segments.length === 1
        && !shape.segments[0].isClosed;

    const isEven = (setting.thicknessTop + setting.thicknessRight + setting.thicknessBottom + setting.thicknessLeft) / 4 === setting.thicknessLeft;

    let result: Path | undefined;

    const join = (() => {
        const type = border.cornerType;
        if (type === CornerType.Round) return Join.ROUND;
        else if (type === CornerType.Bevel) return Join.BEVEL;
        else return Join.MITER;
    })();

    const cap = (() => {
        const end = shape.style.endMarkerType;
        const start = shape.style.startMarkerType;
        if (end === MarkerType.Round && start === MarkerType.Round) return Cap.ROUND;
        else if (end === MarkerType.Square && start === MarkerType.Square) return Cap.SQUARE;
        else return Cap.BUTT;
    })();

    const basicParams: any = {
        join: { value: join },
        cap: { value: cap }
    };

    const path = getPathStr();
    const thickness = getThickness();

    if (mark) {
        const p0 = Path.fromSVGString(path);
        if (isDash) dashPath(p0);
        p0.stroke(Object.assign(basicParams, { width: thickness }));

        const startCap = getStartCap();
        if (startCap) p0.union(startCap);

        const endCap = getEndCap();
        if (endCap) p0.union(endCap);

        const __start = getStartMarkPath();
        if (__start) p0.union(__start);

        const __end = getEndMarkPath();
        if (__end) p0.union(__end);

        result = p0
    } else if (isEven) {
        const __open = (shape instanceof PathShapeView) && shape.segments.some(i => !i.isClosed);
        if (__open) {
            const p0 = Path.fromSVGString(path);
            if (isDash) dashPath(p0);
            p0.stroke(Object.assign(basicParams, { width: thickness }));
            result = p0
        } else {
            if (position === BorderPosition.Outer) {
                const p0 = Path.fromSVGString(path);
                const p1 = p0.clone();
                if (isDash) dashPath(p0);
                p0.stroke(Object.assign(basicParams, { width: thickness * 2 }));
                p0.subtract(p1);
                result = p0
            } else if (position === BorderPosition.Center) {
                const p0 = Path.fromSVGString(path);
                if (isDash) dashPath(p0);
                p0.stroke(Object.assign(basicParams, { width: thickness }));
                result = p0
            } else {
                const path = getPathStr();
                const p0 = Path.fromSVGString(path);
                const p1 = p0.clone();
                if (isDash) dashPath(p0);
                p0.stroke(Object.assign(basicParams, { width: thickness * 2 }));
                p0.intersection(p1);
                result = p0
            }
        }
    } else {
        if (!shape.data.haveEdit) {
            const path = strokeOdd()
            if (path) result = path
        }
    }

    if (!result) result = new Path()
    if (radio < 1) {
        const matrix = new Matrix();
        matrix.scale(radio);
        result.transform(matrix);
    }
    return result;

    function getRadians(pre: CurvePoint, next: CurvePoint, isEnd?: boolean) {
        if (!pre.hasFrom && !next.hasTo) {
            const deltaX = (next.x - pre.x) * width;
            const deltaY = (next.y - pre.y) * height;
            return Math.atan2(deltaY, deltaX);
        } else {
            const p0 = { x: pre.x * width, y: pre.y * height };
            const p3 = { x: next.x * width, y: next.y * height };

            const p1 = { x: (pre.fromX || pre.x) * width, y: (pre.fromY || pre.y) * height };
            const p2 = { x: (next.toX || next.x) * width, y: (next.toY || next.y) * height }

            return tangent(p0, p1, p2, p3, isEnd ? 1 : 0);
        }

        function tangent(p0: XY, p1: XY, p2: XY, p3: XY, t: number) {
            if (pre.fromX !== undefined && next.toX !== undefined) {
                const tangent = {
                    x: 3 * (1 - t) ** 2 * (p1.x - p0.x) + 6 * (1 - t) * t * (p2.x - p1.x) + 3 * t ** 2 * (p3.x - p2.x),
                    y: 3 * (1 - t) ** 2 * (p1.y - p0.y) + 6 * (1 - t) * t * (p2.y - p1.y) + 3 * t ** 2 * (p3.y - p2.y),
                }
                return Math.atan2(tangent.y, tangent.x);
            } else if (next.toX !== undefined) {
                let dx = 2 * ((1 - t) * (p2.x - p0.x) + t * (p3.x - p2.x));
                let dy = 2 * ((1 - t) * (p2.y - p0.y) + t * (p3.y - p2.y));
                return Math.atan2(dy, dx);
            } else {
                let dx = 2 * ((1 - t) * (p1.x - p0.x) + t * (p3.x - p1.x));
                let dy = 2 * ((1 - t) * (p1.y - p0.y) + t * (p3.y - p1.y));
                return Math.atan2(dy, dx)
            }
        }
    }

    function getStartCap() {
        if (startMarker !== MarkerType.Round && startMarker !== MarkerType.Square) return;
        const round = Path.fromSVGString(path);
        const cap = startMarker === MarkerType.Round ? Cap.ROUND : Cap.SQUARE;
        round.stroke({ cap: { value: cap } as any, width: thickness, join: { value: join } as any });
        return round;
    }

    function getEndCap() {
        if (endMarker !== MarkerType.Round && endMarker !== MarkerType.Square) return;
        const round = Path.fromSVGString(path);
        const cap = endMarker === MarkerType.Round ? Cap.ROUND : Cap.SQUARE;
        round.stroke({ cap: { value: cap } as any, width: thickness, join: { value: join } as any });
        return round;
    }

    function getStartMarkPath() {
        if (!startMarker) return undefined;
        let points = (shape as PathShapeView).segments[0].points;
        if (shape instanceof ContactLineView) points = shape.getPoints();
        const first = points[0];
        const second = points[1];

        if (startMarker === MarkerType.OpenArrow) {
            const radians = getRadians(first as CurvePoint, second as CurvePoint);
            const fixedX = first.x * width;
            const fixedY = first.y * height;
            const __mark_points = [
                { x: fixedX + 3.5 * thickness, y: fixedY - 3 * thickness },
                { x: fixedX - 0.5 * thickness, y: fixedY },
                { x: fixedX + 3.5 * thickness, y: fixedY + 3 * thickness }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y}`;
            const __end = Path.fromSVGString(pathstr);
            const p = {
                res_scale: 10000,
                width: thickness,
                cap: { value: Cap.ROUND } as any,
                join: { value: Join.ROUND } as any,
            }
            __end.stroke(p);
            return __end;
        } else if (startMarker === MarkerType.FilledArrow) {
            const radians = getRadians(first as CurvePoint, second as CurvePoint);
            const fixedX = first.x * width;
            const fixedY = first.y * height;
            const __mark_points = [
                { x: fixedX + 3 * thickness, y: fixedY - 3 * thickness },
                { x: fixedX - 3 * thickness, y: fixedY },
                { x: fixedX + 3 * thickness, y: fixedY + 3 * thickness }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} z`;
            return Path.fromSVGString(pathstr);
        } else if (startMarker === MarkerType.FilledCircle) {
            const fixedX = first.x * width;
            const fixedY = first.y * height;
            const radius = thickness * 3;
            const pathstr = `M${fixedX} ${fixedY} h ${-radius} a${radius} ${radius} 0 1 0 ${2 * radius} 0 a${radius} ${radius} 0 1 0 ${-2 * radius} 0`;

            return Path.fromSVGString(pathstr);
        } else if (startMarker === MarkerType.FilledSquare) {
            const radians = getRadians(first as CurvePoint, second as CurvePoint);
            const fixedX = first.x * width;
            const fixedY = first.y * height;
            const __mark_points = [
                { x: fixedX, y: fixedY - 3 * thickness },
                { x: fixedX - 3 * thickness, y: fixedY },
                { x: fixedX, y: fixedY + 3 * thickness },
                { x: fixedX + 3 * thickness, y: fixedY }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3, p4] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} L${p4.x} ${p4.y} z`;
            return Path.fromSVGString(pathstr);
        }
    }

    function getEndMarkPath() {
        if (!endMarker) return;
        let points = (shape as PathShapeView).segments[0].points;
        if (shape instanceof ContactLineView) points = shape.getPoints();
        const lastPoint = points[points.length - 1];
        const preLastPoint = points[points.length - 2];
        if (endMarker === MarkerType.OpenArrow) {
            const radians = getRadians(preLastPoint as CurvePoint, lastPoint as CurvePoint, true);
            const fixedX = lastPoint.x * width;
            const fixedY = lastPoint.y * height;
            const __mark_points = [
                { x: fixedX - 3.5 * thickness, y: fixedY - 3 * thickness },
                { x: fixedX + 0.5 * thickness, y: fixedY },
                { x: fixedX - 3.5 * thickness, y: fixedY + 3 * thickness }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y}`;
            const __end = Path.fromSVGString(pathstr);
            __end.stroke({
                width: thickness,
                cap: { value: Cap.ROUND } as any,
                join: { value: Join.ROUND } as any,
            });

            return __end;
        } else if (endMarker === MarkerType.FilledArrow) {
            const radians = getRadians(preLastPoint as CurvePoint, lastPoint as CurvePoint, true);
            const fixedX = lastPoint.x * width;
            const fixedY = lastPoint.y * height;
            const __mark_points = [
                { x: fixedX - 3 * thickness, y: fixedY - 3 * thickness },
                { x: fixedX + 3 * thickness, y: fixedY },
                { x: fixedX - 3 * thickness, y: fixedY + 3 * thickness }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} z`;
            return Path.fromSVGString(pathstr);
        } else if (endMarker === MarkerType.FilledCircle) {
            const fixedX = lastPoint.x * width;
            const fixedY = lastPoint.y * height;
            const radius = thickness * 3;
            const pathstr = `M${fixedX} ${fixedY} h ${-radius} a${radius} ${radius} 0 1 0 ${2 * radius} 0 a${radius} ${radius} 0 1 0 ${-2 * radius} 0`;
            return Path.fromSVGString(pathstr);
        } else if (endMarker === MarkerType.FilledSquare) {
            const radians = getRadians(preLastPoint as CurvePoint, lastPoint as CurvePoint, true);
            const fixedX = lastPoint.x * width;
            const fixedY = lastPoint.y * height;
            const __mark_points = [
                { x: fixedX, y: fixedY - 3 * thickness },
                { x: fixedX + 3 * thickness, y: fixedY },
                { x: fixedX, y: fixedY + 3 * thickness },
                { x: fixedX - 3 * thickness, y: fixedY }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3, p4] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} L${p4.x} ${p4.y} z`;
            return Path.fromSVGString(pathstr);
        }
    }

    function getOddSide(thickness: number, path: string) {
        if (!(thickness > 0)) return;
        if (position === BorderPosition.Inner) {
            const p0 = Path.fromSVGString(getPathStr());
            const p1 = Path.fromSVGString(path);
            if (isDash) dashPath(p1);
            p1.stroke(Object.assign(basicParams, { width: thickness * 2 }));
            p1.intersection(p0);
            return p1;
        } else if (position === BorderPosition.Center) {
            const p1 = Path.fromSVGString(path);
            if (isDash) dashPath(p1);
            p1.stroke(Object.assign(basicParams, { width: thickness }));
            return p1;
        } else {
            const p0 = Path.fromSVGString(getPathStr());
            const p1 = Path.fromSVGString(path);
            if (isDash) dashPath(p1);
            p1.stroke(Object.assign(basicParams, { width: thickness * 2 }));
            p1.subtract(p0);
            return p1;
        }
    }

    function strokeOdd() {
        let path = getOddSide(setting.thicknessTop, `M0 0 h${width}`);

        const right = getOddSide(setting.thicknessRight, `M${width} 0 L${width} ${height}`);
        if (right && path) {
            path.union(right);
        } else if (right) {
            path = right;
        }

        const bottom = getOddSide(setting.thicknessBottom, `M${width} ${height} L0 ${height}`);
        if (bottom && path) {
            path.union(bottom);
        } else if (bottom) {
            path = bottom;
        }

        const left = getOddSide(setting.thicknessLeft, `M0 ${height} L0 0`);
        if (left && path) {
            path.union(left);
        } else if (left) {
            path = left;
        }

        const __cor = corner();
        if (path && __cor) path.union(__cor);

        return path;
    }

    function corner() {
        const type = border.cornerType;
        if (border.position === BorderPosition.Inner) return;
        let { thicknessBottom: b, thicknessRight: r, thicknessLeft: l, thicknessTop: t } = setting;
        if (border.position === BorderPosition.Center) {
            b /= 2;
            r /= 2;
            l /= 2;
            t /= 2;
        }
        const w = width;
        const h = height;
        let cornerPathStr = '';
        if (type === CornerType.Bevel) {
            if (t && r) {
                cornerPathStr += `M${w} ${-t} L${w + r} 0 h${-r} z`;
            }
            if (r && b) {
                cornerPathStr += `M${w + r} ${h} L${w} ${h + b} v${-b} z`;
            }
            if (b && l) {
                cornerPathStr += `M0 ${h + b} L${-l} ${h} h${l} z`;
            }
            if (l && t) {
                cornerPathStr += `M${-l} 0 L0 ${-t} v${t} z`;
            }
        } else if (type === CornerType.Round) {
            if (t && r) {
                if (t > r) {
                    cornerPathStr += `M${w} ${-t} a${r} ${r} 0 0 1 ${r} ${r} L${w + r} 0 h${-r} z`;
                } else {
                    cornerPathStr += `M${w} ${-t} L${w + r - t} ${-t} a${t} ${t} 0 0 1 ${t} ${t} h${-r} z`;
                }
            }
            if (r && b) {
                if (r > b) {
                    cornerPathStr += `M${w + r} ${h} a${b} ${b} 0 0 1 ${-b} ${b} L${w} ${h + b} v${-b}z`;
                } else {
                    cornerPathStr += `M${w + r} ${h} L${w + r} ${h + b - r} a${r} ${r} 0 0 1 ${-r} ${r} v${-b} z`;
                }
            }
            if (b && l) {
                if (b > l) {
                    cornerPathStr += `M0 ${h + b} a${l} ${l} 0 0 1 ${-l} ${-l} L${-l} ${h} h${l} z`;
                } else {
                    cornerPathStr += `M0 ${h + b} h${-l + b} a${b} ${b} 0 0 1 ${-b} ${-b} h${l} z`;
                }
            }
            if (l && t) {
                if (l > t) {
                    cornerPathStr += `M${-l} 0 a${t} ${t} 0 0 1 ${t} ${-t} L0 ${-t} v${t} z`;
                } else {
                    cornerPathStr += `M${-l} 0 L${-l} ${-t + l} a${l} ${l} 0 0 1 ${l} ${-l} v${t}`;
                }
            }
        } else {
            if (t && r) {
                cornerPathStr += `M${w} ${-t} h${r} v${t} h${-r} z`;
            }
            if (r && b) {
                cornerPathStr += `M${w + r} ${h} v${b} h${-r} v${-b} z`;
            }
            if (b && l) {
                cornerPathStr += `M0 ${h + b} h${-l} v${-b} h${l} z`;
            }
            if (l && t) {
                cornerPathStr += `M${-l} 0 v${-t} h${l} v${t} z`;
            }
        }

        if (cornerPathStr) return Path.fromSVGString(cornerPathStr);
    }

    function getPathStr() {
        const path = shape.getPath().clone();
        if (radio < 1) {
            const matrix = new Matrix();
            matrix.scale(1 / radio)
            path.transform(matrix);
            return path.toString();
        } else {
            return shape.getPathStr();
        }
    }

    function getThickness() {
        if (radio < 1) {
            return setting.thicknessTop / radio;
        } else return setting.thicknessTop;
    }
}