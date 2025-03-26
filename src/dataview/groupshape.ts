/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    GroupShape,
    Shape,
    ShapeSize,
    ShapeType
} from "../data";
import { ShapeView } from "./shape";
import { getShapeViewId } from "./basic";
import { DataView, RootView } from "./view";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";
import { GroupFrameProxy } from "./frame";

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

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        
        if (args.includes('childs')) {
            this.updateMaskMap();
            this.m_need_updatechilds = true;
        }

        if (args.includes('autoLayout') && !(this as any).autoLayout) {
            this.childs.forEach(c => {
                c.m_ctx.setReLayout(c);
            });
        }
    }

    protected _layout(
        parentFrame: ShapeSize | undefined,
        scale: { x: number, y: number } | undefined,
    ): void {
        super._layout(parentFrame, scale);
        if (this.m_need_updatechilds) {
            this.notify("childs"); // notify childs change
            this.m_need_updatechilds = false;
        }
    }

    protected layoutChild(
        parentFrame: ShapeSize,
        child: Shape, idx: number,
        scale: { x: number, y: number } | undefined,
        varsContainer: VarsContainer | undefined,
        resue: Map<string, DataView>,
        rView: RootView | undefined,
    ) {
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, scale, varsContainer, isVirtual: this.m_isVirtual, layoutSize: parentFrame };
        if (cdom) {
            this.moveChild(cdom, idx);
            return cdom.layout(props);
        }
        cdom = rView && rView.getView(getShapeViewId(child.id, varsContainer));
        if (cdom) {
            // 将cdom移除再add到当前group
            const p = cdom.parent;
            if (p) p.removeChild(cdom);
            this.addChild(cdom, idx);
            return cdom.layout(props);
        }
        const comsMap = this.m_ctx.comsMap;
        const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
        cdom = new Com(this.m_ctx, props) as DataView;
        this.addChild(cdom, idx);
    }

    protected layoutChilds(
        parentFrame: ShapeSize,
        scale?: { x: number, y: number }): void {
        const varsContainer = this.varsContainer;
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        const rootView = this.getRootView();
        for (let i = 0, len = childs.length; i < len; i++) {
            const child = childs[i];
            this.layoutChild(parentFrame, child, i, scale, varsContainer, resue, rootView);
        }
        // 删除多余的
        const removes = this.removeChilds(childs.length, Number.MAX_VALUE);
        if (rootView) rootView.addDelayDestroy(removes);
        else removes.forEach((c => c.destroy()));
    }
}