import { Document, OvalShape, Page } from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import { modifyPathByArc } from "../asyncApiHandler";
import {Api, CoopRepository} from "../../coop";

export class LinearApi {
    private readonly __repo: CoopRepository;
    private readonly __document: Document;

    private readonly page: Page;

    private exception: boolean = false;

    private api: Api | undefined;

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        this.__repo = repo;
        this.__document = document;

        this.page = adapt2Shape(page) as Page;
    }

    private __timer: any = null;
    // (ms)等待时长，达到后断开连接，为0时在执行完任务之后立刻断开; 键盘长按判定一般是500ms，加20ms用来包括长按
    private __duration: number = 520;

    set duration(val: number) {
        this.__duration = val;
    }

    private __update() {
        this.__repo.transactCtx.fireNotify();
    }

    private __commit() {
        this.__repo.commit();
    }

    private __rollback() {
        this.__repo.rollback();
    }

    private __connected: boolean = false;

    private connected(desc = 'linear-action') {
        if (this.__connected) return true;
        else if (this.__repo.isInTransact()) return false;
        else {
            this.api = this.__repo.start(desc);
            this.__connected = true;
            return true;
        }
    }

    private disconnected() {
        if (!this.__connected) return;
        this.__connected = false;
        this.exception ? this.__rollback() : this.__commit();
    }

    private execute(desc: string, exe: Function) {
        try {
            if (!this.connected(desc)) return;
            exe();
            this.__update();
        } catch (error) {
            this.exception = true;
            console.error(error);
        } finally {
            const duration = this.__duration;

            if (!duration) this.disconnected();
            else {
                clearTimeout(this.__timer);
                this.__timer = setTimeout(() => {
                    this.disconnected();
                    clearTimeout(this.__timer);
                    this.__timer = null;
                }, duration);
            }
        }
    }

    // private---------divide---------public

    /**
     * @description 修改弧形起点
     */
    modifyStartingAngle(shapes: ShapeView[], value: number) {
        this.execute('modify-starting-angle-linear', () => {
            const api = this.api!;
            const round = Math.PI * 2;
            const page = this.page;

            for (const view of shapes) {
                const shape = adapt2Shape(view);
                if (!(shape instanceof OvalShape)) continue;
                const end = shape.endingAngle ?? round;
                const start = shape.startingAngle ?? 0;
                const delta = end - start;
                api.ovalModifyStartingAngle(page, shape, value);
                api.ovalModifyEndingAngle(page, shape, value + delta);

                modifyPathByArc(api, page, shape);
            }
        });
    }

    /**
     * @description 修改弧形覆盖率
     */
    modifySweep(shapes: ShapeView[], value: number) {
        this.execute('modify-sweep-linear', () => {
            const api = this.api!;
            const page = this.page;

            for (const view of shapes) {
                const shape = adapt2Shape(view);
                if (!(shape instanceof OvalShape)) continue;
                const start = shape.startingAngle ?? 0;
                api.ovalModifyEndingAngle(page, shape, start + value);
                modifyPathByArc(api, page, shape);
            }
        });
    }

    /**
     * @description 修改弧形镂空半径
     */
    modifyInnerRadius(shapes: ShapeView[], value: number) {
        this.execute('modify-inner-radius-linear', () => {
            const api = this.api!;
            const page = this.page;

            for (const view of shapes) {
                const shape = adapt2Shape(view);
                if (!(shape instanceof OvalShape)) continue;

                api.ovalModifyInnerRadius(page, shape, value);
                modifyPathByArc(api, page, shape);
            }
        });
    }
}