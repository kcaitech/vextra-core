/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { GroupShapeView } from "../../groupshape";
import { ShapeFrame, ShapeType } from "../../../data";
import { ShapeView } from "../../shape";
import { FrameProxy } from "./view";
import { updateFrame } from "./basic";

export class GroupFrameProxy extends FrameProxy {
    constructor(protected view: GroupShapeView) {
        super(view);
    }

    updateFrames() {
        let children = this.view.m_children;
        if (this.view.maskMap.size && (this.view.type === ShapeType.Group || this.view.type === ShapeType.BoolShape)) {
            children = this.view.m_children.filter(i => !this.view.maskMap.has(i.id));
        }

        children = children.filter(i => i.type !== ShapeType.Contact);

        const childcontentbounds = children.map(c => (c as ShapeView).relativeFrame);

        const childvisiblebounds = children.map(c => (c as ShapeView).frameProxy._p_visibleFrame);

        const childouterbounds = children.map(c => (c as ShapeView).frameProxy._p_outerFrame);

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

        const contentbounds = childcontentbounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
        const visiblebounds = childvisiblebounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
        const outerbounds = childouterbounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });

        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;

        if (updateFrame(this.m_frame, contentbounds.minx, contentbounds.miny, contentbounds.maxx - contentbounds.minx, contentbounds.maxy - contentbounds.miny)) {
            this.view.cache.clearCacheByKeys(['m_pathstr', 'm_path']);
            changed = true;
        }
        {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        }
        if (updateFrame(this.m_visibleFrame, visiblebounds.minx, visiblebounds.miny, visiblebounds.maxx - visiblebounds.minx, visiblebounds.maxy - visiblebounds.miny)) changed = true;
        if (updateFrame(this.m_outerFrame, outerbounds.minx, outerbounds.miny, outerbounds.maxx - outerbounds.minx, outerbounds.maxy - outerbounds.miny)) changed = true;

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