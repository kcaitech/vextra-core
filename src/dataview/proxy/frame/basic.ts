/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ShapeView } from "../../shape";
import { XYsBounding } from "../../../io/cilpboard";
import { Shape, ShapeFrame } from "../../../data";
export function updateFrame(frame: ShapeFrame, x: number, y: number, w: number, h: number): boolean {
    if (frame.x !== x || frame.y !== y || frame.width !== w || frame.height !== h) {
        frame.x = x;
        frame.y = y;
        frame.width = w;
        frame.height = h;
        return true;
    }
    return false;
}

export class FrameCpt {
    static frame2Root(view: ShapeView | Shape) {
        const m = view.matrix2Root();
        const frame = view.frame;
        const points = [
            { x: frame.x, y: frame.y },
            { x: frame.x + frame.width, y: frame.y },
            { x: frame.x + frame.width, y: frame.y + frame.height },
            { x: frame.x, y: frame.y + frame.height },
        ].map(p => m.computeCoord3(p));
        const box = XYsBounding(points);
        return { x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top };
    }

    static frame2Parent(view: ShapeView | Shape) {
        const m = view.matrix2Parent();
        const frame = view.frame;
        const points = [
            { x: frame.x, y: frame.y },
            { x: frame.x + frame.width, y: frame.y },
            { x: frame.x + frame.width, y: frame.y + frame.height },
            { x: frame.x, y: frame.y + frame.height },
        ].map(p => m.computeCoord3(p));
        const box = XYsBounding(points);
        return { x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top };
    }

    static frames2RootBound(views: (ShapeView | Shape)[]) {
        if (views.length === 0) throw new Error('No frames found');
        let left = Infinity;
        let right = -Infinity;
        let top = Infinity;
        let bottom = -Infinity;

        for (const view of views) {
            const m = view.matrix2Root();
            const frame = view.frame;
            const points = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height },
            ].map(p => m.computeCoord3(p));
            const box = XYsBounding(points);
            if (box.left < left) left = box.left;
            if (box.left > right) right = box.right;
            if (box.top < top) top = box.top;
            if (box.bottom > bottom) bottom = box.bottom;
        }
        return new ShapeFrame(left, top, right - left, bottom - top);
    }
}