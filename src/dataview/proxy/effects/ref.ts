import { updateAutoLayout, updateAutoLayoutByBorder, updateMask, ViewModifyEffect } from "./view";
import { SymbolRefView } from "../../symbolref";

export class RefViewModifyEffect extends ViewModifyEffect {
    constructor(protected view: SymbolRefView) {
        super(view);
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
        childs: [updateMask],
    }

    emit(taskIds: string[]) {
        super.emit(taskIds);
        this.view.loadsym();
    }
}