/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ShapeFrame } from "../data/typesdefine";
import { ShapeView } from "./shape";

function frameContains(frame: ShapeFrame, x: number, y: number) {
    return x >= frame.x && x < (frame.x + frame.width) && y >= frame.y && y < (frame.y + frame.height);
}

function _hitTest(shape: ShapeView, x: number, y: number, type: '_p_frame' | '_p_visibleFrame' | '_p_outerFrame', depth: number, ret: { shape: ShapeView, x: number, y: number }[]) {
    for (let i = 0, len = shape.m_children.length; i < len; ++i) {
        const child = shape.m_children[i] as ShapeView;
        if (frameContains(child.frameProxy[type], x, y)) {
            const xy = child.transform.inverseCoord(x, y);
            ret.push({ shape: child, x: xy.x, y: xy.y })
            if (depth > 1) _hitTest(child, xy.x, xy.y, type, depth - 1, ret)
        }
    }
}

function hitTest(shape: ShapeView, x: number, y: number, type: { m: 'm_frame', p: '_p_frame' } | { m: 'm_visibleFrame', p: '_p_visibleFrame' } | { m: 'm_outerFrame', p: '_p_outerFrame' }, depth: number, ret: { shape: ShapeView, x: number, y: number }[]) {
    if (depth > 0 && frameContains(shape.frameProxy[type.m], x, y)) _hitTest(shape, x, y, type.p, depth, ret);
}

export function hitContent(shape: ShapeView, x: number, y: number, depth: number): { shape: ShapeView; x: number; y: number; }[] {
    const ret: { shape: ShapeView, x: number, y: number }[] = [];
    hitTest(shape, x, y, { m: "m_frame", p: '_p_frame' }, depth, ret);
    return ret;
}
export function hitVisible(shape: ShapeView, x: number, y: number, depth: number): { shape: ShapeView; x: number; y: number; }[] {
    const ret: { shape: ShapeView, x: number, y: number }[] = [];
    hitTest(shape, x, y, { m: "m_visibleFrame", p: "_p_visibleFrame" }, depth, ret);
    return ret;
}
export function hitOuter(shape: ShapeView, x: number, y: number, depth: number): { shape: ShapeView; x: number; y: number; }[] {
    const ret: { shape: ShapeView, x: number, y: number }[] = [];
    hitTest(shape, x, y, { m: "m_outerFrame", p: "_p_outerFrame" }, depth, ret);
    return ret;
}
