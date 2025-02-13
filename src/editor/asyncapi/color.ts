import { AsyncApiCaller } from "./basic/asyncapi";
import { CoopRepository } from "../../coop/cooprepo";
import { Document } from "../../data/document";
import { PageView, ShapeView, adapt2Shape } from "../../dataview";
import { shape4fill } from "../../editor/symbol";
import { PaintFilterType } from "../../data";

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

    executeImageScale(shapes: ShapeView[], scale: number, index: number) {
        try {
            const api = this.api;
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const s = shape4fill(api, this.pageView, shape);
                // api.setFillImageScale(page, s, index, scale);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('ColorPicker.executeImageScale', e);
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