/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ShapeView } from "../../shape";

export function updateAutoLayout(view: ShapeView) {
    let p = view.parent;
    while (p && p.autoLayout) {
        p.m_ctx.setReLayout(p);
        p = p.parent;
    }
}

export function updateAutoLayoutByBorder(view: ShapeView) {
    let p = view.parent;
    while (p && p.autoLayout) {
        if (p.autoLayout?.bordersTakeSpace) {
            p.m_ctx.setReLayout(p);
        }
        p = p.parent;
    }
}

export function updateMask(view: ShapeView) {
    view.parent?.updateMaskMap();
}

export class ViewModifyEffect {
    constructor(protected view: ShapeView) {
    }

    protected static cacheMap: {
        [key: string]: string[];
    } = {
        variables: ['m_fills', 'm_border'],
        fills: ['m_fills'],
        borders: ['m_border'],
        fillsMask: ['m_fills'],
        bordersMask: ['m_border'],
        radiusMask: ['m_path', 'm_pathstr']
    }

    protected static effectMap: {
        [key: string]: Function[];
    } = {
        variables: [updateMask],
        transform: [updateAutoLayout],
        size: [updateAutoLayout],
        isVisible: [updateMask, updateAutoLayout],
        borders: [updateAutoLayoutByBorder],
        mask: [updateMask],
    }

    clearCache(taskIds: string[]) {
        const task: Set<string> = new Set();
        taskIds.forEach((id: string) => {
            const target = ViewModifyEffect.cacheMap[id];
            target && target.forEach(t => task.add(t));
        });
        this.view.cache.clearCacheByKeys(Array.from(task));
    }

    emit(taskIds: string[]) {
        const task: Set<Function> = new Set();
        taskIds.forEach((id: string) => {
            const target = ViewModifyEffect.effectMap[id];
            target && target.forEach(t => task.add(t))
        });
        Array.from(task).forEach(t => t(this.view));
    }
}