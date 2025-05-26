/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ArtboardView } from "../../artboard";
import { BorderPosition, ShadowPosition, ShapeFrame } from "../../../data";
import { ShapeView } from "../../shape";
import { FrameProxy } from "./view";
import { updateFrame } from "./basic";

export class ArtboardFrameProxy extends FrameProxy {
    constructor(protected view: ArtboardView) {
        super(view);
    }

    updateFrames() {
        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;
        if (changed) {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        }

        const border = this.view.getBorder();
        let maxtopborder = 0;
        let maxleftborder = 0;
        let maxrightborder = 0;
        let maxbottomborder = 0;
        const isEnabled = border.strokePaints.some(p => p.isEnabled);
        if (isEnabled) {
            const outer = border.position === BorderPosition.Outer;
            maxtopborder = outer ? border.sideSetting.thicknessTop : border.sideSetting.thicknessTop / 2;
            maxleftborder = outer ? border.sideSetting.thicknessLeft : border.sideSetting.thicknessLeft / 2;
            maxrightborder = outer ? border.sideSetting.thicknessRight : border.sideSetting.thicknessRight / 2;
            maxbottomborder = outer ? border.sideSetting.thicknessBottom : border.sideSetting.thicknessBottom / 2;
        }
        // 阴影
        const shadows = this.view.getShadows();
        let st = 0, sb = 0, sl = 0, sr = 0;
        shadows.forEach(s => {
            if (!s.isEnabled) return;
            if (s.position !== ShadowPosition.Outer) return;
            const w = s.blurRadius + s.spread;
            sl = Math.max(-s.offsetX + w, sl);
            sr = Math.max(s.offsetX + w, sr);
            st = Math.max(-s.offsetY + w, st);
            sb = Math.max(s.offsetY + w, sb);
        })

        const el = Math.max(maxleftborder, sl);
        const et = Math.max(maxtopborder, st);
        const er = Math.max(maxrightborder, sr);
        const eb = Math.max(maxbottomborder, sb);

        // update visible
        if (updateFrame(this.m_visibleFrame, this.frame.x - el, this.frame.y - et, this.frame.width + el + er, this.frame.height + et + eb)) changed = true;

        const childouterbounds = this.view.m_children.map(c => (c as ShapeView).frameProxy._p_outerFrame);
        const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
            p.minx = Math.min(p.minx, c.x);
            p.maxx = Math.max(p.maxx, c.x + c.width);
            p.miny = Math.min(p.miny, c.y);
            p.maxy = Math.max(p.maxy, c.y + c.height);
            return p;
        }
        const _f = this.m_visibleFrame;
        const outerbounds = childouterbounds.reduce(reducer, {
            minx: _f.x,
            miny: _f.y,
            maxx: _f.x + _f.width,
            maxy: _f.y + _f.height
        });
        // update outer
        if (updateFrame(this.m_outerFrame, outerbounds.minx, outerbounds.miny, outerbounds.maxx - outerbounds.minx, outerbounds.maxy - outerbounds.miny)) changed = true;

        // to parent frame
        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.view.transform;
            if (this.view.isNoTransform()) {
                return updateFrame(out, i.x + transform.translateX, i.y + transform.translateY, i.width, i.height);
            }
            const frame = i;
            const m = transform;
            const corners = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height }]
                .map((p) => m.computeCoord(p));
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