/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ViewLayout } from "./view";
import { GroupShapeView } from "../../groupshape";
import { Shape, ShapeSize, ShapeType } from "../../../data";
import { DataView, RootView } from "../../view";
import { VarsContainer } from "../../viewctx";
import { getShapeViewId } from "../../basic";

export class GroupLayout extends ViewLayout {
    constructor(protected view: GroupShapeView) {
        super(view);
    }

    measure(
        parentFrame: ShapeSize | undefined,
        scale: { x: number, y: number } | undefined,
    ): void {
        super.measure(parentFrame, scale);
        const view = this.view;
        if (view.m_need_update_childs) {
            view.notify("childs"); // notify childs change
            view.m_need_update_childs = false;
        }
    }

    protected layoutChild(
        parentFrame: ShapeSize,
        child: Shape,
        idx: number,
        scale: { x: number, y: number } | undefined,
        varsContainer: VarsContainer | undefined,
        resue: Map<string, DataView>,
        rView: RootView | undefined,
    ) {
        let cdom: DataView | undefined = resue.get(child.id);
        const view = this.view;
        const props = { data: child, scale, varsContainer, isVirtual: view.isVirtual, layoutSize: parentFrame };
        if (cdom) {
            view.moveChild(cdom, idx);
            return cdom.layout(props);
        }
        cdom = rView && rView.getView(getShapeViewId(child.id, varsContainer));
        if (cdom) {
            // 将cdom移除再add到当前group
            const p = cdom.parent;
            if (p) p.removeChild(cdom);
            view.addChild(cdom, idx);
            return cdom.layout(props);
        }
        const comsMap = view.ctx.comsMap;
        const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
        cdom = new Com(view.ctx, props) as DataView;
        view.addChild(cdom, idx);
    }

    protected layoutChilds(parentFrame: ShapeSize, scale?: { x: number, y: number }) {
        const view = this.view;
        const varsContainer = view.varsContainer;
        const childs = view.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        view.children.forEach((c) => resue.set(c.data.id, c));
        const rootView = view.getRootView();
        for (let i = 0, len = childs.length; i < len; i++) {
            const child = childs[i];
            this.layoutChild(parentFrame, child, i, scale, varsContainer, resue, rootView);
        }
        // 删除多余的
        const removes = view.removeChilds(childs.length, Number.MAX_VALUE);
        if (rootView) rootView.addDelayDestroy(removes);
        else removes.forEach((c => c.destroy()));

        view.updateMaskMap();
    }
}