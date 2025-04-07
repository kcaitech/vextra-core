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
    CornerRadius, SymbolShape, AutoLayout, Page,
    OverrideType, VariableType, SideType
} from "../data";
import { DViewCtx, PropsType } from "./viewctx";
import { SymbolViewCache } from "./proxy/cache/symbol";
import { SymbolLayout } from "./proxy/layout/symbol";
import { SymbolModifyEffect } from "./proxy/effects/symbol";
import { SymbolFrameProxy } from "./proxy/frame/symbol";

export class SymbolView extends GroupShapeView {
    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.cache = new SymbolViewCache(this);
        this.layoutProxy = new SymbolLayout(this);
        this.frameProxy = new SymbolFrameProxy(this);
        this.effect = new SymbolModifyEffect(this);
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

    get isCustomBorder() {
        return this.getBorder().sideSetting.sideType !== SideType.Normal;
    }

    render(): number {
        return this.m_renderer.render();
    }
}