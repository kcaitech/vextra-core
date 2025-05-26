/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ViewModifyEffect } from "./view";
import { PathShapeView } from "../../pathshape";

export class PathShapeViewModifyEffect extends ViewModifyEffect {
    constructor(protected view: PathShapeView) {
        super(view);
    }

    protected static cacheMap: {
        [key: string]: string[];
    } = {
        ...ViewModifyEffect.cacheMap,
        pathsegs: ['m_path', 'm_pathstr', 'm_border_path', 'm_border_path_box'],
        radiusMask: ['m_path', 'm_pathstr', 'm_border_path', 'm_border_path_box'],
        variables: ['m_path', 'm_pathstr', 'm_fills', 'm_border', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        fills: ['m_fills', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        borders: ['m_border', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        fillsMask: ['m_fills', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        bordersMask: ['m_border', 'm_border_path', 'm_border_path_box', 'm_is_border_shape'],
    }

    clearCache(taskIds: string[]) {
        const task: Set<string> = new Set();
        taskIds.forEach((id: string) => {
            const target = PathShapeViewModifyEffect.cacheMap[id];
            target && target.forEach(t => task.add(t));
        });
        this.view.cache.clearCacheByKeys(Array.from(task));
    }
}