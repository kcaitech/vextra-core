import { ViewModifyEffect } from "./view";
import { GroupShapeView } from "../../groupshape";
import { ArtboardView } from "../../artboard";

function updateByChild(view: GroupShapeView) {
    view.updateMaskMap();
    view.m_need_update_childs = true;
}

function updateAutoLayout(view: GroupShapeView) {
    if (!(view as any).autoLayout) {
        view.childs.forEach(c => {
            c.m_ctx.setReLayout(c);
        });
    }
    let p = view.parent as ArtboardView;
    while (p && p.autoLayout) {
        p.m_ctx.setReLayout(p);
        p = p.parent as ArtboardView;
    }
}

export function updateMask(view: GroupShapeView) {
    view.parent?.updateMaskMap();
}

export class GroupModifyEffect extends ViewModifyEffect {
    constructor(protected view: GroupShapeView) {
        super(view);
    }

    protected effectMap: {
        [key: string]: Function[];
    } = {
        transform: [updateAutoLayout],
        size: [updateAutoLayout],
        isVisible: [updateMask, updateAutoLayout],
        autoLayout: [updateAutoLayout],
        mask: [updateMask],
        childs: [updateByChild]
    }
}