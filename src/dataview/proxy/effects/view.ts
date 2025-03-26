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
        variables: ['m_fills', 'm_border'],
        fills: ['m_fills',],
        borders: ['m_border',],
        fillsMask: ['m_fills',],
        bordersMask: ['m_border'],
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
        this.view.cache.clearCacheByKeys(Array.from(task));
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