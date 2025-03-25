/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { GroupShapeView } from "./groupshape";
import {
    AutoLayout,
    CornerRadius,
    Page,
    ShapeFrame,
    Transform,
    Artboard,
    ShapeSize,
    RadiusMask,
    OverrideType,
    VariableType, SideType
} from "../data";
import { updateAutoLayout } from "../editor";
import { ArtboardFrameProxy, FrameProxy } from "./frame";
import { DViewCtx, PropsType } from "./viewctx";

export class ArtboardView extends GroupShapeView {
    m_inner_transform: Transform | undefined;
    m_fixed_transform: Transform | undefined;
    m_frame_proxy: FrameProxy;

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.m_frame_proxy = new ArtboardFrameProxy(this);
    }
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
        const frame = new ShapeFrame(this.frame.x, this.frame.y, this.frame.width, this.frame.height);
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

    render(): number {
        return this.m_renderer.render(this.type);
    }

    get guides() {
        return (this.m_data as Page).guides;
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

    get isCustomBorder() {
        return !(this.getBorder().sideSetting.sideType === SideType.Normal);
    }
}