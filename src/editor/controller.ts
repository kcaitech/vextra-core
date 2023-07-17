import { translateTo, translate, expandTo, adjustLT2, adjustRT2, adjustRB2, adjustLB2 } from "./frame";
import { Shape, GroupShape } from "../data/shape";
import { getFormatFromBase64 } from "../basic/utils";
import { ShapeType } from "../data/typesdefine";
import { ShapeFrame } from "../data/shape";
import { newArtboard, newImageShape, newLineShape, newOvalShape, newRectShape, newTextShape } from "./creator";
import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
import { v4 } from "uuid";
import { Document } from "../data/document";
import { ResourceMgr } from "../data/basic";
import { Api } from "./command/recordapi";
import { Matrix } from "basic/matrix";
interface PageXY { // 页面坐标系的xy
    x: number
    y: number
}
export interface AspectRatio {
    x: number
    y: number
}
export interface ControllerOrigin { // 页面坐标系的xy
    x: number
    y: number
}
export interface ControllerFrame {// 页面坐标系
    x: number
    y: number
    width: number
    height: number
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
export interface AsyncTransfer {
    migrate: (targetParent: GroupShape) => void;
    trans: (start: PageXY, end: PageXY) => void;
    transByWheel: (dx: number, dy: number) => void;
    close: () => undefined;
}
export interface AsyncBaseAction {
    execute: (type: CtrlElementType, start: PageXY, end: PageXY, deg?: number, actionType?: 'rotate' | 'scale') => void;
    close: () => undefined;
}
export interface AsyncLineAction {
    execute: (type: CtrlElementType, end: PageXY, deg: number, actionType?: 'rotate' | 'scale') => void;
    close: () => undefined;
}
export interface AsyncCreator {
    init: (page: Page, parent: GroupShape, type: ShapeType, name: string, frame: ShapeFrame) => Shape | undefined;
    init_media: (page: Page, parent: GroupShape, name: string, frame: ShapeFrame, media: { buff: Uint8Array, base64: string }) => Shape | undefined;
    init_text: (page: Page, parent: GroupShape, frame: ShapeFrame, content: string) => Shape | undefined;
    setFrame: (point: PageXY) => void;
    setFrameByWheel: (point: PageXY) => void;
    close: () => undefined;
}

export enum Status {
    Pending = 'pending',
    Fulfilled = 'fulfilled'
}
// 单个图形处理(普通对象)
function singleHdl(api: Api, page: Page, shape: Shape, type: CtrlElementType, start: PageXY, end: PageXY, deg?: number, actionType?: 'rotate' | 'scale') {
    if (actionType === 'rotate') { // 旋转操作
        const newDeg = (shape.rotation || 0) + (deg || 0);
        api.shapeModifyRotate(page, shape, newDeg);
    } else { // 缩放操作
        if (type === CtrlElementType.RectLT) {
            adjustLT2(api, page, shape, end.x, end.y);
        } else if (type === CtrlElementType.RectRT) {
            adjustRT2(api, page, shape, end.x, end.y);
        } else if (type === CtrlElementType.RectRB) {
            adjustRB2(api, page, shape, end.x, end.y);
        } else if (type === CtrlElementType.RectLB) {
            adjustLB2(api, page, shape, end.x, end.y);
        } else if (type === CtrlElementType.RectTop) {
            const m = shape.matrix2Root();
            const p1 = m.inverseCoord(start.x, start.y);
            const p2 = m.inverseCoord(end.x, end.y);
            const dy = p2.y - p1.y;
            const { x, y } = m.computeCoord(0, dy);
            adjustLT2(api, page, shape, x, y);
        } else if (type === CtrlElementType.RectRight) {
            const m = shape.matrix2Root();
            const p1 = m.inverseCoord(start.x, start.y);
            const p2 = m.inverseCoord(end.x, end.y);
            const dx = p2.x - p1.x;
            const { x, y } = m.computeCoord(shape.frame.width + dx, 0);
            adjustRT2(api, page, shape, x, y);
        } else if (type === CtrlElementType.RectBottom) {
            const m = shape.matrix2Root();
            const p1 = m.inverseCoord(start.x, start.y);
            const p2 = m.inverseCoord(end.x, end.y);
            const dy = p2.y - p1.y;
            const { x, y } = m.computeCoord(shape.frame.width, shape.frame.height + dy);
            adjustRB2(api, page, shape, x, y);
        } else if (type === CtrlElementType.RectLeft) {
            const m = shape.matrix2Root();
            const p1 = m.inverseCoord(start.x, start.y);
            const p2 = m.inverseCoord(end.x, end.y);
            const dx = p2.x - p1.x;
            const { x, y } = m.computeCoord(dx, shape.frame.height);
            adjustLB2(api, page, shape, x, y);
        }
    }
}
// 单个图形处理(编组对象)
function singleHdl4Group(api: Api, page: Page, shape: Shape, type: CtrlElementType, start: PageXY, end: PageXY, deg?: number, actionType?: 'rotate' | 'scale') {
    singleHdl(api, page, shape, type, start, end, deg, actionType);
}
// 处理异步编辑
export class Controller {
    private __repo: CoopRepository;
    private __document: Document;
    constructor(repo: CoopRepository, document: Document) {
        this.__repo = repo;
        this.__document = document;
    }
    create(type: ShapeType, name: string, frame: ShapeFrame, ref?: string, mediasMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>): Shape {
        switch (type) {
            case ShapeType.Artboard: return newArtboard(name, frame);
            case ShapeType.Rectangle: return newRectShape(name, frame);
            case ShapeType.Oval: return newOvalShape(name, frame);
            case ShapeType.Line: return newLineShape(name, frame);
            case ShapeType.Text: {
                const shape = newTextShape(name, this.__document.measureFun);
                shape.frame = frame;
                return shape;
            }
            case ShapeType.Image: return newImageShape(name, frame, ref, mediasMgr);
            default: return newRectShape(name, frame);
        }
    }
    // 创建自定义frame的图形
    public asyncCreator(mousedownOnPage: PageXY): AsyncCreator {
        const anchor: PageXY = mousedownOnPage;
        const api = this.__repo.start("createshape", {});
        let status: Status = Status.Pending;
        let newShape: Shape | undefined;
        let savepage: Page | undefined;
        const init = (page: Page, parent: GroupShape, type: ShapeType, name: string, frame: ShapeFrame): Shape | undefined => {
            savepage = page;
            status = Status.Pending;
            const shape = this.create(type, name, frame);
            const xy = parent.frame2Root();
            shape.frame.x -= xy.x;
            shape.frame.y -= xy.y;
            api.shapeInsert(page, parent, shape, parent.childs.length)
            newShape = parent.childs.at(-1); // 需要把proxy代理之后的shape返回，否则无法触发notify
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
            return newShape
        }
        const init_media = (page: Page, parent: GroupShape, name: string, frame: ShapeFrame, media: { buff: Uint8Array, base64: string }): Shape | undefined => {
            status = Status.Pending;
            if (this.__document) { // media文件处理
                savepage = page;
                const format = getFormatFromBase64(media.base64);
                const ref = `${v4()}.${format}`;
                this.__document.mediasMgr.add(ref, media);
                const shape = this.create(ShapeType.Image, name, frame, ref, this.__document.mediasMgr);
                const xy = parent.frame2Root();
                shape.frame.x -= xy.x;
                shape.frame.y -= xy.y;
                api.shapeInsert(page, parent, shape, parent.childs.length)
                newShape = parent.childs.at(-1); // 需要把proxy代理之后的shape返回，否则无法触发notify
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
                return newShape
            }
        }
        const init_text = (page: Page, parent: GroupShape, frame: ShapeFrame, content: string): Shape | undefined => {
            status = Status.Pending;
            if (this.__document) {
                let name = content;
                if (content.length > 19) {
                    name = name.slice(0, 19) + '...';
                }
                const shape = newTextShape(name, this.__document.measureFun);
                shape.text.insertText(content, 0);
                const xy = parent.frame2Root();
                shape.frame.x = frame.x - xy.x;
                shape.frame.y = frame.y - xy.y;
                const layout = shape.getLayout();
                shape.frame.width = layout.contentWidth;
                shape.frame.height = layout.contentHeight;

                api.shapeInsert(page, parent, shape, parent.childs.length)
                newShape = parent.childs.at(-1);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
                return newShape
            }
        }
        const setFrame = (point: PageXY) => {
            if (!newShape || !savepage) return;
            status = Status.Pending;
            if (newShape.type === ShapeType.Line) {
                const { x: sx, y: sy } = anchor;
                const { x: px, y: py } = point;
                if (newShape.isFlippedHorizontal) {
                    if ((px - sx) > 0) {
                        api.shapeModifyHFlip(savepage, newShape, !newShape.isFlippedHorizontal)
                    }
                } else {
                    if ((px - sx) < 0) {
                        api.shapeModifyHFlip(savepage, newShape, !newShape.isFlippedHorizontal)
                    }
                }
                if (newShape.isFlippedVertical) {
                    if ((py - sy) > 0) {
                        api.shapeModifyVFlip(savepage, newShape, !newShape.isFlippedVertical)
                    }
                } else {
                    if ((py - sy) < 0) {
                        api.shapeModifyVFlip(savepage, newShape, !newShape.isFlippedVertical)
                    }
                }
                const height = Math.abs(py - sy);
                const width = Math.abs(px - sx);
                expandTo(api, savepage, newShape, width, height);
            } else {
                const { x: sx, y: sy } = anchor;
                const { x: px, y: py } = point;
                const x1 = { x: Math.min(sx, px), y: Math.min(sy, py) };
                const x2 = { x: Math.max(sx, px), y: Math.max(sy, py) };
                const height = x2.y - x1.y;
                const width = x2.x - x1.x;
                expandTo(api, savepage, newShape, width, height);
                translateTo(api, savepage, newShape, x1.x, x1.y);
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const setFrameByWheel = (point: PageXY) => {
            if (!newShape || !savepage) return;
            status = Status.Pending;
            const { x: sx, y: sy } = anchor;
            const { x: px, y: py } = point;
            const x1 = { x: Math.min(sx, px), y: Math.min(sy, py) };
            const x2 = { x: Math.max(sx, px), y: Math.max(sy, py) };
            const height = x2.y - x1.y;
            const width = x2.x - x1.x;
            expandTo(api, savepage, newShape, width, height);
            translateTo(api, savepage, newShape, x1.x, x1.y);
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }

        const close = () => {
            if (status == Status.Fulfilled && newShape && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { init, init_media, init_text, setFrame, setFrameByWheel, close }
    }
    // 图形编辑，适用于基础控点、控边的异步编辑
    public asyncRectEditor(shapes: Shape[], page: Page): AsyncBaseAction {
        const api = this.__repo.start("action", {});
        let status: Status = Status.Pending;
        const execute = (type: CtrlElementType, start: PageXY, end: PageXY, deg?: number, actionType?: 'rotate' | 'scale') => {
            status = Status.Pending;
            const len = shapes.length;
            if (len === 1) {
                const item = shapes[0];
                if (item.type === ShapeType.Group) {
                    singleHdl4Group(api, page, item, type, start, end, deg, actionType); // 编组对象处理
                } else {
                    singleHdl(api, page, item, type, start, end, deg, actionType); // 普通对象处理
                }
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { execute, close };
    }
    public asyncLineEditor(shape: Shape): AsyncLineAction {
        if (this.__repo.transactCtx.transact) {
            this.__repo.rollback();
        }
        const api = this.__repo.start("action", {});
        const page = shape.getPage() as Page;
        let status: Status = Status.Pending;
        const execute = (type: CtrlElementType, end: PageXY, deg: number, actionType?: 'rotate' | 'scale') => {
            status = Status.Pending;
            if (shape.isLocked) return;
            if (actionType === 'rotate') {
                const newDeg = (shape.rotation || 0) + deg;
                api.shapeModifyRotate(page, shape, newDeg);
            } else {
                if (type === CtrlElementType.LineStart) {
                    adjustLT2(api, page, shape, end.x, end.y);
                } else if (type === CtrlElementType.LineEnd) {
                    adjustRB2(api, page, shape, end.x, end.y);
                }
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
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
    // 图形位置移动
    public asyncTransfer(shapes: Shape[], page: Page): AsyncTransfer {
        const api = this.__repo.start("transfer", {});
        let status: Status = Status.Pending;
        const migrate = (targetParent: GroupShape) => {
            status = Status.Pending;
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const origin: GroupShape = shape.parent as GroupShape;
                const { x, y } = shape.frame2Root();
                api.shapeMove(page, origin, origin.indexOfChild(shape), targetParent, targetParent.childs.length)
                translateTo(api, page, shape, x, y);
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const trans = (start: PageXY, end: PageXY) => {
            status = Status.Pending;
            for (let i = 0; i < shapes.length; i++) {
                if (shapes[i].isLocked) continue; // 🔒住不让动
                translate(api, page, shapes[i], end.x - start.x, end.y - start.y);
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const transByWheel = (dx: number, dy: number) => {
            status = Status.Pending;
            for (let i = 0; i < shapes.length; i++) {
                if (shapes[i].isLocked) continue; // 🔒住不让动
                translate(api, page, shapes[i], dx, dy);
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { migrate, trans, close, transByWheel }
    }
}