import { ViewModifyEffect } from "./view";
import { PathShapeView } from "../../pathshape";

export class PathShapeViewModifyEffect extends ViewModifyEffect {
    constructor(protected view: PathShapeView) {
        super(view);
    }

    protected cacheMap: {
        [key: string]: string[];
    } = {
        pathsegs: ['m_path', 'm_pathstr'],
        radiusMask: ['m_path', 'm_pathstr'],
        variables: ['m_path', 'm_pathstr', 'm_fills', 'm_border', 'm_is_border_shape'],
        fills: ['m_fills', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        borders: ['m_border', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        fillsMask: ['m_fills', 'm_is_border_shape', 'm_border_path', 'm_border_path_box'],
        bordersMask: ['m_border', 'm_border_path', 'm_border_path_box', 'm_is_border_shape'],
    }
}