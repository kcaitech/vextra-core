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
import {Transform as TransformRaw} from "../../../data";
import { after_migrate, unable_to_migrate } from "../../utils/migrate";
import { get_state_name, is_state } from "../../symbol";
import { Api } from "../../../coop";
import { ISave4Restore, LocalCmd, SelectionState } from "../../../coop";
import { getAutoLayoutShapes, modifyAutoLayout, tidyUpLayout } from "../../utils/auto_layout";
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

interface TranslateBaseItem {
    transformRaw: TransformRaw,
    transform: Transform;
    view: ShapeView;
}

export class Transporter extends AsyncApiCaller {
    origin_envs = new Map<string, { shape: ShapeView, index: number }[]>();
    origin_xy_envs = new Map<string, { shape: ShapeView, xy: { x: number, y: number } }[]>();
    need_layout_shape = new Set<string>();
    except_envs: ShapeView[] = [];
    current_env_id: string = '';
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

    shortPaste(_ss: Shape[], actions: { parent: GroupShape, index: number }[]) {
        try {
            const result: Shape[] = [];
            for (let i = 0, len = actions.length; i < len; i++) {
                const shape = _ss[i];
                const {parent, index} = actions[i];
                shape.name = this.genName(shape);
                this.api.shapeInsert(this.__document, this.page, parent, shape, index);
                result.push(parent.childs[index]);
            }
            this.updateView();
            this.shapes = result;
            return result;
        } catch (error) {
            console.log('Transporter.shortPaste:', error);
            this.exception = true;
            return false;
        }
    }

    genName(shape: Shape) {
        const reg = new RegExp('\\S+\\s[0-9]+$');
        let name = shape.name;
        if (reg.test(name)) {
            const type = shape.type;
            const index = name.lastIndexOf(' ');

            const pre = name.slice(0, index);
            const end = name.slice(index + 1);

            let max = Number(end);
            if (isNaN(max)) return name;

            const reg2 = new RegExp(`^${pre}\\s[0-9]+$`);

            this.page.shapes.forEach(s => {
                if (s.type !== type) return;

                if (!reg2.test(s.name)) return;

                const index = s.name.lastIndexOf(' ');
                const sEnd = Number(s.name.slice(index + 1));
                if (isNaN(sEnd)) return;

                if (sEnd > max) max = sEnd;
            })
            return `${pre} ${max + 1}`;
        } else {
            return name;
        }
    }

    // migrate(targetParent: GroupShape, sortedShapes: Shape[], dlt: string) {
    //     try {
    //         if (targetParent.id === this.current_env_id) return;
    //
    //         const api = this.api;
    //         const page = this.page;
    //         const document = this.__document;
    //
    //         let index = targetParent.childs.length;
    //         for (let i = 0, len = sortedShapes.length; i < len; i++) {
    //             this.__migrate(document, api, page, targetParent, sortedShapes[i], dlt, index) && index++;
    //         }
    //         this.need_layout_shape.add(this.current_env_id);
    //         const parents: GroupShape[] = [targetParent];
    //         for (let i = 0; i < parents.length; i++) {
    //             const parent = parents[i];
    //             modifyAutoLayout(page, api, parent);
    //         }
    //
    //         this.setCurrentEnv(targetParent);
    //         this.updateView();
    //     } catch (e) {
    //         console.log('Transporter.migrate:', e);
    //         this.exception = true;
    //     }
    // }
    migrate(target: ShapeView, sortedShapes: ShapeView[], dlt: string) {
        try {
            const api = this.api;
            const page = this.page;
            const document = this.__document;

            const targetParent = adapt2Shape(target) as GroupShape;

            let index = target.childs.length;
            for (let i = 0, len = sortedShapes.length; i < len; i++) {
                this.__migrate(document, api, page, targetParent, adapt2Shape(sortedShapes[i]), dlt, index) && index++;
            }

            this.updateView();

            return true;
        } catch (e) {
            console.error(e);
            this.exception = true;
            return false;
        }
    }

    setEnv(envs: Map<string, { shape: ShapeView, index: number }[]>) {
        this.origin_envs = envs;
    }

    setOriginXyEnv(envs: Map<string, { shape: ShapeView, xy: { x: number, y: number } }[]>) {
        this.origin_xy_envs = envs;
    }

    setExceptEnvs(except: ShapeView[]) {
        this.except_envs = except;
    }

    getExceptEnvs() {
        return this.except_envs;
    }

    setCurrentEnv(cv: Shape | Page) {
        this.current_env_id = cv.id;
    }

    backToStartEnv(emit_by: Shape, dlt: string) { // 特殊的migrate，让所有图层回到原环境
        try {
            if (emit_by.id === this.current_env_id) return;

            const api = this.api;
            const page = this.page;
            const document = this.__document;
            const __migrate = this.__migrate.bind(this);
            this.origin_envs.forEach((v, k) => {
                const op = page.getShape(k) as GroupShape;
                if (!op) return;
                for (let i = 0, l = v.length; i < l; i++) {
                    const _v = v[i];
                    this.need_layout_shape.delete(_v.shape.id);
                    __migrate(document, api, page, op, adapt2Shape(_v.shape), dlt, _v.index);
                }
            });
            this.origin_xy_envs.forEach((v, k) => {
                const op = this.page.getShape(k) as GroupShape | undefined;
                if (!op) return;

                for (let i = 0, l = v.length; i < l; i++) {
                    const _v = v[i];
                    this.api.shapeModifyX(this.page, adapt2Shape(_v.shape), _v.xy.x);
                    this.api.shapeModifyY(this.page, adapt2Shape(_v.shape), _v.xy.y);
                }
            });

            this.updateView();
            this.setCurrentEnv(emit_by);
        } catch (error) {
            console.log('Transporter.migrate', error);
            this.exception = true;
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
        api.shapeMove(page, origin, origin.indexOfChild(shape), targetParent, index++);

        //标记容器是否被移动到其他容器
        if (shape.parent?.isContainer && shape.parent.type !== ShapeType.Page) {
            this.prototype.set(shape.id, shape)
        } else {
            this.prototype.clear()
        }
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
            const parents: Artboard[] = [];
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
                    api.shapeMove(page, parent, index, originalParent, original.index);

                    if (originalParent instanceof Artboard && originalParent.autoLayout) parents.push(originalParent);
                }

                api.shapeModifyTransform(page, shape, transform.get(view.id)!.transformRaw);
            }

            if (parents.length) for (const p of parents) modifyAutoLayout(page, api, p);

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
            if (!this.reflect) {
                this.exception = true;
                return;
            }

            const reflect = this.reflect;

            const api = this.api;
            const page = this.page;
            const document = this.__document;

            const parents: Shape[] = [];
            const results: Shape[] = [];

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                const originShape = reflect.get(shape.id)!;
                const originParent = originShape.parent as GroupShape;
                const currentParent = shape.parent as GroupShape;
                if (currentParent !== originParent) {
                    const indexF = originParent.indexOfChild(shape);
                    const indexT = currentParent.indexOfChild(shape);
                    api.shapeMove(page, originParent, indexF, currentParent, indexT);
                }
                api.shapeModifyTransform(page, originShape, shape.transform.clone());
                api.shapeDelete(document, page, currentParent, currentParent.indexOfChild(shape));

                if ((originShape as Artboard).autoLayout) parents.push(originShape);
                if ((currentParent as Artboard).autoLayout) parents.push(currentParent);

                results.push(originShape);
            }

            if (parents.length) for (const p of parents) modifyAutoLayout(page, api, p);

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

    tidyUpShapesLayout(shape_rows: ShapeView[][], hor: number, ver: number, dir: boolean, startXY?: {
        x: number,
        y: number
    }) {
        try {
            const api = this.api;
            const page = this.page;
            tidyUpLayout(page, api, shape_rows, hor, ver, dir, startXY);
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
        const parents: GroupShape[] = [];
        this.need_layout_shape.forEach(v => {
            const target = this.page.getShape(v) as GroupShape;
            target && parents.push(target);
        })
        for (let i = 0; i < parents.length; i++) {
            const parent = parents[i];
            modifyAutoLayout(this.page, this.api, parent);
        }
        super.commit();
    }
}