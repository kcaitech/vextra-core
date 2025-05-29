/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    translate,
    translateTo,
} from "./frame";
import { CurvePoint, GroupShape, PathShape, PathShape2, Shape, ShapeFrame, ShapeType } from "../data/shape";
import { CurveMode } from "../data/typesdefine";
import {
    newDefaultTextShape,
    newLineShape,
    newOvalShape,
    newPolygonShape,
    newRectShape,
    newStellateShape,
    newTextShape
} from "./creator/creator";

import { Page } from "../data/page";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../data/document";
import { Operator } from "../coop/recordop";
import { uuid } from "../basic/uuid";
import { importGradient } from "../data/baseimport";
import { exportGradient } from "../data/baseexport";
import { is_state } from "./utils/other";
import { after_migrate, unable_to_migrate } from "./utils/migrate";
import { get_state_name, shape4contextSettings } from "./symbol";
import {
    after_insert_point,
    update_frame_by_points
} from "./utils/path";
import { adapt2Shape, PageView, PathShapeView, ShapeView } from "../dataview";
import { BasicArray } from "../data/basic";
import { Fill } from "../data/style";
import { TextAttr } from "../data/classes";
import { Transform } from "../data/transform";

interface PageXY { // 页面坐标系的xy
    x: number
    y: number
}

export enum CtrlElementType { // 控制元素类型
    RectLeft = 'rect-left',
    RectRight = 'rect-right',
    RectBottom = 'rect-bottom',
    RectTop = 'rect-top',
    RectLT = 'rect-left-top',
    RectRT = 'rect-right-top',
    RectRB = 'rect-right-bottom',
    RectLB = 'rect-left-bottom',
    RectLTR = 'rect-left-top-rotate',
    RectRTR = 'rect-right-top-rotate',
    RectRBR = 'rect-right-bottom-rotate',
    RectLBR = 'rect-left-bottom-rotate',
    LineStart = 'line-start',
    LineEnd = 'line-end',
    LineStartR = 'line-start-rotate',
    LineEndR = 'line-end-rotate',
    Text = 'text'
}

export interface AsyncPathEditor {
    addNode: (index: number) => void;
    execute: (index: number, end: PageXY) => void;
    execute2: (range: Map<number, number[]>, dx: number, dy: number) => void;
    executeRadius: (range: Map<number, number[]>, r: number) => void;
    close: () => undefined;
    abort: () => void;
}

export interface AsyncTransfer {
    migrate: (targetParent: GroupShape, sortedShapes: Shape[], dlt: string) => void;
    trans: (start: PageXY, end: PageXY) => void;
    stick: (dx: number, dy: number) => void;
    transByWheel: (dx: number, dy: number) => void;
    shortPaste: (shapes: Shape[], actions: { parent: GroupShape, index: number }[]) => false | Shape[];
    setEnvs: (envs: Map<string, { shape: ShapeView, index: number }[]>) => void;
    getEnvs: () => Map<string, { shape: ShapeView, index: number }[]>;
    setExceptEnvs: (except: ShapeView[]) => void;
    getExceptEnvs: () => ShapeView[];
    backToStartEnv: (emit_by: Shape, dlt: string) => void;
    setCurrentEnv: (cv: Shape | Page) => void;
    close: () => undefined;
    abort: () => void;
}

export interface AsyncOpacityEditor {
    execute: (contextSettingOpacity: number) => void;
    close: () => undefined;
}

export interface AsyncBorderThickness {
    execute: (contextSettingThickness: number) => void;
    close: () => undefined;
}

export interface AsyncGradientEditor {
    execute_from: (from: { x: number, y: number }) => void;
    execute_to: (from: { x: number, y: number }) => void;
    execute_elipselength: (length: number) => void;
    execute_stop_position: (position: number, id: string) => void;
    close: () => undefined;
}

export enum Status {
    Pending = 'pending',
    Fulfilled = 'fulfilled',
    Exception = 'exception'
}

/**
 * @deprecated 处理鼠标拖拽编辑，该模式拓展性差，维护困难，将不再维护，请使用asyncapi/linearapi实现同类API的合并
 */
export class Controller {
    private __repo: CoopRepository;
    private __document: Document;

    constructor(repo: CoopRepository, document: Document) {
        this.__repo = repo;
        this.__document = document;
    }

    create(type: ShapeType, name: string, frame: ShapeFrame, attr?: TextAttr): Shape {
        switch (type) {
            case ShapeType.Artboard:
                // return newArtboard(name, frame);
            case ShapeType.Rectangle:
                return newRectShape(name, frame, this.__document.stylesMgr);
            case ShapeType.Oval:
                return newOvalShape(name, frame, this.__document.stylesMgr);
            case ShapeType.Line:
                return newLineShape(name, frame, this.__document.stylesMgr);
            case ShapeType.Polygon:
                return newPolygonShape(name, frame, this.__document.stylesMgr);
            case ShapeType.Star:
                return newStellateShape(name, frame, this.__document.stylesMgr);
            case ShapeType.Text: {
                if (attr) return newDefaultTextShape(name, this.__document.stylesMgr, attr, frame);
                return newTextShape(name, this.__document.stylesMgr, frame);
            }
            default:
                return newRectShape(name, frame, this.__document.stylesMgr);
        }
    }

    // 图形位置移动
    /**
     * @deprecated
     */
    public asyncTransfer(_shapes: Shape[] | ShapeView[], _page: Page | PageView): AsyncTransfer {
        const page = _page instanceof PageView ? adapt2Shape(_page) as Page : _page;
        let shapes: Shape[] = _shapes[0] instanceof ShapeView ? _shapes.map((s) => adapt2Shape(s as ShapeView)) : _shapes as Shape[];
        let origin_envs = new Map<string, { shape: ShapeView, index: number }[]>(); // 记录图层的原环境
        let except_envs: ShapeView[] = [];
        let current_env_id: string = '';

        const api = this.__repo.start("transfer");
        let status: Status = Status.Pending;
        const migrate = (targetParent: GroupShape, sortedShapes: Shape[], dlt: string) => {
            try {
                if (targetParent.id === current_env_id) {
                    return;
                }

                status = Status.Pending;
                const env_transform = __get_env_transform_for_migrate(targetParent);

                let index = targetParent.childs.length;
                for (let i = 0, len = sortedShapes.length; i < len; i++) {
                    __migrate(this.__document, api, page, targetParent, sortedShapes[i], dlt, index, env_transform);
                    index++;
                }

                setCurrentEnv(targetParent);

                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const backToStartEnv = (emit_by: Shape, dlt: string) => { // 特殊的migrate，让所有图层回到原环境
            try {
                if (emit_by.id === current_env_id) {
                    return;
                }

                status = Status.Pending;
                origin_envs.forEach((v, k) => {
                    const op = page.getShape(k) as GroupShape | undefined;
                    if (!op) {
                        return;
                    }

                    const env_transform = __get_env_transform_for_migrate(op);

                    for (let i = 0, l = v.length; i < l; i++) {
                        const _v = v[i];
                        __migrate(this.__document, api, page, op as GroupShape, adapt2Shape(_v.shape), dlt, _v.index, env_transform);
                    }
                });
                this.__repo.transactCtx.fireNotify();
                setCurrentEnv(emit_by);
                status = Status.Fulfilled;
            } catch (error) {
                console.error(error);
                status = Status.Exception;
            }
        }
        const trans = (start: PageXY, end: PageXY) => {
            status = Status.Pending;
            try {
                for (let i = 0; i < shapes.length; i++) {
                    translate(api, page, shapes[i], end.x - start.x, end.y - start.y);
                }
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const stick = (dx: number, dy: number) => {
            status = Status.Pending;
            try {
                for (let i = 0; i < shapes.length; i++) {
                    translate(api, page, shapes[i], dx, dy);
                }
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const transByWheel = (dx: number, dy: number) => {
            status = Status.Pending;
            try {
                for (let i = 0; i < shapes.length; i++) {
                    translate(api, page, shapes[i], dx, dy);
                }
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const shortPaste = (_ss: Shape[], actions: { parent: GroupShape, index: number }[]) => {
            try {
                status = Status.Pending;
                const result: Shape[] = [];
                for (let i = 0, len = actions.length; i < len; i++) {
                    const shape = _ss[i];
                    const { parent, index } = actions[i];
                    api.shapeInsert(this.__document, page, parent, shape, index);
                    result.push(parent.childs[index]);
                }
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
                shapes = result;
                return result;
            } catch (error) {
                console.log(error);
                status = Status.Exception;
                return false;
            }
        }
        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        const abort = () => {
            this.__repo.rollback();
        }
        const setEnvs = (envs: Map<string, { shape: ShapeView, index: number }[]>) => {
            origin_envs = envs;
        }
        const getEnvs = () => {
            return origin_envs;
        }
        const setExceptEnvs = (except: ShapeView[]) => {
            except_envs = except;
        }
        const getExceptEnvs = () => {
            return except_envs;
        }
        const setCurrentEnv = (cv: Shape | Page) => {
            current_env_id = cv.id;
        }
        return {
            migrate, trans, stick, transByWheel, shortPaste,
            setEnvs, getEnvs,
            setExceptEnvs, getExceptEnvs,
            backToStartEnv,
            setCurrentEnv,
            abort, close
        }
    }

    /**
     * @deprecated
     */
    public asyncPathEditor(_shape: PathShape | PathShapeView, _page: Page | PageView): AsyncPathEditor {
        const shape: PathShape = _shape instanceof ShapeView ? adapt2Shape(_shape) as PathShape : _shape as PathShape;
        const page = _page instanceof PageView ? adapt2Shape(_page) as Page : _page;

        const api = this.__repo.start("asyncPathEditor");
        let status: Status = Status.Pending;
        const w = shape.size.width, h = shape.size.height;
        let m = (shape.matrix2Root());
        m.preScale(w, h);
        m = (m.inverse); // root -> 1
        const addNode = (index: number) => {
            status === Status.Pending
            try {
                const p = new CurvePoint(new BasicArray<number>(), uuid(), 0, 0, CurveMode.Straight);
                api.addPointAt(page, shape as PathShape, index, p, 0);
                after_insert_point(page, api, shape, index, 0);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute = (index: number, end: PageXY) => {
            status === Status.Pending
            try {
                // pathEdit(api, page, shape, index, end, m);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute2 = (range: Map<number, number[]>, dx: number, dy: number) => {
            status === Status.Pending
            try {
                const pathsegs = (shape as any as PathShape2).pathsegs;
                range.forEach((indexes, segment) => {
                    const points = pathsegs[segment].points;
                    if (!points?.length) {
                        return;
                    }
                    // pointsEdit(api, page, shape, points, indexes, dx, dy, segment);
                });
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const executeRadius = (range: Map<number, number[]>, r: number) => {
            status === Status.Pending
            try {
                const pathsegs = (shape as any as PathShape2).pathsegs;
                range.forEach((indexes, segment) => {
                    const points = pathsegs[segment].points;
                    if (!points?.length) {
                        return;
                    }
                    for (let i = indexes.length - 1; i > -1; i--) {
                        const radius = points[indexes[i]].radius || 0;
                        api.modifyPointCornerRadius(page, shape, indexes[i], radius + r, segment);
                    }
                });
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const close = () => {
            status = Status.Pending;
            try {
                update_frame_by_points(api, page, shape as PathShape);
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        const abort = () => {
            this.__repo.rollback();
        }
        return { addNode, execute, execute2, close, abort, executeRadius }
    }

    public asyncOpacityEditor(_shapes: ShapeView[], _page: PageView): AsyncOpacityEditor {
        const shapes: ShapeView[] = _shapes;
        const page = _page.data

        const api = this.__repo.start("asyncOpacityEditor");
        let status: Status = Status.Pending;
        const execute = (contextSettingOpacity: number) => {
            status = Status.Pending;
            try {
                for (let i = 0, l = shapes.length; i < l; i++) {
                    const shape = shape4contextSettings(api, shapes[i], _page);
                    api.shapeModifyContextSettingsOpacity(page, shape, contextSettingOpacity);
                }
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { execute, close }
    }

    public asyncGradientEditor(fill: Fill, _page: PageView): AsyncGradientEditor {
        const api = this.__repo.start("asyncGradientEditor");
        let status: Status = Status.Pending;
        const execute_from = (from: { x: number, y: number }) => {
            status = Status.Pending;
            try {
                const gradient = fill.gradient;
                if (!gradient) return;
                const new_gradient = importGradient(exportGradient(gradient));
                new_gradient.from.x = from.x;
                new_gradient.from.y = from.y;
                api.setFillGradient(fill, new_gradient);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute_to = (to: { x: number, y: number }) => {
            status = Status.Pending;
            try {
                const gradient = fill.gradient;
                if (!gradient) return;
                const new_gradient = importGradient(exportGradient(gradient));
                new_gradient.to.x = to.x;
                new_gradient.to.y = to.y;
                api.setFillGradient(fill, new_gradient);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute_elipselength = (length: number) => {
            status = Status.Pending;
            try {
                const gradient = fill.gradient;
                if (!gradient) return;
                const new_gradient = importGradient(exportGradient(gradient));
                new_gradient.elipseLength = length;
                api.setFillGradient(fill, new_gradient);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute_stop_position = (position: number, id: string) => {
            status = Status.Pending;
            try {
                const gradient = fill.gradient;
                if (!gradient) return;
                const f_stop = fill.gradient?.stops || [];
                const idx = f_stop.findIndex((stop) => stop.id === id);
                if (idx === -1) return;
                const new_gradient = importGradient(exportGradient(gradient));
                new_gradient.stops[idx].position = position;
                const g_s = new_gradient.stops;
                g_s.sort((a, b) => {
                    if (a.position > b.position) {
                        return 1;
                    } else if (a.position < b.position) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                api.setFillGradient(fill, new_gradient);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }

        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { execute_from, execute_to, execute_elipselength, execute_stop_position, close }
    }
}

function deleteEmptyGroupShape(document: Document, page: Page, shape: Shape, api: Operator): boolean {
    const p = shape.parent as GroupShape;
    if (!p) return false;
    api.shapeDelete(document, page, p, p.indexOfChild(shape))
    if (p.childs.length <= 0) {
        deleteEmptyGroupShape(document, page, p, api)
    }
    return true;
}

function __migrate(document: Document,
    api: Operator, page: Page, targetParent: GroupShape, shape: Shape, dlt: string, index: number,
    transform: { ohflip: boolean, ovflip: boolean, pminverse: Transform }
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
    // if (shape.isFlippedVertical) sina = -sina;
    // if (shape.isFlippedHorizontal) cosa = -cosa;
    let rotate = Math.asin(sina); // 奇函数

    // 确定角度所在象限
    // sin(π-a) = sin(a)
    // sin(-π-a) = sin(a)
    // asin 返回值范围 -π/2 ~ π/2, 第1、4象限
    if (cosa < 0) {
        if (sina > 0) rotate = Math.PI - rotate;
        else if (sina < 0) rotate = -Math.PI - rotate;
        else rotate = Math.PI;
    }

    if (!Number.isNaN(rotate)) {
        const r = (rotate / (2 * Math.PI) * 360) % 360;
        // if (r !== (shape.rotation ?? 0)) api.shapeModifyRotate(page, shape, r);
    } else {
        console.log('rotate is NaN', rotate);
    }

    translateTo(api, page, shape, x, y);
    after_migrate(document, page, api, origin);
}

function __get_env_transform_for_migrate(target_env: GroupShape) {
    let ohflip = false;
    let ovflip = false;
    let p: Shape | undefined = target_env;

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