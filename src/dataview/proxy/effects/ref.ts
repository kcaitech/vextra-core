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