import { ContactLineView } from "../../contactline";
import { ViewModifyEffect } from "./view";

export class ContactModifyEffect extends ViewModifyEffect {
    constructor(protected view: ContactLineView) {
        super(view);
    }

    emit(taskIds: string[]) {
        super.emit(taskIds);
        this.view.updateApex();
    }
}