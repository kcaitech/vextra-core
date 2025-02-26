import {
    adjustRB2,
    expandTo,
    translate,
    translateTo,
} from "./frame";
import { CurvePoint, GroupShape, PathShape, PathShape2, Shape, ShapeFrame, ShapeType } from "../data/shape";
import { getFormatFromBase64 } from "../basic/utils";
import { ContactRoleType, CurveMode, FillType, ScrollBehavior, SideType } from "../data/typesdefine";
import {
    modifyTransformByEnv,
    newArrowShape,
    newArtboard,
    newContact,
    newCutoutShape,
    newDefaultTextShape,
    newImageFillShape,
    newLineShape,
    newOvalShape,
    newPolygonShape,
    newRectShape,
    newStellateShape,
    newTable,
    newTextShape
} from "./creator";

import { Page } from "../data/page";
import { CoopRepository } from "../coop/cooprepo";
import { v4 } from "uuid";
import { Document } from "../data/document";
import { Api } from "../coop/recordapi";
import { Artboard } from "../data/artboard";
import { uuid } from "../basic/uuid";
import { BorderSideSetting, ContactForm, ContactRole } from "../data/baseclasses";
import { ContactShape } from "../data/contact";
import { importCurvePoint, importGradient } from "../data/baseimport";
import { exportGradient } from "../data/baseexport";
import { is_state } from "./utils/other";
import { after_migrate, unable_to_migrate } from "./utils/migrate";
import { get_state_name, shape4border, shape4contextSettings, shape4fill } from "./symbol";
import {
    after_insert_point,
    before_modify_side,
    contact_edit,
    pathEdit,
    pointsEdit,
    update_frame_by_points
} from "./utils/path";
import { Color } from "../data/color";
import { adapt2Shape, ContactLineView, PageView, PathShapeView, ShapeView } from "../dataview";
import { ISave4Restore, LocalCmd, SelectionState } from "../coop/localcmd";
import { BasicArray } from "../data/basic";
import { Fill } from "../data/style";
import { TextAttr } from "../data/classes";
import { Transform } from "../data/transform";

interface PageXY { // 页面坐标系的xy
    x: number
    y: number
}

interface XY {
    x: number
    y: number
}

type Side = 'from' | 'to'

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

export interface AsyncCreator {
    init: (page: Page, parent: GroupShape, type: ShapeType, name: string, frame: ShapeFrame, attr?: TextAttr) => Shape | undefined;
    init_media: (page: Page, parent: GroupShape, name: string, frame: ShapeFrame, media: {
        buff: Uint8Array,
        base64: string
    }, originFrame: { width: number, height: number }) => Shape | undefined;
    init_text: (page: Page, parent: GroupShape, frame: ShapeFrame, content: string, attr?: TextAttr) => Shape | undefined;
    init_arrow: (page: Page, parent: GroupShape, name: string, frame: ShapeFrame) => Shape | undefined;
    init_contact: (page: Page, parent: GroupShape, frame: ShapeFrame, name: string, apex?: ContactForm) => Shape | undefined;
    setFrame: (point: PageXY) => void;
    setFrameByWheel: (point: PageXY) => void;
    collect: (page: Page | PageView, shapes: Shape[], target: Artboard) => void;
    init_table: (page: Page, parent: GroupShape, name: string, frame: ShapeFrame, row: number, col: number) => Shape | undefined;
    contact_to: (p: PageXY, to?: ContactForm) => void;
    migrate: (targetParent: GroupShape) => void;
    close: () => undefined;
    init_cutout: (page: Page, parent: GroupShape, name: string, frame: ShapeFrame) => Shape | undefined;
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

export interface AsyncContactEditor {
    pre: () => void;
    modify_contact_from: (m_target: PageXY, clear_target?: { apex: ContactForm, p: PageXY }) => void;
    modify_contact_to: (m_target: PageXY, clear_target?: { apex: ContactForm, p: PageXY }) => void;
    before: (index: number) => void;
    modify_sides: (index: number, dx: number, dy: number) => void;
    migrate: (targetParent: GroupShape) => void;
    close: () => undefined;
}

export interface AsyncOpacityEditor {
    execute: (contextSettingOpacity: number) => void;
    close: () => undefined;
}

export interface AsyncBorderThickness {
    execute: (contextSettingThickness: number) => void;
    close: () => undefined;
}

export interface AsyncPathHandle {
    pre: (index: number) => void;
    execute: (side: Side, from: XY, to: XY) => void;
    abort: () => undefined;
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
                return newArtboard(name, frame);
            case ShapeType.Rectangle:
                return newRectShape(name, frame);
            case ShapeType.Oval:
                return newOvalShape(name, frame);
            case ShapeType.Line:
                return newLineShape(name, frame);
            case ShapeType.Polygon:
                return newPolygonShape(name, frame);
            case ShapeType.Star:
                return newStellateShape(name, frame);
            case ShapeType.Text: {
                if (attr) return newDefaultTextShape(name, attr, frame);
                return newTextShape(name, frame);
            }
            default:
                return newRectShape(name, frame);
        }
    }

    // 创建自定义frame的图形
    public asyncCreator(mousedownOnPage: PageXY, isLockSizeRatio?: boolean): AsyncCreator {
        const anchor: PageXY = mousedownOnPage;
        let status: Status = Status.Pending;
        let newShape: Shape | undefined;
        let savepage: Page | undefined;
        const api = this.__repo.start("createshape", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = newShape ? [newShape.id] : [];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        const init = (page: Page, parent: GroupShape, type: ShapeType, name: string, frame: ShapeFrame, attr?: TextAttr): Shape | undefined => {
            try {
                savepage = page;
                status = Status.Pending;

                const shape = this.create(type, name, frame, attr);

                if (shape.type !== ShapeType.Line) {
                    shape.constrainerProportions = !!isLockSizeRatio;
                }

                modifyTransformByEnv(shape, parent);
                const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                let targetIndex = parent.childs.length;
                if (_types.includes(parent.type)) {
                    const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                    const fixed_index = parent.childs.findIndex(s => s.scrollBehavior === Fixed);
                    targetIndex = fixed_index === -1 ? parent.childs.length : fixed_index;
                }
                api.shapeInsert(this.__document, page, parent, shape, targetIndex);

                newShape = parent.childs[parent.childs.length - 1];

                if (newShape.type === ShapeType.Artboard && parent instanceof Page) {
                    api.addFillAt(page, newShape, new Fill(new BasicArray(), uuid(), true, FillType.SolidColor, new Color(0, 0, 0, 0)), 0);
                }

                translateTo(api, savepage, newShape, frame.x, frame.y);

                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
                return newShape
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const init_arrow = (page: Page, parent: GroupShape, name: string, frame: ShapeFrame): Shape | undefined => {
            try {
                savepage = page;
                status = Status.Pending;

                const shape = newArrowShape(name, frame);

                modifyTransformByEnv(shape, parent);
                const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                let targetIndex = parent.childs.length;
                if (_types.includes(parent.type)) {
                    const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                    const fixed_index = parent.childs.findIndex(s => s.scrollBehavior === Fixed);
                    targetIndex = fixed_index === -1 ? parent.childs.length : fixed_index;
                }
                api.shapeInsert(this.__document, page, parent, shape, targetIndex);
                newShape = parent.childs[targetIndex];

                translateTo(api, savepage, newShape, frame.x, frame.y);

                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
                return newShape
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const init_media = (page: Page, parent: GroupShape, name: string, frame: ShapeFrame, media: {
            buff: Uint8Array,
            base64: string
        }, originFrame: { width: number, height: number }): Shape | undefined => {
            status = Status.Pending;
            if (this.__document) { // media文件处理
                try {
                    savepage = page;
                    const format = getFormatFromBase64(media.base64);
                    const ref = `${v4()}.${format}`;
                    this.__document.mediasMgr.add(ref, media);
                    const shape = newImageFillShape(name, frame, this.__document.mediasMgr, originFrame, ref);
                    const xy = parent.frame2Root();
                    shape.transform.translateX -= xy.x;
                    shape.transform.translateY -= xy.y;
                    const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                    let targetIndex = parent.childs.length;
                    if (_types.includes(parent.type)) {
                        const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                        const fixed_index = parent.childs.findIndex(s => s.scrollBehavior === Fixed);
                        targetIndex = fixed_index === -1 ? parent.childs.length : fixed_index;
                    }
                    api.shapeInsert(this.__document, page, parent, shape, targetIndex)
                    newShape = parent.childs[targetIndex];

                    this.__repo.transactCtx.fireNotify();
                    status = Status.Fulfilled;
                    return newShape
                } catch (e) {
                    console.error(e);
                    status = Status.Exception;
                }
            }
        }
        const init_table = (page: Page, parent: GroupShape, name: string, frame: ShapeFrame, row: number, col: number): Shape | undefined => {
            try {
                savepage = page;
                status = Status.Pending;
                const shape = newTable(name, frame, row, col, this.__document.mediasMgr);
                const xy = parent.frame2Root();
                shape.transform.translateX -= xy.x;
                shape.transform.translateY -= xy.y;
                const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                let targetIndex = parent.childs.length;
                if (_types.includes(parent.type)) {
                    const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                    const fixed_index = parent.childs.findIndex(s => s.scrollBehavior === Fixed);
                    targetIndex = fixed_index === -1 ? parent.childs.length : fixed_index;
                }
                api.shapeInsert(this.__document, page, parent, shape, targetIndex);
                newShape = parent.childs[targetIndex];

                if (newShape?.type === ShapeType.Artboard) api.setFillColor(page, newShape, 0, new Color(0, 0, 0, 0));
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
                return newShape
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const init_text = (page: Page, parent: GroupShape, frame: ShapeFrame, content: string, attr?: TextAttr): Shape | undefined => {
            status = Status.Pending;
            if (this.__document) {
                try {
                    let name = content;
                    if (content.length > 19) {
                        name = name.slice(0, 19) + '...';
                    }
                    const shape = attr ? newDefaultTextShape(name, attr) : newTextShape(name);

                    shape.constrainerProportions = !!isLockSizeRatio;

                    modifyTransformByEnv(shape, parent);

                    shape.text.insertText(content, 0);

                    const layout = shape.getLayout();
                    shape.size.width = layout.contentWidth;
                    shape.size.height = layout.contentHeight;
                    const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                    let targetIndex = parent.childs.length;
                    if (_types.includes(parent.type)) {
                        const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                        const fixed_index = parent.childs.findIndex(s => s.scrollBehavior === Fixed);
                        targetIndex = fixed_index === -1 ? parent.childs.length : fixed_index;
                    }
                    api.shapeInsert(this.__document, page, parent, shape, targetIndex)
                    newShape = parent.childs[targetIndex];

                    translateTo(api, page, newShape, frame.x, frame.y);

                    this.__repo.transactCtx.fireNotify();
                    status = Status.Fulfilled;
                    return newShape
                } catch (e) {
                    console.error(e);
                    status = Status.Exception;
                }
            }
        }
        const init_contact = (page: Page, parent: GroupShape, frame: ShapeFrame, name: string, apex?: ContactForm): Shape | undefined => {
            try {
                savepage = page;
                status = Status.Pending;
                const shape = newContact(name, frame, apex);
                const xy = parent.frame2Root();
                shape.transform.translateX -= xy.x;
                shape.transform.translateY -= xy.y;
                const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                let targetIndex = parent.childs.length;
                if (_types.includes(parent.type)) {
                    const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                    const fixed_index = parent.childs.findIndex(s => s.scrollBehavior === Fixed);
                    targetIndex = fixed_index === -1 ? parent.childs.length : fixed_index;
                }
                api.shapeInsert(this.__document, page, parent, shape, targetIndex);
                newShape = parent.childs[targetIndex];
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
                return newShape
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const init_cutout = (page: Page, parent: GroupShape, name: string, frame: ShapeFrame): Shape | undefined => {
            try {
                savepage = page;
                status = Status.Pending;

                const shape = newCutoutShape(name, frame);

                shape.constrainerProportions = !!isLockSizeRatio;

                modifyTransformByEnv(shape, parent);
                const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                let targetIndex = parent.childs.length;
                if (_types.includes(parent.type)) {
                    const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                    const fixed_index = parent.childs.findIndex(s => s.scrollBehavior === Fixed);
                    targetIndex = fixed_index === -1 ? parent.childs.length : fixed_index;
                }
                api.shapeInsert(this.__document, page, parent, shape, targetIndex);
                newShape = parent.childs[targetIndex];

                translateTo(api, page, newShape, frame.x, frame.y);

                newShape && api.setFillColor(page, newShape, 0, new Color(0, 0, 0, 0));
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
                return newShape
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const contact_to = (p: PageXY, to?: ContactForm) => {
            if (!newShape || !savepage) return;
            try {
                status = Status.Pending;
                pathEdit(api, savepage, newShape as PathShape, 1, p);
                api.shapeModifyContactTo(savepage, newShape as ContactShape, to);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const migrate = (targetParent: GroupShape) => {
            if (!newShape || !savepage) return;
            try {
                status = Status.Pending;
                const origin: GroupShape = newShape.parent as GroupShape;
                const { x, y } = newShape.frame2Root();
                let toIdx = targetParent.childs.length;
                if (origin.id === targetParent.id) --toIdx;
                api.shapeMove(savepage, origin, origin.indexOfChild(newShape), targetParent, toIdx);
                translateTo(api, savepage, newShape, x, y);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const setFrame = (point: PageXY) => {
            if (!newShape || !savepage) {
                return;
            }
            status = Status.Pending;
            try {
                if (newShape.type === ShapeType.Line) {
                    pathEdit(api, savepage, newShape as PathShape, 1, point); // 线条的创建过程由路径编辑来完成
                } else {
                    adjustRB2(api, this.__document, savepage, newShape, point.x, point.y);
                }
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const setFrameByWheel = (point: PageXY) => {
            if (!newShape || !savepage) return;
            try {
                status = Status.Pending;
                const { x: sx, y: sy } = anchor;
                const { x: px, y: py } = point;
                const x1 = { x: Math.min(sx, px), y: Math.min(sy, py) };
                const x2 = { x: Math.max(sx, px), y: Math.max(sy, py) };
                const height = x2.y - x1.y;
                const width = x2.x - x1.x;
                expandTo(api, this.__document, savepage, newShape, width, height);
                translateTo(api, savepage, newShape, x1.x, x1.y);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const collect = (page: Page | PageView, shapes: Shape[], target: Artboard) => { // 容器收束
            page = page instanceof PageView ? page.data : page;
            status = Status.Pending;
            try {
                if (shapes.length) {
                    for (let i = 0; i < shapes.length; i++) {
                        const s = shapes[i];
                        const p = s.parent as GroupShape;
                        const idx = p.indexOfChild(s);
                        api.shapeMove(page, p, idx, target, 0);
                        if (p.childs.length <= 0) {
                            deleteEmptyGroupShape(this.__document, page, s, api);
                        }
                    }
                    const realXY = shapes.map((s) => s.frame2Root());
                    const t_xy = target.frame;
                    const savep = shapes[0].parent as GroupShape;
                    const m = (savep.matrix2Root().inverse);
                    for (let i = 0; i < shapes.length; i++) {
                        const c = shapes[i];
                        const r = realXY[i]
                        const target = m.computeCoord(r.x, r.y);
                        const cur = c.matrix2Parent().computeCoord(0, 0);
                        api.shapeModifyXY(page, c, c.frame.x + target.x - cur.x - t_xy.x, c.frame.y + target.y - cur.y - t_xy.y);
                    }
                }

                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const close = () => {
            if (status == Status.Fulfilled && newShape && this.__repo.isNeedCommit()) {
                try {
                    if (newShape.type === ShapeType.Artboard && newShape.parent instanceof Page) {
                        api.setFillColor(savepage!, newShape, 0, new Color(1, 255, 255, 255));
                    }

                    if (newShape.type === ShapeType.Contact) {
                        if ((newShape as ContactShape).from) {
                            const shape1 = savepage?.getShape((newShape as ContactShape).from!.shapeId);
                            if (shape1) {
                                api.addContactAt(savepage!, shape1, new ContactRole(new BasicArray<number>(), v4(), ContactRoleType.From, newShape.id), shape1.style.contacts?.length || 0);
                            }
                        }
                        if ((newShape as ContactShape).to) {
                            const shape1 = savepage?.getShape((newShape as ContactShape).to!.shapeId);
                            if (shape1) {
                                api.addContactAt(savepage!, shape1, new ContactRole(new BasicArray<number>(), v4(), ContactRoleType.To, newShape.id), shape1.style.contacts?.length || 0);
                            }
                        }
                    }

                    if (newShape.type === ShapeType.Line && savepage) {
                        update_frame_by_points(api, savepage, newShape as PathShape)
                    }
                    this.__repo.commit();
                } catch (e) {
                    console.error(e);
                    this.__repo.rollback();
                }
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return {
            init,
            init_media,
            init_text,
            init_arrow,
            init_contact,
            setFrame,
            setFrameByWheel,
            collect,
            init_table,
            contact_to,
            migrate,
            close,
            init_cutout
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
                    // console.log('targetParent.id === current_env_id');
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
                    // console.log('emit_by.id === current_env_id');
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
                pathEdit(api, page, shape, index, end, m);
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
                    pointsEdit(api, page, shape, points, indexes, dx, dy, segment);
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

    public asyncContactEditor(_shape: ContactShape | ContactLineView, _page: Page | PageView): AsyncContactEditor {
        const shape: ContactShape = _shape instanceof ShapeView ? adapt2Shape(_shape) as ContactShape : _shape as ContactShape;
        const page = _page instanceof PageView ? adapt2Shape(_page) as Page : _page;

        const api = this.__repo.start("action");
        let status: Status = Status.Pending;
        const pre = () => {
            try {
                status = Status.Pending
                const p = shape.getPoints();
                if (p.length === 0) {
                    throw new Error('none point');
                }

                const points = [p[0], p[p.length - 1]];
                for (let i = 0, len = points.length; i < len; i++) {
                    const p = importCurvePoint((points[i]));
                    p.id = v4();
                    points[i] = p;
                }

                const len = shape.points.length;
                api.deletePoints(page, shape as PathShape, 0, len, 0);

                api.contactModifyEditState(page, shape, false);

                api.addPoints(page, shape, points, 0);

                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const modify_contact_from = (m_target: PageXY, clear_target?: { apex: ContactForm, p: PageXY }) => {
            status = Status.Pending;
            try {
                if (clear_target) {
                    if (!shape.from) {
                        api.shapeModifyContactFrom(page, shape as ContactShape, clear_target.apex);
                        const shape1 = page.getShape(clear_target.apex.shapeId);
                        if (shape1) {
                            api.addContactAt(page, shape1, new ContactRole(new BasicArray<number>(), v4(), ContactRoleType.From, shape.id), shape1.style.contacts?.length || 0);
                        }
                    }

                    pathEdit(api, page, shape as PathShape, 0, clear_target.p);
                } else {
                    if (shape.from) {
                        const shape2 = page.getShape(shape.from.shapeId);
                        const index = shape2?.style?.contacts?.findIndex(i => i.shapeId === shape.id);
                        if (shape2 && index !== undefined && index > -1) {
                            api.removeContactRoleAt(page, shape2, index);
                        }
                        api.shapeModifyContactFrom(page, shape as ContactShape, undefined);
                    }

                    pathEdit(api, page, shape as PathShape, 0, m_target);
                }
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const modify_contact_to = (m_target: PageXY, clear_target?: { apex: ContactForm, p: PageXY }) => {
            status = Status.Pending;
            try {
                const idx = shape.points?.length;
                if (!idx) return false;
                if (clear_target) {
                    if (!shape.to) {
                        api.shapeModifyContactTo(page, shape as ContactShape, clear_target.apex);
                        const shape1 = page.getShape(clear_target.apex.shapeId);
                        if (shape1) {
                            api.addContactAt(page, shape1, new ContactRole(new BasicArray<number>(), v4(), ContactRoleType.To, shape.id), shape1.style.contacts?.length || 0);
                        }
                    }
                    pathEdit(api, page, shape as PathShape, idx - 1, clear_target.p);
                } else {
                    if (shape.to) {
                        const shape2 = page.getShape(shape.to.shapeId);
                        const index = shape2?.style?.contacts?.findIndex(i => i.shapeId === shape.id);
                        if (shape2 && index !== undefined && index > -1) {
                            api.removeContactRoleAt(page, shape2, index);
                        }

                        api.shapeModifyContactTo(page, shape as ContactShape, undefined);
                    }
                    pathEdit(api, page, shape as PathShape, idx - 1, m_target);
                }
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const migrate = (targetParent: GroupShape) => {
            status = Status.Pending;
            try {
                const origin: GroupShape = shape.parent as GroupShape;
                const { x, y } = shape.frame2Root();
                api.shapeMove(page, origin, origin.indexOfChild(shape), targetParent, targetParent.childs.length);
                translateTo(api, page, shape, x, y);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const before = (index: number) => {
            try {
                status === Status.Pending;
                before_modify_side(api, page, shape, index);
                status === Status.Fulfilled;
            } catch (error) {
                console.log(error);
            }
        }
        const modify_sides = (index: number, dx: number, dy: number) => {
            try {
                status = Status.Pending;
                contact_edit(api, page, shape, index, index + 1, dx, dy);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const close = () => {
            if (status === Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { pre, modify_contact_from, modify_contact_to, before, modify_sides, migrate, close }
    }

    public asyncBorderThickness(_shapes: ShapeView[], _page: PageView): AsyncBorderThickness {
        const page = _page.data;
        const api = this.__repo.start("asyncBorderThickness");
        let status: Status = Status.Pending;
        const execute = (thickness: number) => {
            status = Status.Pending;
            try {
                for (let i = 0, l = _shapes.length; i < l; i++) {
                    const s = shape4border(api, _page, _shapes[i]);
                    const borders = _shapes[i].getBorders();
                    const sideType = borders.sideSetting.sideType;
                    switch (sideType) {
                        case SideType.Normal:
                            api.setBorderSide(page, s, new BorderSideSetting(sideType, thickness, thickness, thickness, thickness));
                            break;
                        case SideType.Top:
                            api.setBorderThicknessTop(page, s, thickness);
                            break
                        case SideType.Right:
                            api.setBorderThicknessRight(page, s, thickness);
                            break
                        case SideType.Bottom:
                            api.setBorderThicknessBottom(page, s, thickness);
                            break
                        case SideType.Left:
                            api.setBorderThicknessLeft(page, s, thickness);
                            break
                        default:
                            api.setBorderSide(page, s, new BorderSideSetting(sideType, thickness, thickness, thickness, thickness));
                            break;
                    }
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
    public asyncBorderSideThickness(_shapes: ShapeView[], _page: PageView, type: SideType): AsyncBorderThickness {
        const page = _page.data;

        const api = this.__repo.start("asyncBorderSideThickness");
        let status: Status = Status.Pending;
        const execute = (thickness: number) => {
            status = Status.Pending;
            try {
                for (let i = 0, l = _shapes.length; i < l; i++) {
                    const s = shape4border(api, _page, _shapes[i]);
                    switch (type) {
                        case SideType.Top:
                            api.setBorderThicknessTop(page, s, thickness);
                            break
                        case SideType.Right:
                            api.setBorderThicknessRight(page, s, thickness);
                            break
                        case SideType.Bottom:
                            api.setBorderThicknessBottom(page, s, thickness);
                            break
                        case SideType.Left:
                            api.setBorderThicknessLeft(page, s, thickness);
                            break
                        default:
                            break;
                    }
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

    public asyncGradientEditor(shapes: ShapeView[], _page: PageView, index: number, type: 'fills' | 'borders'): AsyncGradientEditor {
        const page = _page.data;
        const api = this.__repo.start("asyncGradientEditor");
        let status: Status = Status.Pending;
        const execute_from = (from: { x: number, y: number }) => {
            status = Status.Pending;
            try {
                for (let i = 0, l = shapes.length; i < l; i++) {
                    const shape = shapes[i];
                    const grad_type = type === 'fills' ? shape.getFills() : shape.getBorders().strokePaints;
                    if (!grad_type?.length) {
                        continue;
                    }
                    const gradient_container = grad_type[index];
                    const gradient = gradient_container.gradient;
                    if (!gradient) return;
                    const new_gradient = importGradient(exportGradient(gradient));
                    new_gradient.from.x = from.x;
                    new_gradient.from.y = from.y;
                    const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                    const s = shape4fill(api, _page, shape);
                    f(page, s, index, new_gradient);
                }
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
                for (let i = 0, l = shapes.length; i < l; i++) {
                    const shape = shapes[i];
                    const grad_type = type === 'fills' ? shape.getFills() : shape.getBorders().strokePaints;
                    if (!grad_type?.length) {
                        continue;
                    }
                    const gradient_container = grad_type[index];
                    const gradient = gradient_container.gradient;
                    if (!gradient) return;
                    const new_gradient = importGradient(exportGradient(gradient));
                    new_gradient.to.x = to.x;
                    new_gradient.to.y = to.y;
                    const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                    const s = shape4fill(api, _page, shape);
                    f(page, s, index, new_gradient);
                }
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
                for (let i = 0, l = shapes.length; i < l; i++) {
                    const shape = shapes[i];
                    const grad_type = type === 'fills' ? shape.getFills() : shape.getBorders().strokePaints;
                    if (!grad_type?.length) {
                        continue;
                    }
                    const gradient_container = grad_type[index];
                    const gradient = gradient_container.gradient;
                    if (!gradient) return;
                    const new_gradient = importGradient(exportGradient(gradient));
                    new_gradient.elipseLength = length;
                    const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                    const s = shape4fill(api, _page, shape);
                    f(page, s, index, new_gradient);
                }
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
                const grad_color_type = type === 'fills' ? shapes[0].getFills() : shapes[0].getBorders().strokePaints;
                const f_stop = grad_color_type[index].gradient?.stops;
                if (f_stop) {
                    const idx = f_stop.findIndex((stop) => stop.id === id);
                    for (let i = 0, l = shapes.length; i < l; i++) {
                        const shape = shapes[i];
                        const grad_type = type === 'fills' ? shape.getFills() : shape.getBorders().strokePaints;
                        if (!grad_type?.length) {
                            continue;
                        }
                        const gradient_container = grad_type[index];
                        const gradient = gradient_container.gradient;
                        if (!gradient) return;
                        const new_gradient = importGradient(exportGradient(gradient));
                        if (idx === -1) {
                            console.warn(`gradient stop not found: ${id}`);
                            continue;
                        }
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
                        const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                        const s = shape4fill(api, _page, shape);
                        f(page, s, index, new_gradient);
                    }
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
        return { execute_from, execute_to, execute_elipselength, execute_stop_position, close }
    }
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

function __migrate(document: Document,
    api: Api, page: Page, targetParent: GroupShape, shape: Shape, dlt: string, index: number,
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