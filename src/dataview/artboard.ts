/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { GroupShapeView } from "./groupshape";
import {
    AutoLayout,
    CornerRadius,
    Transform,
    Artboard,
    OverrideType,
    VariableType, SideType
} from "../data";
import { DViewCtx, PropsType } from "./viewctx";
import { ArtboardViewCache } from "./proxy/cache/artboard";
import { ArtboardLayout } from "./proxy/layout/artboard";
import { ArtboardModifyEffect } from "./proxy/effects/artboard";
import { ArtboardFrameProxy } from "./proxy/frame/artboard";

export class ArtboardView extends GroupShapeView {
    m_inner_transform: Transform | undefined;
    m_fixed_transform: Transform | undefined;

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.frameProxy = new ArtboardFrameProxy(this);
        this.cache = new ArtboardViewCache(this);
        this.effect = new ArtboardModifyEffect(this);
        this.layoutProxy = new ArtboardLayout(this);
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

    get guides() {
        return this.data.guides;
    }

    get frameMaskDisabled() {
        return this.data.frameMaskDisabled;
    }

    get isCustomBorder() {
        return this.getBorder().sideSetting.sideType !== SideType.Normal;
    }
}