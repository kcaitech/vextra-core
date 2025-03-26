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
    CornerRadius, Shape, ShapeFrame, ShapeType, SymbolShape, AutoLayout, BorderPosition, Page, ShadowPosition, BlurType,
    ShapeSize,
    OverrideType,
    VariableType, SideType
} from "../data";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";
import { DataView, RootView } from "./view"
import { getShapeViewId } from "./basic";
import { updateAutoLayout } from "../editor";
import { SymbolViewCache } from "./proxy/cache/cacheProxy";

export class SymbolView extends GroupShapeView {
    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.cache = new SymbolViewCache(this);
    }
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

    get isCustomBorder() {
        return this.getBorder().sideSetting.sideType !== SideType.Normal;
    }
    render(): number {
        return this.m_renderer.render(this.type);
    }
}