import { GroupModifyEffect } from "./group";
import { SymbolView } from "../../symbol";

export class SymbolModifyEffect extends GroupModifyEffect {
    constructor(protected view: SymbolView) {
        super(view);
    }

    protected cacheMap: {
        [key: string]: string[];
    } = {
        variables: ['m_fills', 'm_border'],
        fills: ['m_fills'],
        borders: ['m_border'],
        fillsMask: ['m_fills'],
        bordersMask: ['m_border'],
        cornerRadius: ['m_path', 'm_pathstr'],
        radiusMask: ['m_path', 'm_pathstr'],
    }
}