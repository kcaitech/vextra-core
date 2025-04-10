import { ContactLineView } from "../../contactline";
import { parsePath } from "../../../data";
import { ViewCache } from "./view";

export class ContactLineViewCache extends ViewCache {
    constructor(protected view: ContactLineView) {
        super(view);
    }

    get path() {
        return this.m_path ?? (this.m_path = parsePath(this.view.getPoints(), false, 1, 1, this.view.fixedRadius));
    }
}
