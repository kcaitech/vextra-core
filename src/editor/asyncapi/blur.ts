import { AsyncApiCaller } from "./basic/asyncapi";
import { CoopRepository } from "../../coop/cooprepo";
import { Document } from "../../data/document";
import { PageView } from "../../dataview";
import { Shape } from "../../data/shape";
import { Blur } from "../../data";

export class blurModifyHandler extends AsyncApiCaller {
    updateFrameTargets: Set<Shape> = new Set();

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('blur-modify');
    }

    executeSaturation(actions: { blur: Blur, value: number }[]) {
        try {
            const api = this.api;
            for (const blur of actions) {
                api.shapeModifyBlurSaturation(blur.blur, blur.value);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('blurModifyHandler.executeSaturation', e);
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}