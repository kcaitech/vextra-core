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
import { ShapeFrame, ShapeType } from "../data/typesdefine";
import { ShapeView } from "./shape";
import { GroupShapeView } from "./groupshape";

function intersect_range(lx0: number, lx1: number, rx0: number, rx1: number): boolean {
    return lx0 < rx1 && lx1 > rx0;
}

function contains_range(lx0: number, lx1: number, rx0: number, rx1: number): boolean {
    return lx0 <= rx0 && lx1 > rx1;
}

type Rect = ShapeFrame;

function intersect_rect(lhs: Rect, rhs: Rect): boolean {
    return intersect_range(lhs.x, lhs.x + lhs.width, rhs.x, rhs.x + rhs.width) &&
        intersect_range(lhs.y, lhs.y + lhs.height, rhs.y, rhs.y + rhs.height);
}

function contains_rect(lhs: Rect, rhs: Rect): boolean {
    return contains_range(lhs.x, lhs.x + lhs.width, rhs.x, rhs.x + rhs.width) &&
        contains_range(lhs.y, lhs.y + lhs.height, rhs.y, rhs.y + rhs.height);
}

function intersect_skewrect_point(skewrect: { x: number, y: number }[], point: { x: number, y: number }): boolean {
    if (point.x === skewrect[0].x && point.y === skewrect[0].y) return true;
    const line_from = point;
    const line_to = skewrect[0];
    for (let i = 1, len = skewrect.length - 1; i < len; ++i) {
        const from = skewrect[i], to = skewrect[i + 1];
        const p = intersect_line_seg(line_from, line_to, from, to);
        if (!p) continue;
        if (p === true) {
            // 共线
            return intersect_seg_point(from, to, point)
        } else {
            return intersect_seg_point(p, line_to, point);
        }
    }
    return intersect_seg_point(skewrect[0], skewrect[1], point) || intersect_seg_point(skewrect[skewrect.length - 1], skewrect[0], point);
    ;
}

function intersect_rect_point(rect: Rect, point: { x: number, y: number }): boolean {
    return point.x >= rect.x && point.y >= rect.y && point.x < (rect.x + rect.width) && point.y < (rect.y + rect.height);
}

function intersect_seg_point(seg_from: { x: number, y: number }, seg_to: { x: number, y: number }, point: {
    x: number,
    y: number
}): boolean {
    const { x: x1, y: y1 } = seg_from;
    const { x: x2, y: y2 } = seg_to;
    const { x: x3, y: y3 } = point;
    const d1 = (y3 - y1) * (x2 - x1) - (y2 - y1) * (x3 - x1);
    if (Math.abs(d1) < float_accuracy) {
        const _x1 = Math.min(x1, x2);
        const _x2 = Math.max(x1, x2);
        const _y1 = Math.min(y1, y2);
        const _y2 = Math.max(y1, y2);
        return x1 === x2 ? y3 >= _y1 && y3 < _y2 : x3 >= _x1 && x3 < _x2;
    }
    return false;
}

function intersect_seg_seg(seg0_from: { x: number, y: number }, seg0_to: { x: number, y: number }, seg1_from: {
    x: number,
    y: number
}, seg1_to: { x: number, y: number }): { x: number, y: number } | boolean {
    const { x: x1, y: y1 } = seg0_from;
    const { x: x2, y: y2 } = seg0_to;
    const { x: x3, y: y3 } = seg1_from;
    const { x: x4, y: y4 } = seg1_to;
    const d = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1);
    if (Math.abs(d) < float_accuracy) { // 平行
        const d1 = (y3 - y1) * (x2 - x1) - (y2 - y1) * (x3 - x1);
        if (Math.abs(d1) < float_accuracy) { // 共线
            return Math.abs(x1 - x2) < float_accuracy ?
                intersect_range(Math.min(y1, y2), Math.max(y1, y2), Math.min(y3, y4), Math.max(y3, y4)) :
                intersect_range(Math.min(x1, x2), Math.max(x1, x2), Math.min(x3, x4), Math.max(x3, x4));
        }
    } else {
        const t1 = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
        const t2 = ((x1 - x3) * (y2 - y1) + (y3 - y1) * (x2 - x1)) / (-d);
        if (t1 >= 0 && t1 < 1 && t2 >= 0 && t2 < 1) {
            const x = x1 + t1 * (x2 - x1);
            const y = y1 + t1 * (y2 - y1);
            return { x, y }
        }
    }
    return false;
}

function intersect_line_seg(line_from: { x: number, y: number }, line_to: { x: number, y: number }, seg_from: {
    x: number,
    y: number
}, seg_to: { x: number, y: number }): { x: number, y: number } | boolean {
    const { x: x1, y: y1 } = line_from;
    const { x: x2, y: y2 } = line_to;
    const { x: x3, y: y3 } = seg_from;
    const { x: x4, y: y4 } = seg_to;
    const d = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1);
    if (Math.abs(d) < float_accuracy) { // 平行
        const d1 = (y3 - y1) * (x2 - x1) - (y2 - y1) * (x3 - x1);
        if (Math.abs(d1) < float_accuracy) { // 共线
            return true;
        }
    } else {
        const t2 = ((x1 - x3) * (y2 - y1) + (y3 - y1) * (x2 - x1)) / (-d);
        if (t2 >= 0 && t2 < 1) {
            const x = x3 + t2 * (x4 - x3);
            const y = y3 + t2 * (y4 - y3);
            return { x, y }
        }
    }
    return false;
}

function seg_bounds(seg_from: { x: number, y: number }, seg_to: { x: number, y: number }): Rect {
    const minx = Math.min(seg_from.x, seg_to.x), miny = Math.min(seg_from.y, seg_to.y);
    const maxx = Math.max(seg_from.x, seg_to.x), maxy = Math.max(seg_from.y, seg_to.y);
    return { x: minx, y: miny, width: maxx - minx, height: maxy - miny }
}

function intersect_rect_seg(rect: Rect, seg_from: { x: number, y: number }, seg_to: { x: number, y: number }): boolean {
    if (intersect_rect_point(rect, seg_from) || intersect_rect_point(rect, seg_to)) return true;
    if (!intersect_rect(rect, seg_bounds(seg_from, seg_to))) return false;
    const points = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.width, y: rect.y },
        { x: rect.x + rect.width, y: rect.y + rect.height },
        { x: rect.x, y: rect.y + rect.height }];
    for (let i = 0, len = points.length; i < len; ++i) {
        const from = points[i], to = i === len - 1 ? points[0] : points[i + 1];
        if (intersect_seg_seg(from, to, seg_from, seg_to)) return true;
    }
    return false;
}

function skewrect_bounds(skewrect: { x: number, y: number }[]): Rect {
    let minx, maxx, miny, maxy;
    const { x, y } = skewrect[0];
    minx = maxx = x;
    miny = maxy = y;
    for (let i = 1, len = skewrect.length; i < len; ++i) {
        const { x, y } = skewrect[i];
        if (x < minx) minx = x;
        else if (x > maxx) maxx = x;
        if (y < miny) miny = y;
        else if (y > maxy) maxy = y;
    }
    return { x: minx, y: miny, width: maxx - minx, height: maxy - miny }
}

function contains_skewrect_rect(skewrect: { x: number, y: number }[], rect: Rect): boolean {
    if (!contains_rect(skewrect_bounds(skewrect), rect)) return false;
    for (let i = 0, len = skewrect.length; i < len; ++i) {
        if (intersect_rect_seg(rect, skewrect[i], i === len - 1 ? skewrect[0] : skewrect[i + 1])) return false;
    }
    return intersect_skewrect_point(skewrect, rect);
}

function intersect_skewrect_rect(skewrect: { x: number, y: number }[], rect: Rect): boolean {
    if (!intersect_rect(skewrect_bounds(skewrect), rect)) return false;
    for (let i = 0, len = skewrect.length; i < len; ++i) {
        if (intersect_rect_seg(rect, skewrect[i], i === len - 1 ? skewrect[0] : skewrect[i + 1])) return true;
    }
    return intersect_skewrect_point(skewrect, rect) || intersect_rect_point(rect, skewrect[0]);
}

function intersect_skewrect_group_rect(view: GroupShapeView, skewrect: { x: number, y: number }[]) {
    const children = view.childs;

    const bounds = skewrect_bounds(skewrect);
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!intersect_rect(bounds, child.frameProxy._p_outerFrame)) continue;
        const transfrom = child.transform.inverse;
        const cskewrect = skewrect.map((p) => transfrom.computeCoord(p));
        if (child.type === ShapeType.Group) {
            if (intersect_skewrect_group_rect(child as GroupShapeView, cskewrect)) return true;
        } else if (intersect_skewrect_rect(cskewrect, child.visibleFrame)) {
            return true;
        }
    }
    return false;
}

function unable_area(view: ShapeView) {
    return view.isLocked || !view.isVisible;
}

function is_fixed_board(view: ShapeView, level: number) {
    return (view.type === ShapeType.Artboard || view.type === ShapeType.SymbolUnion) && !!view.childs.length && level === 1;
}

function __find(view: ShapeView, skewrect: {
    x: number,
    y: number
}[], level: number, finder: (view: ShapeView, level: number, skewrect: { x: number, y: number }[]) => boolean) {

    // if (!insersect_skewrect_rect(skewrect, view.outerFrame)) return;
    if (!finder(view, level, skewrect)) return;

    view.childs.forEach(c => {
        const transfrom = c.transform.inverse;
        const cskewrect = skewrect.map((p) => transfrom.computeCoord(p));
        __find(c, cskewrect, level + 1, finder);
    })
}

function _find(view: ShapeView, rect: Rect, level: number, finder: (view: ShapeView, level: number, skewrect: {
    x: number,
    y: number
}[]) => boolean) {
    if (!intersect_rect(rect, view.outerFrame)) return;
    const skewrect: { x: number, y: number }[] = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.width, y: rect.y },
        { x: rect.x + rect.width, y: rect.y + rect.height },
        { x: rect.x, y: rect.y + rect.height }]
    if (!finder(view, level, skewrect)) return;
    view.childs.forEach(c => {
        if (!intersect_rect(rect, c.frameProxy._p_outerFrame)) return;
        const transfrom = c.transform.inverse;
        const cskewrect = skewrect.map((p) => transfrom.computeCoord(p));
        __find(c, cskewrect, level + 1, finder);
    })
}

// debug
// (window as any).find4select = (rect: Rect, alt: boolean) => {
//     const page = (window as any).__context.selection.selectedPage as ShapeView;
//     return find4select(page, rect, alt);
// }

export function find4select(view: ShapeView, rect: Rect, alt: boolean) {
    const ret: ShapeView[] = [];

    const alt_finder = (view: ShapeView, level: number, skewrect: { x: number, y: number }[]) => {
        if (unable_area(view)) return false;
        if (level === 0) return true;
        if (is_fixed_board(view, level)) {
            if (contains_skewrect_rect(skewrect, view.frame)) {
                ret.push(view);
                return false;
            } else {
                return intersect_skewrect_rect(skewrect, view.visibleFrame);
            }
        } else if (contains_skewrect_rect(skewrect, view.frame)) ret.push(view);
        return false;
    }

    const finder = (view: ShapeView, level: number, skewrect: { x: number, y: number }[]) => {
        if (unable_area(view)) return false;
        if (level === 0) return true;
        if (is_fixed_board(view, level)) {
            if (contains_skewrect_rect(skewrect, view.frame)) {
                ret.push(view);
                return false;
            } else {
                return intersect_skewrect_rect(skewrect, view.visibleFrame);
            }
        } else if (view.type === ShapeType.Group) {
            if (intersect_skewrect_group_rect(view as GroupShapeView, skewrect)) ret.push(view);
        } else if (intersect_skewrect_rect(skewrect, view.visibleFrame)) ret.push(view);
        return false;
    }

    _find(view, rect, 0, alt ? alt_finder : finder)

    return ret;
}