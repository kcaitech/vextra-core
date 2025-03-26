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
import { GroupFrameProxy } from "./frame";
import { GroupLayout } from "./proxy/layout/group";

export class GroupShapeView extends ShapeView {

    get data(): GroupShape {
        return this.m_data as GroupShape;
    }

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);

        this._bubblewatcher = this._bubblewatcher.bind(this);
        this.m_data.bubblewatch(this._bubblewatcher);
        this.updateMaskMap();
        this.frameProxy = new GroupFrameProxy(this);
        this.layoutProxy = new GroupLayout(this);
    }

    protected _bubblewatcher(...args: any[]) {
        this.onChildChange(...args);
    }

    protected onChildChange(...args: any[]) {
        if (args.includes('fills') || args.includes('borders')) this.notify(...args);
    }

    maskMap: Map<string, Shape> = new Map;

    updateMaskMap() {
        const map = this.maskMap;
        map.clear();

        const children = this.getDataChilds();
        let mask: Shape | undefined = undefined;
        const maskShape: Shape[] = [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.mask && child.isVisible) {
                mask = child;
                maskShape.push(child);
            } else {
                mask && map.set(child.id, mask);
            }
        }
        this.childs.forEach(c => {
            if (c.mask) return;
            c.m_ctx.setDirty(c);
        });
        maskShape.forEach(m => m.notify('rerender-mask'));
        this.notify('mask-env-change');
    }

    get isImageFill() {
        return false;
    }

    onDestroy(): void {
        super.onDestroy();
        this.m_data.bubbleunwatch(this._bubblewatcher);
    }

    getDataChilds(): Shape[] {
        return (this.m_data as GroupShape).childs;
    }

    m_need_updatechilds: boolean = false;
}