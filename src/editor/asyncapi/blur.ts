import { AsyncApiCaller } from "./basic/asyncapi";
import { CoopRepository } from "../../coop/cooprepo";
import { Document } from "../../data/document";
import { PageView, ShapeView } from "../../dataview";
import { Shape } from "../../data/shape";
import { shape4blur } from "../symbol";
import { Blur } from "../../data";

export class blurModifyHandler extends AsyncApiCaller {
    updateFrameTargets: Set<Shape> = new Set();

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('blur-modify');
    }

    executeSaturation(blurs: Blur[], saturation: number) {
        try {
            const api = this.api;
            for (const blur of blurs) {
                api.shapeModifyBlurSaturation(blur, saturation);
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