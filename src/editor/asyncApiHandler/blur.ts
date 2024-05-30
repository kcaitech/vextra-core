import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../../data/document";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import {
    Shape,
} from "../../data/shape";

export class blurModifyHandler extends AsyncApiCaller {
    updateFrameTargets: Set<Shape> = new Set();

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('blur-modify');
    }

    executeSaturation(shapes: ShapeView[], saturation: number) {
        try {
            const api = this.api;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                api.shapeModifyBlurSaturation(page, adapt2Shape(shape), saturation);
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