import { ArtboardView } from "../../artboard";
import { GroupModifyEffect } from "./group";

export class ArtboardModifyEffect extends GroupModifyEffect {
    constructor(protected view: ArtboardView) {
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
            const target = ArtboardModifyEffect.cacheMap[id];
            target && target.forEach(t => task.add(t));
        });
        this.view.cache.clearCacheByKeys(Array.from(task));
    }
}