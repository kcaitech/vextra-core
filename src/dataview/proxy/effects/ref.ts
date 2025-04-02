import { updateAutoLayout, updateMask, ViewModifyEffect } from "./view";
import { SymbolRefView } from "../../symbolref";

export class RefViewModifyEffect extends ViewModifyEffect {
    constructor(protected view: SymbolRefView) {
        super(view);
    }

    protected static effectMap: {
        [key: string]: Function[];
    } = {
        ...ViewModifyEffect.effectMap,
        autoLayout: [updateAutoLayout],
        childs: [updateMask],
    }

    emit(taskIds: string[]) {
        super.emit(taskIds);
        this.view.loadsym();
    }
}