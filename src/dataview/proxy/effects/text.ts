import { updateAutoLayout, updateAutoLayoutByBorder, updateMask, ViewModifyEffect } from "./view";
import { TextShapeView } from "../../textshape";

export class TextModifyEffect extends ViewModifyEffect {
    constructor(protected view: TextShapeView) {
        super(view);
    }

    protected cacheMap: {
        [key: string]: string[];
    } = {
        childs: ['m_path', 'm_pathstr'],
        points: ['m_path', 'm_pathstr'],
        pathsegs: ['m_path', 'm_pathstr'],
        isClosed: ['m_path', 'm_pathstr'],
        cornerRadius: ['m_path', 'm_pathstr'],
        radiusMask: ['m_path', 'm_pathstr'],
        fixedRadius: ['m_path', 'm_pathstr'],
        variables: ['m_path', 'm_pathstr', 'm_fills', 'm_border', 'm_border_path', 'm_border_path_box'],
        mask: ['m_fills', 'm_border'],
        fills: ['m_fills', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        borders: ['m_border', 'm_is_border_shape'],
        fillsMask: ['m_fills', 'm_is_border_shape'],
        bordersMask: ['m_border', 'm_border_path',],
        text: ['__str'],
    }

    protected effectMap: {
        [key: string]: Function[];
    } = {
        transform: [updateAutoLayout],
        size: [updateAutoLayout],
        isVisible: [updateMask, updateAutoLayout],
        autoLayout: [updateAutoLayout],
        borders: [updateAutoLayoutByBorder],
        mask: [updateMask],
        text: [updateAutoLayout]
    }

    clearCache(taskIds: string[]) {
        const task: Set<string> = new Set();
        taskIds.forEach((id: string) => {
            const target = this.cacheMap[id];
            target && target.forEach(t => task.add(t));
        });
        task.add('m_textpath');
        this.view.cache.clearCacheByKeys(Array.from(task));
    }
}