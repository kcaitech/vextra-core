/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { GroupShape, Shape } from "../data";
import { ShapeView } from "./shape";
import { DViewCtx, PropsType } from "./viewctx";
import { GroupLayout } from "./proxy/layout/group";
import { GroupModifyEffect } from "./proxy/effects/group";
import { GroupFrameProxy } from "./proxy/frame/group";

export class GroupShapeView extends ShapeView {
    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this._bubble_watcher = this._bubble_watcher.bind(this);
        this.m_data.bubblewatch(this._bubble_watcher);
        this.frameProxy = new GroupFrameProxy(this);
        this.layoutProxy = new GroupLayout(this);
        this.effect = new GroupModifyEffect(this);
    }
    get data(): GroupShape {
        return this.m_data as GroupShape;
    }

    protected _bubble_watcher(...args: any[]) {
        this.onChildChange(...args);
    }

    protected onChildChange(...args: any[]) {
        if (args.includes('fills') || args.includes('borders')) this.notify(...args);
    }

    maskMap: Map<string, ShapeView> = new Map;

    // 更新遮罩层关系
    updateMaskMap() {
        const map = this.maskMap;
        const __map = new Map<string, ShapeView>();
        const needUpdate: ShapeView[] = [];
        const children = this.childs;
        let mask: ShapeView | undefined = undefined;
        for (const child of children) {
            if (child.mask && child.isVisible) {
                mask = child;
            } else if (mask) {
                __map.set(child.id, mask);
            }
            if (map.has(child.id) !== __map.has(child.id)) needUpdate.push(child);
        }
        needUpdate.forEach((child) => child.m_ctx.setDirty(child));
        this.maskMap = __map;
        this.notify('mask-env-change');
    }

    get isImageFill() {
        return false;
    }

    onDestroy(): void {
        super.onDestroy();
        this.m_data.bubbleunwatch(this._bubble_watcher);
    }

    getDataChilds(): Shape[] {
        return (this.m_data as GroupShape).childs;
    }

    m_need_update_childs: boolean = false;
}