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
        variables: ['m_path', 'm_pathstr', 'm_fills', 'm_border', 'm_border_path', 'm_border_path_box', 'm_str'],
        fills: ['m_fills', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        borders: ['m_border', 'm_is_border_shape'],
        fillsMask: ['m_fills', 'm_is_border_shape'],
        bordersMask: ['m_border', 'm_border_path',],
        text: ['m_str'],
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