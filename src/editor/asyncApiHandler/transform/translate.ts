import { CoopRepository } from "../../../coop";
import { AsyncApiCaller } from "../AsyncApiCaller";
import { adapt2Shape, ArtboradView, GroupShapeView, PageView, ShapeView } from "../../../dataview";
import {
    Artboard,
    Document,
    GroupShape,
    makeShapeTransform1By2,
    makeShapeTransform2By1,
    Page,
    Shape,
    ShapeType,
    StackMode,
    StackPositioning,
} from "../../../data";
import { Transform as TransformRaw } from "../../../data";
import { after_migrate, unable_to_migrate } from "../../utils/migrate";
import { get_state_name, is_state } from "../../symbol";
import { Api } from "../../../coop/recordapi";
import { ISave4Restore, LocalCmd, SelectionState } from "../../../coop/localcmd";
import { getAutoLayoutShapes, modifyAutoLayout, TidyUpAlgin, tidyUpLayout } from "../../utils/auto_layout";
import { translate } from "../../frame";
import { transform_data } from "../../../io/cilpboard";
import { MossError } from "../../../basic/error";
import { Transform } from "../../../basic/transform";

export type TranslateUnit = {
    shape: ShapeView;
    transform: TransformRaw
}
export type TidyUpInfo = {
    shapes: ShapeView[][]
    horSpace: number
    verSpace: number
    dir: boolean
}

export interface TranslateBaseItem {
    transformRaw: TransformRaw,
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
            const shapes: ShapeView[] = [];
            for (let i = 0; i < translateUnits.length; i++) {
                const unit = translateUnits[i];
                shapes.push(unit.shape);
                const shape = adapt2Shape(unit.shape);
                api.shapeModifyTransform(this.page, shape, unit.transform);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(this.page, api, parent);
            }
            this.updateView();
        } catch (error) {
            console.log('Transporter.execute:', error);
            this.exception = true;
        }
    }

    migrate(items: MigrateItem[], dlt: string) {
        try {
            const api = this.api;
            const page = this.page;
            const document = this.__document;

            for (const item of items) {
                if (item.toParent === item.view.parent && !item.allowSameEnv) continue;

                const toParent = adapt2Shape(item.toParent) as GroupShape;
                const shape = adapt2Shape(item.view);
                const maxL = toParent.childs.length;
                const index = Math.min(item.index ?? maxL, maxL);
                this.__migrate(document, api, page, toParent, shape, dlt, index);
            }

            this.updateView();

            return true;
        } catch (e) {
            console.error(e);
            this.exception = true;
            return false;
        }
    }

    private __migrate(document: Document, api: Api, page: Page, targetParent: GroupShape, shape: Shape, dlt: string, index: number) {
        const error = unable_to_migrate(targetParent, shape);
        if (error) throw new MossError(`error type ${error}`);

        const origin: GroupShape = shape.parent as GroupShape;
        if (is_state(shape)) {
            const name = get_state_name(shape as any, dlt);
            api.shapeModifyName(page, shape, `${origin.name}/${name}`);
        }
        const transform = makeShapeTransform2By1(shape.matrix2Root());
        const __t = makeShapeTransform2By1(targetParent.matrix2Root());

        transform.addTransform(__t.getInverse());

        api.shapeModifyTransform(page, shape, makeShapeTransform1By2(transform));

        let originIndex = origin.indexOfChild(shape)
        if (origin.id === targetParent.id && originIndex < index) index--;
        api.shapeMove(page, origin, originIndex, targetParent, index);

        //标记容器是否被移动到其他容器
        if (shape.parent?.isContainer && shape.parent.type !== ShapeType.Page) {
            this.prototype.set(shape.id, shape)
        } else {
            this.prototype.clear()
        }
        if ((origin as Artboard).autoLayout) this.need_layout_shape.add(origin);
        if ((targetParent as Artboard).autoLayout) this.need_layout_shape.add(targetParent);
        after_migrate(document, page, api, origin);
        return true;
    }

    modifyShapesStackPosition(shapes: ShapeView[], p: StackPositioning) {
        const api = this.api;
        const page = this.page;
        for (const shape of shapes) {
            const s = adapt2Shape(shape);
            api.shapeModifyStackPosition(page, s, p);
        }
    }

    swap(shape: GroupShapeView, targets: ShapeView[], x: number, y: number, sort: Map<string, number>) {
        try {
            const api = this.api;
            const page = this.page;
            // todo try to delete this code
            for (let index = 0; index < targets.length; index++) {
                const target = targets[index];
                const frame = target._p_frame;
                translate(api, page, adapt2Shape(target), x - frame.x, y - frame.y);
            }

            modifyAutoLayout(page, api, adapt2Shape(shape), sort);
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('Transporter.swap', e);
        }
    }

    reflect: Map<string, Shape> | undefined;

    drawn(
        shapes: ShapeView[],
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
            for (const view of shapes) {
                const shape = adapt2Shape(view);
                const parent = shape.parent! as GroupShape;
                const index = parent.indexOfChild(shape);

                const source = transform_data(document, page, [shape]).pop()!;
                const __shape = api.shapeInsert(document, page, parent, source, index + 1);
                results.push(__shape);
                reflect.set(__shape.id, shape);

                if (env) {
                    const original = env.get(view)!;
                    const originalParent = adapt2Shape(original.parent) as GroupShape;

                    let targetIndex = (parent.id === originalParent.id && index < original.index)
                        ? original.index - 1
                        : original.index;
                    targetIndex = Math.max(0, Math.min(originalParent.childs.length, targetIndex));

                    api.shapeMove(page, parent, index, originalParent, targetIndex);

                    if ((originalParent as Artboard).autoLayout) layoutSet.add(originalParent);
                    if ((parent as Artboard).autoLayout) layoutSet.add(parent);
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
            const frame = shape._p_frame;
            translate(api, page, adapt2Shape(shape), x - frame.x, y - frame.y);
        } catch (e) {
            this.exception = true;
            console.log('Transporter.swap', e);
        }
    }

    tidyUpShapesLayout(shape_rows: ShapeView[][], hor: number, ver: number, dir: boolean, algin: TidyUpAlgin, startXY?: { x: number, y: number }) {
        try {
            const api = this.api;
            const page = this.page;
            tidyUpLayout(page, api, shape_rows, hor, ver, dir, algin, startXY);
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.log('Transporter.tidyUpShapesLayout', error);
        }
    }

    insert(layout: ShapeView, placement: ShapeView, position: -1 | 1, sel: ShapeView[]) {
        try {
            const container = layout as ArtboradView;
            const envData = adapt2Shape(container) as Artboard;
            const placementData = adapt2Shape(placement);

            const isHor = (container.autoLayout?.stackMode || StackMode.Horizontal) === StackMode.Horizontal;
            const sortSel = sel.sort((a, b) => {
                const xy1 = a.parent!.matrix2Root().computeCoord3(a.boundingBox());
                const xy2 = b.parent!.matrix2Root().computeCoord3(b.boundingBox())
                const v1 = isHor ? xy1.x : xy1.y;
                const v2 = isHor ? xy2.x : xy2.y;

                if (v1 > v2) return -1;
                else return 1;
            });


            const frame = placement._p_frame;

            const api = this.api;
            const page = this.page;

            let x = frame.x + (position > 0 ? sortSel.length : -1);
            let y = frame.y + (position > 0 ? sortSel.length : -1);
            const index = envData.indexOfChild(placementData) + (position > 0 ? 1 : 0);

            for (let i = sortSel.length - 1; i > -1; i--) {
                const view = sortSel[i];
                const oParent = adapt2Shape(view.parent!) as GroupShape;
                const shape = adapt2Shape(view);
                const oIndex = oParent.indexOfChild(shape);
                api.shapeMove(page, oParent, oIndex, envData, index);
                api.shapeModifyX(page, shape, x);
                api.shapeModifyY(page, shape, y);
            }

            modifyAutoLayout(page, api, envData);
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
        this.need_layout_shape.forEach(parent => {
            modifyAutoLayout(this.page, this.api, parent);
        })
        super.commit();
    }
}