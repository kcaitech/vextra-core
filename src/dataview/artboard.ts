/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { EL, elh } from "./el";
import { GroupShapeView } from "./groupshape";
import { innerShadowId, renderBorders, renderFills } from "../render/SVG/effects";
import { objectId } from "../basic/objectid";
import { render as clippathR } from "../render/SVG/effects/clippath"
import {
    AutoLayout,
    BorderPosition,
    CornerRadius,
    Page,
    ScrollBehavior,
    ShadowPosition,
    ShapeFrame,
    Transform,
    Artboard,
    BlurType,
    ShapeSize,
    RadiusMask,
    OverrideType,
    VariableType
} from "../data";
import { ShapeView, updateFrame } from "./shape";
import { PageView } from "./page";
import { updateAutoLayout } from "../editor/utils/auto_layout2";

export class ArtboardView extends GroupShapeView {
    m_inner_transform: Transform | undefined;
    m_fixed_transform: Transform | undefined;
    get innerTransform(): Transform | undefined {
        return this.m_inner_transform;
    }
    get fixedTransform(): Transform | undefined {
        return this.m_fixed_transform;
    }

    setFixedTransform(transform: Transform) {
        this.m_fixed_transform = transform;
        this.m_ctx.setDirty(this);
    }

    initInnerTransform(transform: Transform) {
        this.m_inner_transform = transform;
        this.m_ctx.setDirty(this);
    }
    innerScrollOffset(x: number, y: number) {
        if (!this.m_inner_transform) this.m_inner_transform = new Transform();
        this.m_inner_transform.trans(x, y);
        this.m_ctx.setDirty(this);
    }

    get data() {
        return this.m_data as Artboard;
    }

    get cornerRadius(): CornerRadius | undefined {
        return this.data.cornerRadius;
    }

    get autoLayout(): AutoLayout | undefined {
        const v = this._findOV(OverrideType.AutoLayout, VariableType.AutoLayout);
        return v ? v.value : this.data.autoLayout;
    }

    protected _layout(parentFrame: ShapeSize | undefined, scale: { x: number; y: number; } | undefined): void {
        const autoLayout = this.autoLayout;
        if (!autoLayout) {
            super._layout(parentFrame, scale);
            return
        }
        super._layout(parentFrame, scale);
        const childs = this.childs.filter(c => c.isVisible);
        const frame = new ShapeFrame(this.m_frame.x, this.m_frame.y, this.m_frame.width, this.m_frame.height);
        if (childs.length) this._autoLayout(autoLayout, frame);
    }

    _autoLayout(autoLayout: AutoLayout, layoutSize: ShapeSize) {
        const childs = this.childs.filter(c => c.isVisible);
        const layout = updateAutoLayout(childs, autoLayout, layoutSize);
        let hidden = 0;
        for (let i = 0, len = this.childs.length; i < len; i++) {
            const cc = this.childs[i];
            const newTransform = cc.transform.clone();
            const index = Math.min(i - hidden, layout.length - 1);
            newTransform.translateX = layout[index].x;
            newTransform.translateY = layout[index].y;
            if (!cc.isVisible) {
                hidden += 1;
            }
            cc.m_ctx.setDirty(cc);
            cc.updateLayoutArgs(newTransform, cc.frame, cc.fixedRadius);
            cc.updateFrames();
        }
        const selfframe = new ShapeFrame(0, 0, layoutSize.width, layoutSize.height);
        this.updateLayoutArgs(this.transform, selfframe, this.fixedRadius);
        this.updateFrames();
    }

    protected renderFills(): EL[] {
        return renderFills(elh, this.getFills(), this.frame, this.getPathStr(), 'fill-' + this.id);
    }

    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr(), this.data, this.radius);
    }

    protected renderProps(): { [key: string]: string } & { style: any } {
        const props: any = {
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
            preserveAspectRatio: "xMinYMin meet",
            overflow: "hidden",
        }

        const frame = this.frame;
        props.width = frame.width;
        props.height = frame.height;
        props.viewBox = `0 0 ${frame.width} ${frame.height}`;

        return props;
    }

    protected renderStaticProps(): { [key: string]: string } {
        const props: any = {
            version: "1.1",
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
            preserveAspectRatio: "xMinYMin meet",
            overflow: "hidden"
        }
        const contextSettings = this.style.contextSettings;
        if (contextSettings) {
            props.style = {
                'mix-blend-mode': contextSettings.blenMode
            };
        }
        const frame = this.frame;

        if (frame.width > frame.height) {
            props.transform = `translate(0, ${(frame.width - frame.height) / 2})`;
        } else {
            props.transform = `translate(${(frame.height - frame.width) / 2}, 0)`;
        }

        props.width = frame.width;
        props.height = frame.height;
        props.x = 0;
        props.y = 0;
        props.viewBox = `0 0 ${frame.width} ${frame.height}`;

        return props;
    }

    render(): number {
        return this.m_renderer.render(this.type);
    }

    get guides() {
        return (this.m_data as Page).guides;
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

        const border = this.getBorders();
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
        const shadows = this.getShadows();
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

        const childouterbounds = this.m_children.map(c => (c as ShapeView)._p_outerFrame);
        const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
            p.minx = Math.min(p.minx, c.x);
            p.maxx = Math.max(p.maxx, c.x + c.width);
            p.miny = Math.min(p.miny, c.y);
            p.maxy = Math.max(p.maxy, c.y + c.height);
            return p;
        }
        const _f = this.m_visibleFrame;
        const outerbounds = childouterbounds.reduce(reducer, { minx: _f.x, miny: _f.y, maxx: _f.x + _f.width, maxy: _f.y + _f.height });
        // update outer
        if (updateFrame(this.m_outerFrame, outerbounds.minx, outerbounds.miny, outerbounds.maxx - outerbounds.minx, outerbounds.maxy - outerbounds.miny)) changed = true;

        // to parent frame
        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.transform;
            if (this.isNoTransform()) {
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

        if (changed) {
            this.m_ctx.addNotifyLayout(this);
            this.m_client_x = this.m_client_y = undefined;
        }

        return changed;
    }

    get frameMaskDisabled() {
        return (this.m_data as Artboard).frameMaskDisabled;
    }

    get radius(): number[] {
        let _radius: number[];
        if (this.radiusMask) {
            const mgr = this.style.getStylesMgr()!;
            const mask = mgr.getSync(this.radiusMask) as RadiusMask
            _radius = [...mask.radius];
            this.watchRadiusMask(mask);
        } else {
            _radius = [
                this.cornerRadius?.lt ?? 0,
                this.cornerRadius?.rt ?? 0,
                this.cornerRadius?.rb ?? 0,
                this.cornerRadius?.lb ?? 0,
            ]
            this.unwatchRadiusMask();
        }
        return _radius
    }


     getOutLine() {
        return this.getPath();
    }
}