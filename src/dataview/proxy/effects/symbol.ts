/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { GroupModifyEffect } from "./group";
import { SymbolView } from "../../symbol";

export class SymbolModifyEffect extends GroupModifyEffect {
    constructor(protected view: SymbolView) {
        super(view);
    }

    protected static cacheMap: {
        [key: string]: string[];
    } = {
        ...GroupModifyEffect.cacheMap,
        cornerRadius: ['m_path', 'm_pathstr']
    }

    clearCache(taskIds: string[]) {
        const task: Set<string> = new Set();
        taskIds.forEach((id: string) => {
            const target = SymbolModifyEffect.cacheMap[id];
            target && target.forEach(t => task.add(t));
        });
        this.view.cache.clearCacheByKeys(Array.from(task));
    }
}