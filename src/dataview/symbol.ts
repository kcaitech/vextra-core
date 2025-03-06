/*
 * Copyright (c) 2023-2024 vextra.io. All rights reserved.
 *
 * This file is part of the vextra.io project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { GroupShapeView } from "./groupshape";
import { innerShadowId, renderBorders, renderFills } from "../render";
import { EL, elh } from "./el";
import {
    CornerRadius, Shape, ShapeFrame, ShapeType, SymbolShape, AutoLayout, BorderPosition, Page, ShadowPosition, BlurType,
    ShapeSize,
    RadiusMask,
    OverrideType,
    VariableType
} from "../data";
import { VarsContainer } from "./viewctx";
import { DataView, RootView } from "./view"
import { getShapeViewId } from "./basic";
import { ShapeView, updateFrame } from "./shape";
import { PageView } from "./page";
import { objectId } from "../basic/objectid";
import { render as clippathR } from "../render/clippath";
import { updateAutoLayout } from "../editor/utils/auto_layout2";

export class SymbolView extends GroupShapeView {
    get data() {
        return this.m_data as SymbolShape;
    }
    get cornerRadius(): CornerRadius | undefined {
        return this.data.cornerRadius;
    }

    get variables() {
        return this.data.variables;
    }

    get isSymbolUnionShape() {
        return this.data.isSymbolUnionShape;
    }

    get symtags() {
        return this.data.symtags;
    }

    get autoLayout(): AutoLayout | undefined {
        const v = this._findOV(OverrideType.AutoLayout, VariableType.AutoLayout);
        return v ? v.value : this.data.autoLayout;
    }

    get guides() {
        return (this.m_data as Page).guides;
    }

    get frameMaskDisabled() {
        return (this.m_data as SymbolShape).frameMaskDisabled;
    }

    // fills
    protected renderFills(): EL[] {
        return renderFills(elh, this.getFills(), this.frame, this.getPathStr(), 'fill-' + this.id);
    }
    // borders
    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr(), this.data, this.radius);
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

    private _autoLayout(autoLayout: AutoLayout, layoutSize: ShapeSize) {
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

    protected layoutChild(parentFrame: ShapeSize, child: Shape, idx: number, scale: { x: number, y: number } | undefined, varsContainer: VarsContainer | undefined, resue: Map<string, DataView>, rView: RootView | undefined) {
        let cdom: DataView | undefined = resue.get(child.id);
        varsContainer = [...(varsContainer || []), this.data as SymbolShape];
        const props = { data: child, scale, varsContainer, isVirtual: this.m_isVirtual, layoutSize: parentFrame };

        if (cdom) {
            this.moveChild(cdom, idx);
            cdom.layout(props);
            return;
        }

        cdom = rView && rView.getView(getShapeViewId(child.id, varsContainer));
        if (cdom) {
            // 将cdom移除再add到当前group
            const p = cdom.parent;
            if (p) p.removeChild(cdom);
            this.addChild(cdom, idx);
            cdom.layout(props);
            return;
        }

        const comsMap = this.m_ctx.comsMap;
        const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
        cdom = new Com(this.m_ctx, props) as DataView;
        this.addChild(cdom, idx);
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

        // const childouterbounds = this.m_children.map(c => (c as ShapeView)._p_outerFrame);
        // const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
        //     if (i === 0) {
        //         p.minx = c.x;
        //         p.maxx = c.x + c.width;
        //         p.miny = c.y;
        //         p.maxy = c.y + c.height;
        //     } else {
        //         p.minx = Math.min(p.minx, c.x);
        //         p.maxx = Math.max(p.maxx, c.x + c.width);
        //         p.miny = Math.min(p.miny, c.y);
        //         p.maxy = Math.max(p.maxy, c.y + c.height);
        //     }
        //     return p;
        // }
        // const outerbounds = childouterbounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
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
        }

        return changed;
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

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;

        const masked = this.masked;
        if (masked) {
            (this.getPage() as PageView)?.getView(masked.id)?.render();
            this.reset("g");
            return ++this.m_render_version;
        }

        if (!this.isVisible) {
            this.reset("g");
            return ++this.m_render_version;
        }

        const fills = this.renderFills();
        const borders = this.renderBorders();
        let childs = this.renderContents();
        const autoInfo = (this.m_data as SymbolShape).autoLayout;
        if (autoInfo && autoInfo.stackReverseZIndex) childs = childs.reverse();

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);

        let props = this.renderProps();

        let children;
        if (this.frameMaskDisabled) {
            children = [...fills, ...borders, ...childs];
        } else {
            const id = "clip-symbol-" + objectId(this);
            const clip = clippathR(elh, id, this.getPathStr());
            children = [
                clip,
                elh("g", { "clip-path": "url(#" + id + ")" }, [...fills, ...childs]),
                ...borders
            ];
        }

        // 阴影
        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, this.getShadows());
            filter = `url(#pd_outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", { filter }, children)];
        }

        // 模糊
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);
        if (blur.length) {
            if (this.blur!.type === BlurType.Gaussian) {
                children = [...blur, elh('g', { filter: `url(#${blurId})` }, children)];
            } else {
                const __props: any = {};
                if (props.opacity) {
                    __props.opacity = props.opacity;
                    delete props.opacity;
                }
                if (props.style?.["mix-blend-mode"]) {
                    __props["mix-blend-mode"] = props.style["mix-blend-mode"];
                    delete props.style["mix-blend-mode"];
                }
                children = [...blur, elh('g', __props, children)];
            }
        }

        // 遮罩
        const _mask_space = this.renderMask();
        if (_mask_space) {
            Object.assign(props.style, { transform: _mask_space.toString() });
            const id = `mask-base-${objectId(this)}`;
            const __body_transform = this.transformFromMask;
            const __body = elh("g", { style: { transform: __body_transform } }, children);
            this.bleach(__body);
            children = [__body];
            const mask = elh('mask', { id }, children);
            const rely = elh('g', { mask: `url(#${id})` }, this.relyLayers);
            children = [mask, rely];
        }

        this.reset("g", props, children);

        return ++this.m_render_version;
    }
}