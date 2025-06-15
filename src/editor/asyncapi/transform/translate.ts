/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { CoopRepository } from "../../../repo";
import { AsyncApiCaller } from "../basic/asyncapi";
import { adapt2Shape, ArtboardView, GroupShapeView, PageView, ShapeView, TextShapeView } from "../../../dataview";
import {
    Artboard, Document, GroupShape, Page, ScrollBehavior, Shape, ShapeType, StackMode, Transform,
} from "../../../data";
import { after_migrate, unable_to_migrate } from "../../utils/migrate";
import { get_state_name, is_state } from "../../symbol";
import { Api } from "../../../repo";
import { ISave4Restore, LocalCmd, SelectionState } from "../../../repo";
import { TidyUpAlign, tidyUpLayout } from "../../utils/auto_layout";
import { translate } from "../../frame";
import { transform_data } from "../../../io/cilpboard";
import { BasicError } from "../../../basic/error";
import { assign } from "../creator";

export type TranslateUnit = {
    shape: ShapeView;
    transform: Transform
}
export type TidyUpInfo = {
    shapes: ShapeView[][]
    horSpace: number
    verSpace: number
    dir: boolean
}

export interface TranslateBaseItem {
    transformRaw: Transform,
    transform: Transform;
    view: ShapeView;
}

export interface MigrateItem {
    view: ShapeView;
    toParent: ShapeView;
    allowSameEnv?: boolean; // 允许在同一父级下migrate
    index?: number;
}

export class Transporter extends AsyncApiCaller {
    need_layout_shape: Set<Artboard> = new Set();
    prototype = new Map<string, Shape>()
    shapes: (Shape | ShapeView)[] = [];
    need_assign: Set<Shape> = new Set();

    constructor(repo: CoopRepository, document: Document, page: PageView, shapes: ShapeView[]) {
        super(repo, document, page)
        this.shapes = shapes;
    }

    start() {
        return this.__repo.start('sync-translate', (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = this.shapes.map(i => i.id);
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
    }

    execute(translateUnits: TranslateUnit[]) {
        try {
            const api = this.api;
            for (let i = 0; i < translateUnits.length; i++) {
                const unit = translateUnits[i];
                const shape = adapt2Shape(unit.shape);
                api.shapeModifyTransform(this.page, shape, unit.transform);
            }
            this.updateView();
        } catch (error) {
            console.error('Transporter.execute:', error);
            this.exception = true;
        }
    }

    migrate(items: MigrateItem[], dlt: string) {
        try {
            const api = this.api;
            const page = this.page;
            // const porter = new ShapePorter(api, page);
            const document = this.__document;

            for (const item of items) {
                if (item.toParent === item.view.parent && !item.allowSameEnv) continue;

                const toParent = (item.toParent);
                const shape = (item.view);
                const maxL = toParent.childs.length;
                const index = Math.min(item.index ?? maxL, maxL);
                this.__migrate(document, api, page, toParent, shape, dlt, index);

                const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                if (_types.includes(toParent.type)) {
                    const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                    const sortedArr = [...(toParent).childs].sort((a, b) => {
                        if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                            return -1;
                        } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                            return 1;
                        }
                        return 0;
                    });
                    for (let j = 0; j < sortedArr.length; j++) {
                        const s = sortedArr[j];
                        const currentIndex = (toParent).childs.indexOf(s);
                        if (currentIndex !== j) {
                            api.shapeMove(page, adapt2Shape(toParent) as GroupShape, currentIndex, adapt2Shape(toParent) as GroupShape, j);
                        }
                    }
                }
            }

            this.updateView();

            return true;
        } catch (e) {
            console.error(e);
            this.exception = true;
            return false;
        }
    }

    private __migrateText(api: Api, page: Page, shape: ShapeView) {
        if (shape instanceof TextShapeView && shape.getText() !== shape.data.text) {
            const text = shape.getText();
            api.deleteText2(page, (shape.data), 0, shape.data.text.length)
            api.insertComplexText2(page, shape.data, 0, text.getTextWithFormat(0, text.length - 1)) // 去掉最后个回车
            // size也要
            const size = shape.size
            api.shapeModifyWH(page, shape.data, size.width, size.height)
        } else {
            shape.childs.forEach(c => this.__migrateText(api, page, c))
        }
    }

    private __migrate(document: Document, api: Api, page: Page, target: ShapeView, view: ShapeView, dlt: string, index: number) {
        // todo 尽量用shapeview，而不是用data的shape
        const targetParent = adapt2Shape(target) as GroupShape
        const shape = adapt2Shape(view)
        const error = unable_to_migrate(targetParent, shape);
        if (error) throw new BasicError(`error type ${error}`);

        const viewparent: ShapeView = view.parent!;
        const origin = adapt2Shape(viewparent) as GroupShape
        if (is_state(shape)) {
            const name = get_state_name(shape as any, dlt);
            api.shapeModifyName(page, shape, `${origin.name}/${name}`);
        }
        const transform = (shape.matrix2Root());
        const __t = (targetParent.matrix2Root());

        transform.multi(__t.getInverse());

        api.shapeModifyTransform(page, shape, (transform));

        let originIndex = origin.indexOfChild(shape)
        if (origin.id === targetParent.id && originIndex < index) index--;
        // 如果是textshape，需要同步text内容（可能是变量）
        // 遍历shape及其子shape，如果是text且与data的text不同，则进行修改
        this.__migrateText(api, page, view)
        api.shapeMove(page, origin, originIndex, targetParent, index);

        //标记容器是否被移动到其他容器
        if (shape.parent?.isContainer && shape.parent.type !== ShapeType.Page) {
            this.prototype.set(shape.id, shape)
        } else {
            this.prototype.clear()
        }
        if ((viewparent as ArtboardView).autoLayout) this.need_layout_shape.add(origin);
        if ((target as ArtboardView).autoLayout) this.need_layout_shape.add(targetParent);
        after_migrate(document, page, api, origin);
        return true;
    }

    swap(shape: GroupShapeView, targets: ShapeView[], targetIndex: number) {
        try {
            const api = this.api;
            const parent = adapt2Shape(shape) as GroupShape;
            for (let index = 0; index < targets.length; index++) {
                const target = adapt2Shape(targets[index]);
                const currentIndex = parent.indexOfChild(target);
                api.shapeMove(this.page, parent, currentIndex, parent, targetIndex);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.error('Transporter.swap', e);
        }
    }

    reflect: Map<string, Shape> | undefined;

    drawn(
        views: ShapeView[],
        transform: Map<string, TranslateBaseItem>,
        env?: Map<ShapeView, { parent: ShapeView, index: number }>
    ) {
        try {
            const api = this.api;
            const page = this.page;
            const document = this.__document;
            const reflect: Map<string, Shape> = new Map();
            const results: Shape[] = [];
            const layoutSet = this.need_layout_shape;
            const assignSet = this.need_assign;
            const shapes = views.map(v => adapt2Shape(v))
            const copy = transform_data(document, shapes);
            for (let i = 0; i < views.length; i++) {
                const view = views[i];
                const shape = shapes[i];
                const parent = shape.parent! as GroupShape;
                const index = parent.indexOfChild(shape);

                const source = copy[i];
                const __shape = api.shapeInsert(document, page, parent, source, index + 1);
                results.push(__shape);
                reflect.set(__shape.id, shape);
                assignSet.add(__shape);

                if (env) {
                    const original = env.get(view)!;
                    const originalParent = adapt2Shape(original.parent) as GroupShape;

                    let targetIndex = (parent.id === originalParent.id && index < original.index)
                        ? original.index - 1
                        : original.index;
                    targetIndex = Math.max(0, Math.min(originalParent.childs.length, targetIndex));

                    api.shapeMove(page, parent, index, originalParent, targetIndex);

                    if ((original.parent as ArtboardView)?.autoLayout) layoutSet.add(originalParent);
                    if ((view.parent as ArtboardView)?.autoLayout) layoutSet.add(parent);
                }

                api.shapeModifyTransform(page, shape, transform.get(view.id)!.transformRaw);
            }

            this.reflect = reflect;
            this.updateView();
            return results;
        } catch (e) {
            this.exception = true;
            console.error(e);
        }
    }

    revert(shapes: ShapeView[]) {
        try {
            const reflect = this.reflect!;
            const api = this.api;
            const page = this.page;
            const document = this.__document;

            const results: Shape[] = [];
            const layoutSet = this.need_layout_shape;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                const originShape = reflect.get(shape.id)!;

                const originParent = originShape.parent as Artboard;
                const currentParent = shape.parent as Artboard;
                if (currentParent !== originParent) {
                    const indexF = originParent.indexOfChild(originShape);
                    const indexT = currentParent.indexOfChild(shape);

                    api.shapeMove(page, originParent, indexF, currentParent, indexT);
                    if (originParent.autoLayout) layoutSet.add(originParent);
                    if (currentParent.autoLayout) layoutSet.add(currentParent);
                }

                api.shapeModifyTransform(page, originShape, shape.transform);
                api.shapeDelete(document, page, currentParent, currentParent.indexOfChild(shape));

                this.prototype.delete(shape.id);

                results.push(originShape);
            }

            this.reflect = undefined;
            this.need_assign.clear();

            this.updateView();

            return results;
        } catch (e) {
            this.exception = true;
            console.error(e);
        }
    }

    tidy_swap(shape: ShapeView, x: number, y: number) {
        try {
            const api = this.api;
            const page = this.page;
            const frame = shape.relativeFrame;
            translate(api, page, adapt2Shape(shape), x - frame.x, y - frame.y);
        } catch (e) {
            this.exception = true;
            console.error('Transporter.swap', e);
        }
    }

    tidyUpShapesLayout(shape_rows: ShapeView[][], hor: number, ver: number, dir: boolean, align: TidyUpAlign, startXY?: {
        x: number,
        y: number
    }) {
        try {
            const api = this.api;
            const page = this.page;
            tidyUpLayout(page, api, shape_rows, hor, ver, dir, align, startXY);
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error('Transporter.tidyUpShapesLayout', error);
        }
    }

    insert(layout: ShapeView, placement: ShapeView | undefined, position: -1 | 1, sel: ShapeView[]) {
        try {
            const container = layout as ArtboardView;
            const envData = adapt2Shape(container) as Artboard;

            const isHor = (container.autoLayout?.stackMode || StackMode.Horizontal) === StackMode.Horizontal;
            const sortSel = sel.sort((a, b) => {
                const xy1 = a.parent!.matrix2Root().computeCoord3(a.boundingBox());
                const xy2 = b.parent!.matrix2Root().computeCoord3(b.boundingBox())
                const v1 = isHor ? xy1.x : xy1.y;
                const v2 = isHor ? xy2.x : xy2.y;

                if (v1 > v2) return 1;
                else return -1;
            });

            const frame = placement ? placement.relativeFrame : { x: 0, y: 0 };

            const api = this.api;
            const page = this.page;

            let x = frame.x + (position > 0 ? sortSel.length : -1);
            let y = frame.y + (position > 0 ? sortSel.length : -1);
            const index = placement ? envData.indexOfChild(adapt2Shape(placement)) + (position > 0 ? 1 : 0) : 0;

            for (let i = sortSel.length - 1; i > -1; i--) {
                const view = sortSel[i];
                const oParent = adapt2Shape(view.parent!) as GroupShape;
                const shape = adapt2Shape(view);
                const oIndex = oParent.indexOfChild(shape);
                api.shapeMove(page, oParent, oIndex, envData, index);
                api.shapeModifyXY(page, shape, x, y);
            }
        } catch (e) {
            this.exception = true;
            console.error(e);
        }
    }

    commit() {
        //存在标记的容器，删除其原型流程
        if (this.prototype.size) {
            this.prototype.forEach((v) => {
                this.api.delShapeProtoStart(this.page, v)
            })
        }
        if (this.need_assign.size) {
            this.need_assign.forEach(shape => {
                this.api.shapeModifyName(this.page, shape, assign(shape));
            })
        }

        super.commit();
    }
}