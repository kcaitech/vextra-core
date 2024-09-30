import { Document, OvalShape, Page } from "../../data";
import { adapt2Shape, PageView, ShapeView, SymbolRefView } from "../../dataview";
import { modifyPathByArc } from "../asyncApiHandler";
import { Api, CoopRepository } from "../../coop";
import { modify_shapes_height, modify_shapes_width } from "../utils/common";
import { Artboard, FillType, PathShape, SymbolRefShape, Transform } from "../../data/classes";
import { RadiusType } from "../../data/consts";
import { shape4contextSettings, shape4cornerRadius, shape4fill } from "../symbol";
import { update_frame_by_points } from "../utils/path";
import { GroupShape, PathShape2, SymbolShape, TextShape, Shape } from "../../data/shape";
import { BatchAction5 } from "../page";
import { IImportContext, importGradient, } from "../../data/baseimport";
import { exportGradient, } from "../../data/baseexport";

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

    /**
     * @description 修改图形X轴位置
     */

    modifyShapesX(actions: {
        target: ShapeView,
        x: number
    }[]) {
        this.execute('modify-shapes-x', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                api.shapeModifyX(page, adapt2Shape(action.target), action.x);
            }
        });
    }

    /**
     * @description 修改图形Y轴位置
     */

    modifyShapesY(actions: {
        target: ShapeView,
        y: number
    }[]) {
        this.execute('modify-shapes-y', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                api.shapeModifyY(page, adapt2Shape(action.target), action.y);
            }
        });
    }

    /**
    * @description 修改图形宽度
    */

    modifyShapesWidth(shapes: ShapeView[], val: number) {
        this.execute('modify-shapes-width', () => {
            const api = this.api!;
            const page = this.page;
            modify_shapes_width(api, this.__document, page, shapes, val)
        });
    }

    /**
     * @description 修改图形高度
     */

    modifyShapesHeight(shapes: ShapeView[], val: number) {
        this.execute('modify-shapes-height', () => {
            const api = this.api!;
            const page = this.page;
            modify_shapes_height(api, this.__document, page, shapes, val)
        });
    }

    /**
    * @description 修改图形高度
    */

    setShapesRotate(actions: {
        shape: ShapeView,
        transform: Transform
    }[]) {
        this.execute('set-shapes-rotate', () => {
            const api = this.api!;
            const page = this.page;
            for (const action of actions) {
                const { shape: shapeView, transform } = action;
                const s = adapt2Shape(shapeView);
                api.shapeModifyRotate(page, s, transform);
            }
        });
    }

    /**
     * @description 修改图形圆角
     */

    shapesModifyRadius(shapes: ShapeView[], values: number[]) {
        this.execute('set-shapes-rotate', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                const isRect = shape.radiusType === RadiusType.Rect;

                let needUpdateFrame = false;

                if (isRect) {
                    if (values.length !== 4) {
                        values = [values[0], values[0], values[0], values[0]];
                    }

                    const [lt, rt, rb, lb] = values;

                    if (shape instanceof SymbolRefShape) {
                        const _shape = shape4cornerRadius(api, page, shapes[i] as SymbolRefView);
                        api.shapeModifyRadius2(page, _shape, lt, rt, rb, lb);
                    }

                    if (shape.isVirtualShape) continue;

                    if (shape instanceof PathShape) {
                        const points = shape.pathsegs[0].points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = values[_i];
                            if (points[_i].radius === val || val < 0) continue;

                            api.modifyPointCornerRadius(page, shape, _i, val, 0);
                        }
                        needUpdateFrame = true;
                    } else if (shape instanceof PathShape2) {
                        const points = shape.pathsegs[0].points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = values[_i];
                            if (points[_i].radius === val || val < 0) {
                                continue;
                            }

                            api.modifyPointCornerRadius(page, shape, _i, val, 0);
                        }
                        needUpdateFrame = true;
                    } else {
                        const __shape = shape as Artboard | SymbolShape;
                        api.shapeModifyRadius2(page, __shape, lt, rt, rb, lb)
                    }
                } else {
                    if (shape.isVirtualShape || shape.radiusType === RadiusType.None) continue;

                    if (shape instanceof PathShape) {
                        shape.pathsegs.forEach((seg, index) => {
                            for (let _i = 0; _i < seg.points.length; _i++) {
                                if (seg.points[_i].radius === values[0]) {
                                    continue;
                                }

                                api.modifyPointCornerRadius(page, shape, _i, values[0], index);
                            }
                        });
                        needUpdateFrame = true;
                    } else if (shape instanceof PathShape2) {
                        shape.pathsegs.forEach((seg, index) => {
                            for (let _i = 0; _i < seg.points.length; _i++) {
                                if (seg.points[_i].radius === values[0]) {
                                    continue;
                                }

                                api.modifyPointCornerRadius(page, shape, _i, values[0], index);
                            }
                        });
                        needUpdateFrame = true;
                    } else {
                        api.shapeModifyFixedRadius(page, shape as GroupShape | TextShape, values[0]);
                    }
                }

                if (needUpdateFrame) {
                    update_frame_by_points(api, page, shape);
                }
            }
        });
    }

    /**
    * @description 修改图形透明度
    */

    modifyShapesOpacity(shapes: ShapeView[], value: number) {
        this.execute('modify-shapes-opacity', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shape4contextSettings(api, shapes[i], page);
                api.shapeModifyContextSettingsOpacity(page, shape, value);
            }
        });
    }

    /**
   * @description 修改图形透明度
   */

    modifyGradientOpacity(actions: BatchAction5[]) {
        this.execute('modify-gradient-opacity', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0, l = actions.length; i < l; i++) {
                const { target, index, type, value } = actions[i];
                const grad_type = type === 'fills' ? target.getFills() : target.getBorders();
                if (!grad_type?.length) {
                    continue;
                }
                const gradient_container = grad_type[index];
                if (!gradient_container || !gradient_container.gradient || gradient_container.fillType !== FillType.Gradient) {
                    continue;
                }
                const gradient = gradient_container.gradient;
                const new_gradient = importGradient(exportGradient(gradient));
                new_gradient.gradientOpacity = value;
                const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                const shape = shape4fill(api, page, target);
                f(page, shape, index, new_gradient);
            }
        });
    }
}