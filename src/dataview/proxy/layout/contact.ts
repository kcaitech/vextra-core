import { ViewLayout } from "./view";
import { ContactLineView } from "../../contactline";
import { PropsType } from "../../viewctx";

export class ContactLayout extends ViewLayout {
    constructor(protected view: ContactLineView) {
        super(view);
    }

    layout(props?: PropsType) {
        const view = this.view;
        view.m_ctx.removeReLayout(view);
        view.m_ctx.tails.add(view);
    }
}