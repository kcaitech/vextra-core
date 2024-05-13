// 创建一个没有痛苦的Creator
import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../../data/document";
import { adapt2Shape, GroupShapeView, PageView, ShapeView } from "../../dataview";
import { ShapeFrame, ShapeType } from "../../data/baseclasses";
import { GroupShape, Shape } from "../../data/shape";
import { newRectShape } from "../creator";
import { ISave4Restore, LocalCmd, SelectionState } from "../coop/localcmd";
import { translate } from "../frame";

export interface GeneratorParams {
    parent: GroupShapeView;
    frame: ShapeFrame;
    transform: {
        rotation: number;
        flipH: boolean;
        flipV: boolean;
    }
    type: ShapeType;
    isFixedRatio: boolean;
    namePrefix: string;
    shape: ShapeView | undefined;
}

export class CreatorApiCaller extends AsyncApiCaller {
    private shape: Shape | undefined;
    private fakeTimer: any = null;

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('create-shape', (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = this.shape ? [this.shape.id] : [];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
    }

    private __await = false;

    generator(params: GeneratorParams) {
        try {
            if (!params.shape) {
                if (!this.__await) {
                    this.__await = true;

                    const shape = this.__gen(params) as Shape;

                    if (!shape) {
                        return;
                    }

                    this.__insert(params, shape);

                    this.updateView();

                    return this.shape;
                }
            } else {
                const shape = adapt2Shape(params.shape);
                const api = this.api;
                const page = this.page;
                const f = params.frame;

                api.shapeModifyX(page, shape, f.x);
                api.shapeModifyY(page, shape, f.y);
                api.shapeModifyWH(page, shape, f.width, f.height);

                api.shapeModifyConstrainerProportions(page, shape, params.isFixedRatio);

                this.updateView();
            }

        } catch (e) {
            console.log('CreatorApiCaller.generator:', e);
            this.exception = true;
        }
    }

    __gen(params: GeneratorParams) {
        if (params.type === ShapeType.Rectangle) {
            const page = this.page;
            let count = 1;
            page.shapes.forEach(v => {
                if (v.type === ShapeType.Rectangle) {
                    count++;
                }
            });
            const rect = newRectShape(`${params.namePrefix} ${count}`, params.frame);
            rect.rotation = params.transform.rotation;
            rect.isFlippedHorizontal = params.transform.flipH;
            rect.isFlippedVertical = params.transform.flipV;

            rect.constrainerProportions = params.isFixedRatio;

            return rect;
        }
    }

    __insert(params: GeneratorParams, shape: Shape) {
        const parent = adapt2Shape(params.parent) as GroupShape;

        this.api.shapeInsert(this.__document, this.page, parent, shape, parent.childs.length);

        this.shape = parent.childs[parent.childs.length - 1];
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}