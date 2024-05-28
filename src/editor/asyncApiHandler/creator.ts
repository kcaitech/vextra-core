// 创建一个没有痛苦的Creator
import {AsyncApiCaller} from "./AsyncApiCaller";
import {CoopRepository} from "../coop/cooprepo";
import {Document} from "../../data/document";
import {adapt2Shape, GroupShapeView, PageView, ShapeView} from "../../dataview";
import {ContactForm, FillType, ShapeFrame, ShapeType, TextBehaviour} from "../../data/baseclasses";
import {GroupShape, LineShape, PathShape, Shape, TextShape} from "../../data/shape";
import {
    newArrowShape,
    newArtboard, newContact,
    newCutoutShape, newDefaultTextShape,
    newLineShape,
    newOvalShape,
    newPolygonShape,
    newRectShape,
    newStellateShape,
    newTextShape
} from "../creator";
import {ISave4Restore, LocalCmd, SelectionState} from "../coop/localcmd";
import {Fill} from "../../data/style";
import {BasicArray} from "../../data/basic";
import {uuid} from "../../basic/uuid";
import {Color} from "../../data/color";
import {Matrix} from "../../basic/matrix";
import {Page} from "../../data/page";
import {Api} from "../coop/recordapi";
import {Point2D} from "../../data/typesdefine";
import {update_frame_by_points} from "../utils/path";
import {ContactShape} from "../../data/contact";
import {translateTo} from "../frame";
import {TextAttr} from "../../data/text";
import {getShapeTransform2, updateShapeTransformBy2} from "../../data/shape_transform2";

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

    fill?: Fill;
    mark?: boolean;
    apex?: ContactForm;
    textFormat?: TextAttr;
}

export class CreatorApiCaller extends AsyncApiCaller {
    private shape: Shape | undefined;

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    private __await = false;
    private __params: GeneratorParams | undefined;

    private gen(params: GeneratorParams) {
        const {
            type,
            namePrefix,
            transform,
            frame,
            isFixedRatio
        } = params;

        if (type === ShapeType.Rectangle) {
            const count = this.getCount(type);

            const rect = newRectShape(`${namePrefix} ${count}`, frame);
            this.setTransform(rect, transform);

            rect.constrainerProportions = isFixedRatio;

            return rect;
        } else if (type === ShapeType.Oval) {
            const count = this.getCount(type);

            const oval = newOvalShape(`${namePrefix} ${count}`, frame);
            this.setTransform(oval, transform);

            oval.constrainerProportions = isFixedRatio;

            return oval;
        } else if (type === ShapeType.Polygon) {
            const count = this.getCount(type);

            const polygon = newPolygonShape(`${namePrefix} ${count}`, frame);
            this.setTransform(polygon, transform);

            polygon.constrainerProportions = isFixedRatio;

            return polygon;
        } else if (type === ShapeType.Star) {
            const count = this.getCount(type);

            const star = newStellateShape(`${namePrefix} ${count}`, frame);
            this.setTransform(star, transform);

            star.constrainerProportions = isFixedRatio;

            return star;
        } else if (type === ShapeType.Cutout) {
            const count = this.getCount(type);

            const cut = newCutoutShape(`${namePrefix} ${count}`, frame);
            this.setTransform(cut, transform);

            cut.constrainerProportions = isFixedRatio;

            return cut;
        } else if (type === ShapeType.Artboard) {
            const count = this.getCount(type);

            const artboard = newArtboard(`${namePrefix} ${count}`, frame);
            this.setTransform(artboard, transform);

            artboard.constrainerProportions = isFixedRatio;

            if (params.fill) {
                artboard.style.fills.push(params.fill);
            }

            return artboard;
        } else if (type === ShapeType.Text) {
            let text;
            if (params.textFormat) {
                text = newDefaultTextShape(namePrefix, params.textFormat, frame);
            } else {
                text = newTextShape(namePrefix, frame);
            }

            this.setTransform(text, transform);

            text.constrainerProportions = isFixedRatio;

            return text;
        } else if (type === ShapeType.Line) {
            const count = this.getCount(type);

            let line;
            if (params.mark) {
                line = newArrowShape(`${namePrefix} ${count}`, frame);
            } else {
                line = newLineShape(`${namePrefix} ${count}`, frame);
            }

            this.setTransform(line, transform);

            return line;
        } else if (type === ShapeType.Contact) {
            const count = this.getCount(type);

            const contact = newContact(`${namePrefix} ${count}`, frame, params.apex);

            this.setTransform(contact, transform);

            return contact;
        }
    }

    // 初始化图层的transform
    private setTransform(shape: Shape, trans: { rotation: number, flipH: boolean, flipV: boolean }) {
        const transform2 = getShapeTransform2(shape);
        transform2.setRotateZ((shape.rotation % 360) / 180 * Math.PI);
        transform2.setFlipH(shape.isFlippedHorizontal);
        transform2.setFlipV(shape.isFlippedVertical);
        updateShapeTransformBy2(shape, transform2);
    }

    private insert(params: GeneratorParams, shape: Shape) {
        const parent = adapt2Shape(params.parent) as GroupShape;

        this.api.shapeInsert(this.__document, this.page, parent, shape, parent.childs.length);

        this.shape = parent.childs[parent.childs.length - 1];
    }

    private getCount(type: ShapeType) {
        let count = 1;
        this.page.shapes.forEach(v => {
            if (v.type === type) {
                count++;
            }
        });

        return count;
    }

    start() {
        return this.__repo.start('create-shape', (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = this.shape ? [this.shape.id] : [];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
    }

    generator(params: GeneratorParams) {
        try {
            this.__params = params;

            if (!params.shape) {
                if (!this.__await) {
                    this.__await = true;

                    const shape = this.gen(params) as Shape;

                    if (!shape) {
                        return;
                    }

                    this.insert(params, shape);

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

                if (shape instanceof TextShape) {
                    const textBehaviour = shape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;
                    if (textBehaviour !== TextBehaviour.FixWidthAndHeight) {
                        api.shapeModifyTextBehaviour(page, shape.text, TextBehaviour.FixWidthAndHeight);
                    }
                }

                this.updateView();
            }
        } catch (e) {
            console.log('CreatorApiCaller.generator:', e);
            this.exception = true;
        }
    }

    contactTo(end: { x: number, y: number }, to?: ContactForm) {
        try {
            if (!(this.shape instanceof ContactShape)) {
                return;
            }
            const api = this.api;
            const page = this.page;
            const shape = this.shape;

            api.shapeModifyCurvPoint(page, shape, 1, end, 0);

            const _to = this.shape.to;

            if ((_to && !to) || (to && !_to)) {
                api.shapeModifyContactTo(page, shape, to);
            }

            this.updateView();
        } catch (e) {
            console.log('CreatorApiCaller.contactTo:', e);
            this.exception = true;
        }
    }

    private __contactXY: { x: number, y: number } | undefined;

    migrate(targetEnv: GroupShapeView) {
        try {
            const target = adapt2Shape(targetEnv);
            const shape = this.shape;
            if (!(target instanceof GroupShape) || !shape) {
                return;
            }

            const origin: GroupShape = shape.parent as GroupShape;

            if (!this.__contactXY) {
                this.__contactXY = shape.matrix2Root().computeCoord2(0, 0);
            }

            let toIdx = target.childs.length;
            if (origin.id === target.id) --toIdx;

            const api = this.api;
            const page = this.page;

            api.shapeMove(page, origin, origin.indexOfChild(shape), target, toIdx);

            const {x, y} = this.__contactXY!;
            translateTo(api, page, shape, x, y);

            this.updateView();
        } catch (e) {
            console.log('CreatorApiCaller.migrate:', e);
            this.exception = true;
        }
    }

    extendLine(start: Point2D, end: Point2D) {
        try {
            if (!(this.shape instanceof PathShape)) {
                return;
            }

            const [baseStart, baseEnd] = this.shape.pathsegs[0].points;
            if (!baseStart || !baseEnd) return;

            const page = this.page;
            const api = this.api;
            const shape = this.shape;

            if (baseStart.x !== start.x || baseStart.y !== start.y) {
                api.shapeModifyCurvPoint(page, shape, 0, start, 0);
            }

            if (baseEnd.x !== end.x || baseEnd.y !== end.y) {
                api.shapeModifyCurvPoint(page, shape, 1, end, 0);
            }

            this.updateView();
        } catch (e) {
            console.log('CreatorApiCaller.extendLine:', e);
            this.exception = true;
        }
    }

    collect(shapes: ShapeView[]) {
        try {
            const shape = this.shape as GroupShape;

            if (this.__params?.parent.type === ShapeType.Page) {
                const color = new Color(1, 255, 255, 255);
                const fill = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, color);
                this.api.addFillAt(this.page, shape, fill, 0);
            }

            if (!shape || !shapes.length) {
                return;
            }

            const api = this.api;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const s = adapt2Shape(shapes[i]);
                const p = s.parent as any as GroupShape;
                const idx = p.indexOfChild(s);
                api.shapeMove(page, p, idx, shape, 0);
                if (p.childs.length <= 0) {
                    deleteEmptyGroupShape(this.__document, page, s, api);
                }
            }
            const realXY = shapes.map((s) => s.frame2Root());
            const t_xy = shape.frame;
            const savep = adapt2Shape(shapes[0].parent!) as GroupShape;
            const m = new Matrix(savep.matrix2Root().inverse);
            for (let i = 0; i < shapes.length; i++) {
                const c = adapt2Shape(shapes[i]);
                const r = realXY[i]
                const target = m.computeCoord(r.x, r.y);
                const cur = c.matrix2Parent().computeCoord(0, 0);
                api.shapeModifyX(page, c, c.frame.x + target.x - cur.x - t_xy.x);
                api.shapeModifyY(page, c, c.frame.y + target.y - cur.y - t_xy.y);
            }

            function deleteEmptyGroupShape(document: Document, page: Page, shape: Shape, api: Api): boolean {
                const p = shape.parent as GroupShape;
                if (!p) return false;
                api.shapeDelete(document, page, p, p.indexOfChild(shape))
                if (p.childs.length <= 0) {
                    deleteEmptyGroupShape(document, page, p, api)
                }
                return true;
            }
        } catch (e) {
            console.log('CreatorApiCaller.collect:', e);
            this.exception = true;
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {

            if (this.shape instanceof LineShape) { // 线条的宽高最后根据两个点的位置计算
                update_frame_by_points(this.api, this.page, this.shape, true);
            }

            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}