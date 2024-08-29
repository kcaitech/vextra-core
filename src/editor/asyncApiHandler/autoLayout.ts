import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../../data/document";
import { adapt2Shape, ArtboradView, GroupShapeView, PageView, ShapeView } from "../../dataview";
import {
    Shape,
} from "../../data/shape";
import { PaddingDir } from "../shape";
import { modifyAutoLayout } from "../utils/auto_layout";
import { translate } from "../frame";
import { StackSizing } from "../..//data";

export class AutoLayoutModify extends AsyncApiCaller {
    updateFrameTargets: Set<Shape> = new Set();

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('auto-layout-modify');
    }

    executePadding(shape: GroupShapeView, value: number, direction: PaddingDir) {
        try {
            const layoutShape = (shape as ArtboradView);
            if (!layoutShape.autoLayout) return;
            const api = this.api;
            const page = this.page;
            const padding = Math.max(0, Math.round(value));
            api.shapeModifyAutoLayoutPadding(page, adapt2Shape(layoutShape), padding, direction);
            modifyAutoLayout(page, api, shape);
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executePadding', e);
        }
    }

    executeHorPadding(shape: GroupShapeView, value: number, right: number) {
        try {
            const layoutShape = (shape as ArtboradView);
            if (!layoutShape.autoLayout) return;
            const api = this.api;
            const page = this.page;
            const padding = Math.max(0, Math.round(value));
            const r_padding = Math.max(0, Math.round(right));
            api.shapeModifyAutoLayoutHorPadding(page, adapt2Shape(layoutShape), padding, r_padding);
            modifyAutoLayout(page, api, shape);
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executeHorPadding', e);
        }
    }

    executeVerPadding(shape: GroupShapeView, value: number, bottom: number) {
        try {
            const layoutShape = (shape as ArtboradView);
            if (!layoutShape.autoLayout) return;
            const api = this.api;
            const page = this.page;
            const padding = Math.max(0, Math.round(value));
            const b_padding = Math.max(0, Math.round(bottom));
            api.shapeModifyAutoLayoutVerPadding(page, adapt2Shape(layoutShape), padding, b_padding);
            modifyAutoLayout(page, api, shape);
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executeVerPadding', e);
        }
    }


    executeSpace(shape: GroupShapeView, value: number, direction: PaddingDir) {
        try {
            const layoutShape = (shape as ArtboradView);
            if (!layoutShape.autoLayout) return;
            const api = this.api;
            const page = this.page;
            const space = Math.round(value);
            api.shapeModifyAutoLayoutSpace(page, adapt2Shape(layoutShape), space, direction);
            api.shapeModifyAutoLayoutGapSizing(page, adapt2Shape(layoutShape), StackSizing.Fixed, direction);
            modifyAutoLayout(page, api, shape);
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executeSpace', e);
        }
    }

    swapShapeLayout(shape: GroupShapeView, tragets: ShapeView[], x: number, y: number) {
        try {
            const layoutShape = (shape as ArtboradView);
            if (!layoutShape.autoLayout) return;
            const api = this.api;
            const page = this.page;
            for (let index = 0; index < tragets.length; index++) {
                const target = tragets[index];
                const frame = target._p_frame;
                translate(api, page, adapt2Shape(target), x - frame.x, y - frame.y);
            }
            modifyAutoLayout(page, api, shape);
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.swapShapeLayout', e);
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