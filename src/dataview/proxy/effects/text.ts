/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { updateAutoLayout, ViewModifyEffect } from "./view";
import { TextShapeView } from "../../textshape";

export class TextModifyEffect extends ViewModifyEffect {
    constructor(protected view: TextShapeView) {
        super(view);
    }

    protected static cacheMap: {
        [key: string]: string[];
    } = {
        ...ViewModifyEffect.cacheMap,
        childs: ['m_path', 'm_pathstr'],
        points: ['m_path', 'm_pathstr'],
        pathsegs: ['m_path', 'm_pathstr'],
        isClosed: ['m_path', 'm_pathstr'],
        cornerRadius: ['m_path', 'm_pathstr'],
        radiusMask: ['m_path', 'm_pathstr'],
        fixedRadius: ['m_path', 'm_pathstr'],
        variables: ['m_path', 'm_pathstr', 'm_fills', 'm_border', 'm_border_path', 'm_border_path_box', 'm_text'],
        fills: ['m_fills', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        borders: ['m_border', 'm_is_border_shape'],
        fillsMask: ['m_fills', 'm_is_border_shape'],
        bordersMask: ['m_border', 'm_border_path',],
        text: ['m_text'],
    }

   protected static effectMap: {
        [key: string]: Function[];
    } = {
        ...ViewModifyEffect.effectMap,
        text: [updateAutoLayout]
    }

    clearCache(taskIds: string[]) {
        const task: Set<string> = new Set();
        taskIds.forEach((id: string) => {
            const target = TextModifyEffect.cacheMap[id];
            target && target.forEach(t => task.add(t));
        });
        task.add('m_textpath');
        this.view.cache.clearCacheByKeys(Array.from(task));
    }

    emit(taskIds: string[]) {
        const task: Set<Function> = new Set();
        taskIds.forEach((id: string) => {
            const target = TextModifyEffect.effectMap[id];
            target && target.forEach(t => task.add(t))
        });
        Array.from(task).forEach(t => t(this.view));
        this.view.getText().dropAllLayout();
    }
}