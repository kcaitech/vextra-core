/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { AsyncApiCaller } from "./basic/asyncapi";
import { IRepository } from "../../repo";
import {
    Document,
    ContactForm,
    FillType,
    ShapeFrame,
    ShapeType,
    TextBehaviour,
    GroupShape,
    LineShape,
    PathShape,
    Shape,
    TextShape,
    Fill,
    BasicArray,
    Color,
    Page,
    ContactShape,
    TextAttr,
    Transform
} from "../../data";
import { adapt2Shape, GroupShapeView, PageView, ShapeView } from "../../dataview";
import {
    newArrowShape,
    newArtboard,
    newContact,
    newCutoutShape,
    newDefaultTextShape,
    newLineShape,
    newOvalShape,
    newPolygonShape,
    newRectShape,
    newStellateShape,
    newTextShape
} from "../creator/creator";
import { ISave4Restore, LocalCmd, SelectionState } from "../../repo";
import { uuid } from "../../basic/uuid";
import { Api } from "../../repo";
import { Point2D, ScrollBehavior } from "../../data/typesdefine";
import { update_frame_by_points } from "../utils/path";
import { translateTo } from "../frame";
import { Transform as Transform2 } from "../../basic/transform";

export interface GeneratorParams {
    parent: GroupShapeView;
    frame: ShapeFrame;

    type: ShapeType;
    isFixedRatio: boolean;
    namePrefix: string;
    shape: ShapeView | undefined;

    transform2: Transform;

    fill?: Fill;
    mark?: boolean;
    apex?: ContactForm;
    textFormat?: TextAttr;
}

/**
 * @description 根据shape所属环境分配一个名称
 */
export function assign(shape: Shape) {
    const parent = shape.parent as GroupShape;

    const names: Set<string> = new Set();
    for (const view of parent.childs) {
        if (view.id === shape.id) continue;
        names.add(view.name);
    }

    const reg = /\d+$/i;
    let name = shape.name;
    while (names.has(name)) {
        const match = name.match(reg)
        name = match ? name.slice(0, match.index) + (Number(match[0]) + 1) : name + ' 1';
    }
    return name;
}

export class CreatorApiCaller extends AsyncApiCaller {
    private shape: Shape | undefined;
    private __await = false;
    private __params: GeneratorParams | undefined;
    private __contactXY: { x: number, y: number } | undefined;

    constructor(repo: IRepository, document: Document, page: PageView) {
        super(repo, document, page);
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

                api.shapeModifyWH(page, shape, f.width, f.height);
                this.api.shapeModifyTransform(this.page, shape, (params.transform2.clone()));

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
            console.error(e);
            this.exception = true;
        }
    }

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

            const { x, y } = this.__contactXY!;
            translateTo(api, page, shape, x, y);

            this.updateView();
        } catch (e) {
            console.log('CreatorApiCaller.migrate:', e);
            this.exception = true;
        }
    }

    start() {
        return this.__repo.start('create-shape', (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = this.shape ? [this.shape.id] : [];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
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
                this.api.addFillAt(shape.style.fills, fill, 0);
            }

            if (!shape || !shapes.length) return;

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
            const realXY = shapes.map((s) => s.matrix2Root().computeCoord(0, 0));
            const m = (shape.matrix2Root().getInverse());
            for (let i = 0; i < shapes.length; i++) {
                const c = (shapes[i]);
                const r = realXY[i]
                const target = m.computeCoord(r.x, r.y);
                const cur = c.data.matrix2Parent().computeCoord(0, 0);
                const transform = c.data.transform;
                api.shapeModifyXY(page, c.data, transform.translateX + target.x - cur.x, transform.translateY + target.y - cur.y);
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

    private insert(params: GeneratorParams, shape: Shape) {
        const parent = adapt2Shape(params.parent) as GroupShape;
        const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
        let targetIndex = parent.childs.length;
        if (_types.includes(parent.type)) {
            const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
            const fixed_index = parent.childs.findIndex(s => s.scrollBehavior === Fixed);
            targetIndex = fixed_index === -1 ? parent.childs.length : fixed_index;
        }
        this.api.shapeInsert(this.__document, this.page, parent, shape, targetIndex);
        this.shape = parent.childs[targetIndex];
        const name = assign(this.shape);
        this.api.shapeModifyName(this.page, this.shape, name);
    }

    private getCount(type: ShapeType) {
        let count = 1;
        this.page.shapes.forEach((v: any) => {
            if (v.type === type) count++;
        });
        return count;
    }

    private gen(params: GeneratorParams) {
        const {
            type,
            namePrefix,
            frame,
            isFixedRatio,
            transform2
        } = params;

        if (type === ShapeType.Rectangle) {
            const count = this.getCount(type);

            const rect = newRectShape(`${namePrefix} ${count}`, frame, this.__document.stylesMgr);
            this.setTransform(rect, transform2, frame);

            rect.constrainerProportions = isFixedRatio;

            return rect;
        } else if (type === ShapeType.Oval) {
            const count = this.getCount(type);

            const oval = newOvalShape(`${namePrefix} ${count}`, frame, this.__document.stylesMgr);
            this.setTransform(oval, transform2, frame);

            oval.constrainerProportions = isFixedRatio;

            return oval;
        } else if (type === ShapeType.Polygon) {
            const count = this.getCount(type);

            const polygon = newPolygonShape(`${namePrefix} ${count}`, frame, this.__document.stylesMgr);
            this.setTransform(polygon, transform2, frame);

            polygon.constrainerProportions = isFixedRatio;

            return polygon;
        } else if (type === ShapeType.Star) {
            const count = this.getCount(type);

            const star = newStellateShape(`${namePrefix} ${count}`, frame, this.__document.stylesMgr);
            this.setTransform(star, transform2, frame);

            star.constrainerProportions = isFixedRatio;

            return star;
        } else if (type === ShapeType.Cutout) {
            const count = this.getCount(type);

            const cut = newCutoutShape(`${namePrefix} ${count}`, frame);
            this.setTransform(cut, transform2, frame);

            cut.constrainerProportions = isFixedRatio;

            return cut;
        } else if (type === ShapeType.Artboard) {
            const count = this.getCount(type);

            const artboard = newArtboard(`${namePrefix} ${count}`, frame, this.__document.stylesMgr);
            this.setTransform(artboard, transform2, frame);

            artboard.constrainerProportions = isFixedRatio;

            if (params.fill) {
                artboard.style.fills.push(params.fill);
            }

            return artboard;
        } else if (type === ShapeType.Text) {
            let text;
            if (params.textFormat) {
                text = newDefaultTextShape(namePrefix, this.__document.stylesMgr, params.textFormat, frame);
            } else {
                text = newTextShape(namePrefix, this.__document.stylesMgr, frame);
            }

            this.setTransform(text, transform2, frame);

            text.constrainerProportions = isFixedRatio;

            return text;
        } else if (type === ShapeType.Line) {
            const count = this.getCount(type);

            let line;
            if (params.mark) {
                line = newArrowShape(`${namePrefix} ${count}`, frame, this.__document.stylesMgr);
            } else {
                line = newLineShape(`${namePrefix} ${count}`, frame, this.__document.stylesMgr);
            }

            this.setTransform(line, transform2, frame);

            return line;
        } else if (type === ShapeType.Contact) {
            const count = this.getCount(type);

            const contact = newContact(`${namePrefix} ${count}`, frame, this.__document.stylesMgr, params.apex);

            this.setTransform(contact, transform2, frame);

            return contact;
        }
    }

    // 初始化图层的transform
    private setTransform(
        shape: Shape,
        transform: Transform,
        frame: ShapeFrame
    ) {
        shape.transform = transform.clone();
        shape.size.width = frame.width;
        shape.size.height = frame.height;
    }
}