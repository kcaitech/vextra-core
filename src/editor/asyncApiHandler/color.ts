import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../../data/document";
import { PageView } from "../../dataview";

export class ColorPicker extends AsyncApiCaller {
    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page)
    }

    start() {
        return this.__repo.start('color-picker');
    }

    execute() {
        try {
            // todo ColorPicker的异步操作
            this.updateView();
        } catch (e) {
            console.log('ColorPicker.execute:', e);
            this.exception = true;
        }
    }
}