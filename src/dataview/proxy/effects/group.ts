/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ViewModifyEffect } from "./view";
import { GroupShapeView } from "../../groupshape";

function updateByChild(view: GroupShapeView) {
    view.updateMaskMap();
    view.m_need_update_childs = true;
}

function updateAutoLayout(view: GroupShapeView) {
    if (!(view as any).autoLayout) {
        view.childs.forEach(c => {
            c.ctx.setReLayout(c);
        });
    }
    let p = view.parent;
    while (p && p.autoLayout) {
        p.ctx.setReLayout(p);
        p = p.parent;
    }
}

export class GroupModifyEffect extends ViewModifyEffect {
    constructor(protected view: GroupShapeView) {
        super(view);
    }

    protected static effectMap: {
        [key: string]: Function[];
    } = {
        ...ViewModifyEffect.effectMap,
        autoLayout: [updateAutoLayout],
        childs: [updateByChild]
    }

    emit(taskIds: string[]) {
        const task: Set<Function> = new Set();
        taskIds.forEach((id: string) => {
            const target = GroupModifyEffect.effectMap[id];
            target && target.forEach(t => task.add(t))
        });
        Array.from(task).forEach(t => t(this.view));
    }
}