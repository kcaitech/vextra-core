import { BoolShapeView } from "../../boolshape";
import { ViewModifyEffect } from "./view";

export class BoolModifyEffect extends ViewModifyEffect {
    constructor(protected view: BoolShapeView) {
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
        variables: ['m_path', 'm_pathstr', 'm_fills', 'm_border', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        mask: ['m_fills', 'm_border'],
        fills: ['m_fills', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        borders: ['m_border', 'm_is_border_shape'],
        fillsMask: ['m_fills', 'm_is_border_shape'],
        bordersMask: ['m_border', 'm_border_path', 'm_border_path_box', 'm_is_border_shape'],
    }
}