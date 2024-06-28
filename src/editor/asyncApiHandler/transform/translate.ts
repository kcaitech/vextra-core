import { CoopRepository } from "../../coop/cooprepo";
import { AsyncApiCaller } from "../AsyncApiCaller";
import { ShapeView, adapt2Shape, PageView } from "../../../dataview";
import { GroupShape, Shape, Page, Document, makeShapeTransform1By2, Transform } from "../../../data";
import { translateTo } from "../../frame";
import { after_migrate, unable_to_migrate } from "../../utils/migrate";
import { get_state_name, is_state } from "../../symbol";
import { Api } from "../../coop/recordapi";
import { ISave4Restore, LocalCmd, SelectionState } from "../../coop/localcmd";

export type TranslateUnit = {
    shape: ShapeView;
    // x: number;
    // y: number;
    transform: Transform
}

export class Transporter extends AsyncApiCaller {
    origin_envs = new Map<string, { shape: ShapeView, index: number }[]>();
    except_envs: ShapeView[] = [];
    current_env_id: string = '';

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
            for (let i = 0; i < translateUnits.length; i++) {
                const unit = translateUnits[i];
                const shape = adapt2Shape(unit.shape);
                api.shapeModifyByTransform(this.page, shape, unit.transform);

                // this.api.shapeModifyX(this.page, shape, unit.x);
                // this.api.shapeModifyY(this.page, shape, unit.y);
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

    migrate(targetParent: GroupShape, sortedShapes: Shape[], dlt: string) {
        try {
            if (targetParent.id === this.current_env_id) {
                // console.log('targetParent.id === current_env_id');
                return;
            }

            const env_transform = this.__get_env_transform_for_migrate(targetParent);

            let index = targetParent.childs.length;
            for (let i = 0, len = sortedShapes.length; i < len; i++) {
                this.__migrate(this.__document, this.api, this.page, targetParent, sortedShapes[i], dlt, index, env_transform);
                index++;
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
            if (emit_by.id === this.current_env_id) {
                return;
            }

            this.origin_envs.forEach((v, k) => {
                const op = this.page.getShape(k) as GroupShape | undefined;
                if (!op) {
                    return;
                }

                const env_transform = this.__get_env_transform_for_migrate(op);

                for (let i = 0, l = v.length; i < l; i++) {
                    const _v = v[i];
                    this.__migrate(this.__document, this.api, this.page, op as GroupShape, adapt2Shape(_v.shape), dlt, _v.index, env_transform);
                }
            });
            this.__repo.transactCtx.fireNotify();
            this.setCurrentEnv(emit_by);
        } catch (error) {
            console.log('Transporter.migrate', error);
            this.exception = true;
        }
    }

    private __get_env_transform_for_migrate(target_env: GroupShape) {
        let ohflip = false;
        let ovflip = false;
        let p: Shape | undefined = target_env;

        // todo flip
        // while (p) {
        //     if (p.isFlippedHorizontal) {
        //         ohflip = !ohflip;
        //     }
        //     if (p.isFlippedVertical) {
        //         ovflip = !ovflip;
        //     }
        //     p = p.parent;
        // }

        const pm = target_env.matrix2Root();
        const pminverse = pm.inverse;

        return { ohflip, ovflip, pminverse };
    }

    private __migrate(document: Document,
        api: Api, page: Page, targetParent: GroupShape, shape: Shape, dlt: string, index: number,
        transform: { ohflip: boolean, ovflip: boolean, pminverse: number[] }
    ) {
        const error = unable_to_migrate(targetParent, shape);
        if (error) {
            console.log('migrate error:', error);
            return;
        }
        const origin: GroupShape = shape.parent as GroupShape;

        if (origin.id === targetParent.id) {
            // console.log('origin.id === targetParent.id');
            return;
        }

        if (is_state(shape)) {
            const name = get_state_name(shape as any, dlt);
            api.shapeModifyName(page, shape, `${origin.name}/${name}`);
        }

        // origin
        let hflip = false;
        let vflip = false;
        let p0: Shape | undefined = shape.parent;
        // todo flip
        // while (p0) {
        //     if (p0.isFlippedHorizontal) {
        //         hflip = !hflip;
        //     }
        //     if (p0.isFlippedVertical) {
        //         vflip = !vflip;
        //     }
        //     p0 = p0.parent;
        // }

        const m = shape.matrix2Root();
        const { x, y } = m.computeCoord(0, 0);
        api.shapeMove(page, origin, origin.indexOfChild(shape), targetParent, index++);

        if (hflip !== transform.ohflip) api.shapeModifyHFlip(page, shape);
        if (vflip !== transform.ovflip) api.shapeModifyVFlip(page, shape);

        m.multiAtLeft(transform.pminverse);
        let sina = m.m10;
        let cosa = m.m00;
        // todo flip
        // if (shape.isFlippedVertical) sina = -sina;
        // if (shape.isFlippedHorizontal) cosa = -cosa;
        let rotate = Math.asin(sina);

        if (cosa < 0) {
            if (sina > 0) rotate = Math.PI - rotate;
            else if (sina < 0) rotate = -Math.PI - rotate;
            else rotate = Math.PI;
        }

        if (!Number.isNaN(rotate)) {
            const r = (rotate / (2 * Math.PI) * 360) % 360;
            // if (r !== (shape.rotation ?? 0)) api.shapeModifyRotate(page, shape, r);
        }

        translateTo(api, page, shape, x, y);
        after_migrate(document, page, api, origin);
    }
}