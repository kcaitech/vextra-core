import { AsyncApiCaller } from "./basic/asyncapi";
import { Document } from "../../data/document";
import { ArtboardView, PageView } from "../../dataview";
import { Shape } from "../../data/shape";
import { PaddingDir } from "../shape";
import { StackSizing } from "../..//data";
import { shape4Autolayout } from "../symbol";
import { CoopRepository } from "../../coop/cooprepo";

export class AutoLayoutModify extends AsyncApiCaller {
    updateFrameTargets: Set<Shape> = new Set();
    prototype = new Map<string, Shape>()
    protected _page: PageView;
    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
        this._page = page;
    }

    start() {
        return this.__repo.start('auto-layout-modify');
    }

    executePadding(shapes: ArtboardView[], value: number, direction: PaddingDir) {
        try {
            const api = this.api;
            const page = this.page;
            const padding = Math.max(0, Math.round(value));
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const __shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutPadding(page, __shape, padding, direction);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executePadding', e);
        }
    }

    executeHorPadding(shapes: ArtboardView[], value: number, right: number) {
        try {
            const api = this.api;
            const page = this.page;
            const padding = Math.max(0, Math.round(value));
            const r_padding = Math.max(0, Math.round(right));
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const __shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutHorPadding(page, __shape, padding, r_padding);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executeHorPadding', e);
        }
    }

    executeVerPadding(shapes: ArtboardView[], value: number, bottom: number) {
        try {
            const api = this.api;
            const page = this.page;
            const padding = Math.max(0, Math.round(value));
            const b_padding = Math.max(0, Math.round(bottom));
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const __shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutVerPadding(page, __shape, padding, b_padding);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executeVerPadding', e);
        }
    }

    executeSpace(shapes: ArtboardView[], value: number, direction: PaddingDir) {
        try {
            const api = this.api;
            const page = this.page;
            const space = Math.round(value);
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const __shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutSpace(page, __shape, space, direction);
                api.shapeModifyAutoLayoutGapSizing(page, __shape, StackSizing.Fixed, direction);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executeSpace', e);
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            if (this.prototype.size) {
                this.prototype.forEach((v) => {
                    this.api.delShapeProtoStart(this.page, v)
                })
            }
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}