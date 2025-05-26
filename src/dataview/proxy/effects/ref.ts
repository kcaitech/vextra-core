/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { updateAutoLayout, updateMask, ViewModifyEffect } from "./view";
import { SymbolRefView } from "../../symbolref";

export class RefViewModifyEffect extends ViewModifyEffect {
    constructor(protected view: SymbolRefView) {
        super(view);
    }

    protected static cacheMap: {
        [key: string]: string[];
    } = {
        ...ViewModifyEffect.effectMap,
        variables: ['m_fills', 'm_border', 'm_path', 'm_pathstr'],
        cornerRadius: ['m_path', 'm_pathstr']
    }

    protected static effectMap: {
        [key: string]: Function[];
    } = {
        ...ViewModifyEffect.effectMap,
        autoLayout: [updateAutoLayout],
        childs: [updateMask],
    }

    clearCache(taskIds: string[]) {
        const task: Set<string> = new Set();
        taskIds.forEach((id: string) => {
            const target = RefViewModifyEffect.cacheMap[id];
            target && target.forEach(t => task.add(t));
        });
        this.view.cache.clearCacheByKeys(Array.from(task));
    }
    emit(taskIds: string[]) {
        super.emit(taskIds);
        this.view.loadsym();
    }
}