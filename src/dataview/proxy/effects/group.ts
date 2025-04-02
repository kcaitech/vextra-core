import { ViewModifyEffect } from "./view";
import { GroupShapeView } from "../../groupshape";

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
    let p = view.parent;
    while (p && p.autoLayout) {
        p.m_ctx.setReLayout(p);
        p = p.parent;
    }
}

export class GroupModifyEffect extends ViewModifyEffect {
    constructor(protected view: GroupShapeView) {
        super(view);
    }

    protected static effectMap: {
        [key: string]: Function[];
    } = {
        ...ViewModifyEffect.effectMap,
        autoLayout: [updateAutoLayout],
        childs: [updateByChild]
    }

    emit(taskIds: string[]) {
        const task: Set<Function> = new Set();
        taskIds.forEach((id: string) => {
            const target = GroupModifyEffect.effectMap[id];
            target && target.forEach(t => task.add(t))
        });
        Array.from(task).forEach(t => t(this.view));
    }
}