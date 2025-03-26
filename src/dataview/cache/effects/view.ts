import { ShapeView } from "../../shape";
import { ArtboardView } from "../../artboard";

export function updateAutoLayout(view: ShapeView) {
    let p = view.parent as ArtboardView;
    while (p && p.autoLayout) {
        p.m_ctx.setReLayout(p);
        p = p.parent as ArtboardView;
    }
}

export function updateAutoLayoutByBorder(view: ShapeView) {
    let p = view.parent as ArtboardView;
    while (p && p.autoLayout) {
        if (p.autoLayout?.bordersTakeSpace) {
            p.m_ctx.setReLayout(p);
        }
        p = p.parent as ArtboardView;
    }
}

export function updateMask(view: ShapeView) {
    view.parent?.updateMaskMap();
}

export class ViewModifyEffect {
    constructor(protected view: ShapeView) {
    }

    protected cacheMap: {
        [key: string]: string[];
    } = {
        points: ['m_path', 'm_pathstr'],
        pathsegs: ['m_path', 'm_pathstr'],
        isClosed: ['m_path', 'm_pathstr'],
        radiusMask: ['m_path', 'm_pathstr'],
        fixedRadius: ['m_path', 'm_pathstr'],
        variables: ['m_path', 'm_pathstr', 'm_fills', 'm_border', 'm_is_border_shape'],
        mask: ['m_fills', 'm_border'],
        fills: ['m_fills', 'm_is_border_shape'],
        borders: ['m_border', 'm_is_border_shape'],
        fillsMask: ['m_fills', 'm_is_border_shape'],
        bordersMask: ['m_border', 'm_border_path', 'm_border_path_box', 'm_is_border_shape'],
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
    }

    clearCache(taskIds: string[]) {
        const task: Set<string> = new Set();
        taskIds.forEach((id: string) => {
            const target = this.cacheMap[id];
            target && target.forEach(t => task.add(t));
        });
        this.view.cache.clearCacheByKey(Array.from(task));
    }

    emit(taskIds: string[]) {
        const task: Set<Function> = new Set();
        taskIds.forEach((id: string) => {
            const target = this.effectMap[id];
            target && target.forEach(t => task.add(t))
        });
        Array.from(task).forEach(t => t(this.view));
    }
}