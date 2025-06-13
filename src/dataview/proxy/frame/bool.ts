/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { GroupFrameProxy } from "./group";
import { BoolShapeView } from "../../boolshape";
import { BorderPosition, ShapeFrame } from "../../../data";
import { updateFrame } from "./basic";
import { ShapeView } from "../../shape";

export class BoolFrameProxy extends GroupFrameProxy {
    constructor(protected view: BoolShapeView) {
        super(view);
    }
    updateFrames(): boolean {
        const view = this.view;
        const border = view.getBorder();
        let maxtopborder = 0;
        let maxleftborder = 0;
        let maxrightborder = 0;
        let maxbottomborder = 0;
        if (border) {
            const isEnabled = border.strokePaints.some(p => p.isEnabled);
            if (isEnabled) {
                const outer = border.position === BorderPosition.Outer;
                maxtopborder = outer ? border.sideSetting.thicknessTop : border.sideSetting.thicknessTop / 2;
                maxleftborder = outer ? border.sideSetting.thicknessLeft : border.sideSetting.thicknessLeft / 2;
                maxrightborder = outer ? border.sideSetting.thicknessRight : border.sideSetting.thicknessRight / 2;
                maxbottomborder = outer ? border.sideSetting.thicknessBottom : border.sideSetting.thicknessBottom / 2;
            }
        }

        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;
        const bounds = view.getPath().bbox();
        if (updateFrame(this.m_frame, bounds.x, bounds.y, bounds.w, bounds.h)) {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
            changed = true;
        }
        // update visible
        if (updateFrame(this.m_visibleFrame, this.frame.x - maxleftborder, this.frame.y - maxtopborder, this.frame.width + maxleftborder + maxrightborder, this.frame.height + maxtopborder + maxbottomborder)) changed = true;

        const childouterbounds = view.children.map(c => (c as ShapeView).relativeOuterFrame);
        const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
            if (i === 0) {
                p.minx = c.x;
                p.maxx = c.x + c.width;
                p.miny = c.y;
                p.maxy = c.y + c.height;
            } else {
                p.minx = Math.min(p.minx, c.x);
                p.maxx = Math.max(p.maxx, c.x + c.width);
                p.miny = Math.min(p.miny, c.y);
                p.maxy = Math.max(p.maxy, c.y + c.height);
            }
            return p;
        }
        const outerbounds = childouterbounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
        // update outer
        if (updateFrame(this.m_outerFrame, outerbounds.minx, outerbounds.miny, outerbounds.maxx - outerbounds.minx, outerbounds.maxy - outerbounds.miny)) changed = true;

        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = view.transform;
            if (view.isNoTransform()) {
                return updateFrame(out, i.x + transform.translateX, i.y + transform.translateY, i.width, i.height);
            }
            const frame = i;
            const m = transform;
            const corners = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height }]
                .map((p) => m.map(p));
            const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
            const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
            const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
            const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
            return updateFrame(out, minx, miny, maxx - minx, maxy - miny);
        }
        if (mapframe(this.m_frame, this._p_frame)) changed = true;
        if (mapframe(this.m_visibleFrame, this._p_visibleFrame)) changed = true;
        if (mapframe(this.m_outerFrame, this._p_outerFrame)) changed = true;

        return changed;
    }
}