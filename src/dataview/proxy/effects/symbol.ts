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