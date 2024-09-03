import { CoopRepository } from "../../coop/cooprepo";
import { AsyncApiCaller } from "../AsyncApiCaller";
import { ShapeView, adapt2Shape, PageView, GroupShapeView, ArtboradView } from "../../../dataview";
import {
    GroupShape,
    Shape,
    Page,
    Document,
    Transform,
    makeShapeTransform2By1,
    makeShapeTransform1By2,
    ShapeType,
    StackPositioning
} from "../../../data";
import { after_migrate, unable_to_migrate } from "../../utils/migrate";
import { get_state_name, is_state } from "../../symbol";
import { Api } from "../../coop/recordapi";
import { ISave4Restore, LocalCmd, SelectionState } from "../../coop/localcmd";
import { getAutoLayoutShapes, modifyAutoLayout } from "../../utils/auto_layout";
import { translate } from "../../frame";

export type TranslateUnit = {
    shape: ShapeView;
    transform: Transform
}

export class Transporter extends AsyncApiCaller {
    origin_envs = new Map<string, { shape: ShapeView, index: number }[]>();
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
                const { parent, index } = actions[i];
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

    migrate(targetParent: GroupShape, sortedShapes: Shape[], dlt: string) {
        try {
            if (targetParent.id === this.current_env_id) return;

            const api = this.api;
            const page = this.page;
            const document = this.__document;

            let index = targetParent.childs.length;
            for (let i = 0, len = sortedShapes.length; i < len; i++) {
                this.__migrate(document, api, page, targetParent, sortedShapes[i], dlt, index);
                index++;
            }

            const oEnv = page.getShape(this.current_env_id) as GroupShape;
            const parents: GroupShape[] = [oEnv, targetParent];
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(page, api, parent);
            }

            this.setCurrentEnv(targetParent);
            this.updateView();
        } catch (e) {
            console.log('Transporter.migrate:', e);
            this.exception = true;
        }
    }

    setEnv(envs: Map<string, { shape: ShapeView, index: number }[]>) {
        this.origin_envs = envs;
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
            const parents = new Map<string, Shape>()
            const __migrate = this.__migrate.bind(this);
            this.origin_envs.forEach((v, k) => {
                const op = page.getShape(k) as GroupShape;
                if (!op) return;
                parents.set(op.id, op);
                for (let i = 0, l = v.length; i < l; i++) {
                    const _v = v[i];
                    __migrate(document, api, page, op, adapt2Shape(_v.shape), dlt, _v.index);
                }
            });
            const oEnv = page.getShape(this.current_env_id);
            oEnv && parents.set(oEnv.id, oEnv);
            parents.forEach(s => modifyAutoLayout(page, api, s as GroupShape));
            this.updateView();
            this.setCurrentEnv(emit_by);
        } catch (error) {
            console.log('Transporter.migrate', error);
            this.exception = true;
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

    modifyShapesStackPosition(shapes: ShapeView[], p: StackPositioning) {
        const api = this.api;
        const page = this.page;
        for (const shape of shapes) {
            const s = adapt2Shape(shape);
            api.shapeModifyStackPosition(page, s, p);
        }
    }

    swap(shape: GroupShapeView, targets: ShapeView[], x: number, y: number) {
        try {
            const layoutShape = (shape as ArtboradView);
            if (!layoutShape.autoLayout) return;
            const api = this.api;
            const page = this.page;
            for (let index = 0; index < targets.length; index++) {
                const target = targets[index];
                const frame = target._p_frame;
                translate(api, page, adapt2Shape(target), x - frame.x, y - frame.y);
            }
            modifyAutoLayout(page, api, adapt2Shape(shape));
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('Transporter.swap', e);
        }
    }

    commit() {
        //存在标记的容器，删除其原型流程
        if (this.prototype.size) {
            this.prototype.forEach((v) => {
                this.api.delShapeProtoStart(this.page, v)
            })
        }
        super.commit();
    }
}