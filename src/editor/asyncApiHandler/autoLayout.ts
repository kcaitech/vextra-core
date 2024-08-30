import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../../data/document";
import { adapt2Shape, ArtboradView, GroupShapeView, PageView, ShapeView } from "../../dataview";
import {
    GroupShape,
    Shape,
    ShapeType,
} from "../../data/shape";
import { PaddingDir } from "../shape";
import { modifyAutoLayout } from "../utils/auto_layout";
import { translate } from "../frame";
import { makeShapeTransform1By2, makeShapeTransform2By1, Page, StackSizing } from "../..//data";
import { after_migrate, unable_to_migrate } from "../utils/migrate";
import { get_state_name, is_state } from "../symbol";
import { Api } from "../coop/recordapi";

export class AutoLayoutModify extends AsyncApiCaller {
    updateFrameTargets: Set<Shape> = new Set();
    prototype = new Map<string, Shape>()
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

    private __migrate(document: Document, api: Api, page: Page, targetParent: GroupShape, shape: Shape, dlt: string, index: number) {
        const error = unable_to_migrate(targetParent, shape);
        if (error) {
            console.log('migrate error:', error);
            return;
        }
        const origin: GroupShape = shape.parent as GroupShape;

        if (origin.id === targetParent.id) {
            return;
        }

        if (is_state(shape)) {
            const name = get_state_name(shape as any, dlt);
            api.shapeModifyName(page, shape, `${origin.name}/${name}`);
        }
        const transform = makeShapeTransform2By1(shape.matrix2Root());
        const __t = makeShapeTransform2By1(targetParent.matrix2Root());

        transform.addTransform(__t.getInverse());

        api.shapeModifyTransform(page, shape, makeShapeTransform1By2(transform));
        api.shapeMove(page, origin, origin.indexOfChild(shape), targetParent, index++);

        //标记容器是否被移动到其他容器
        if (shape.parent?.isContainer && shape.parent.type !== ShapeType.Page) {
            this.prototype.set(shape.id, shape)
        } else {
            this.prototype.clear()
        }
        after_migrate(document, page, api, origin);
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