import { translateTo, translate, expandTo, adjustLT2, adjustRT2, adjustRB2, adjustLB2 } from "./frame";
import { Shape, GroupShape, TextShape, PathShape } from "../data/shape";
import { getFormatFromBase64 } from "../basic/utils";
import { ShapeType, TextBehaviour } from "../data/typesdefine";
import { ShapeFrame } from "../data/shape";
import { newArtboard, newGroupShape, newImageShape, newLineShape, newOvalShape, newRectShape, newTextShape } from "./creator";
import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
import { v4 } from "uuid";
import { Document } from "../data/document";
import { ResourceMgr } from "../data/basic";
import { Api } from "./command/recordapi";
import { Matrix } from "../basic/matrix";
import { fixTextShapeFrameByLayout } from "./utils";
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
export interface AsyncMultiAction {
    execute: (type: CtrlElementType, start: PageXY, end: PageXY, deg?: number, actionType?: 'rotate' | 'scale') => void;
    close: () => undefined | Shape[];
}
export interface AsyncMultiAction2 {
    executeScale: (origin1: PageXY, origin2: PageXY, scaleX: number, scaleY: number) => void;
    close: () => void;
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
function setFrame(page: Page, shape: Shape, x: number, y: number, w: number, h: number, api: Api): boolean {
    const frame = shape.frame;
    let changed = false;
    if (x !== frame.x) {
        api.shapeModifyX(page, shape, x)
        changed = true;
    }
    if (y !== frame.y) {
        api.shapeModifyY(page, shape, y)
        changed = true;
    }
    if (w !== frame.width || h !== frame.height) {
        if (shape instanceof TextShape) {
            const textBehaviour = shape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;
            if (h !== frame.height) {
                if (textBehaviour !== TextBehaviour.FixWidthAndHeight) {
                    api.shapeModifyTextBehaviour(page, shape, TextBehaviour.FixWidthAndHeight);
                }
            }
            else {
                if (textBehaviour === TextBehaviour.Flexible) {
                    api.shapeModifyTextBehaviour(page, shape, TextBehaviour.Fixed);
                }
            }
            api.shapeModifyWH(page, shape, w, h)
            fixTextShapeFrameByLayout(api, page, shape);
        }
        else if (shape instanceof GroupShape) {
            const saveW = frame.width;
            const saveH = frame.height;
            api.shapeModifyWH(page, shape, w, h)
            const scaleX = frame.width / saveW;
            const scaleY = frame.height / saveH;
            afterModifyGroupShapeWH(api, page, shape, scaleX, scaleY);
        }
        else {
            api.shapeModifyWH(page, shape, w, h)
        }
        changed = true;
    }
    return changed;
}
function afterModifyGroupShapeWH(api: Api, page: Page, shape: GroupShape, scaleX: number, scaleY: number) {
    if (shape.type === ShapeType.Artboard) return; // 容器不需要调整子对象
    const childs = shape.childs;
    for (let i = 0, len = childs.length; i < len; i++) {
        const c = childs[i];
        if (!c.rotation) {
            const cFrame = c.frame;
            const cX = cFrame.x * scaleX;
            const cY = cFrame.y * scaleY;
            const cW = cFrame.width * scaleX;
            const cH = cFrame.height * scaleY;
            setFrame(page, c, cX, cY, cW, cH, api);
        }
        else if (c instanceof GroupShape && c.type === ShapeType.Group) {
            // 需要摆正
            const boundingBox = c.boundingBox();
            const matrix = c.matrix2Parent();

            for (let i = 0, len = c.childs.length; i < len; i++) { // 将旋转、翻转放入到子对象
                const cc = c.childs[i]
                const m1 = cc.matrix2Parent();
                m1.multiAtLeft(matrix);
                const target = m1.computeCoord(0, 0);

                if (c.rotation) api.shapeModifyRotate(page, cc, (cc.rotation || 0) + c.rotation);
                if (c.isFlippedHorizontal) api.shapeModifyHFlip(page, cc, !cc.isFlippedHorizontal);
                if (c.isFlippedVertical) api.shapeModifyVFlip(page, cc, !cc.isFlippedVertical);

                const m2 = cc.matrix2Parent();
                m2.trans(boundingBox.x, boundingBox.y);
                const cur = m2.computeCoord(0, 0);

                api.shapeModifyX(page, cc, cc.frame.x + target.x - cur.x);
                api.shapeModifyY(page, cc, cc.frame.y + target.y - cur.y);
            }

            if (c.rotation) api.shapeModifyRotate(page, c, 0);
            if (c.isFlippedHorizontal) api.shapeModifyHFlip(page, c, !c.isFlippedHorizontal);
            if (c.isFlippedVertical) api.shapeModifyVFlip(page, c, !c.isFlippedVertical);

            api.shapeModifyX(page, c, boundingBox.x * scaleX);
            api.shapeModifyY(page, c, boundingBox.y * scaleY);
            const width = boundingBox.width * scaleX;
            const height = boundingBox.height * scaleY;
            api.shapeModifyWH(page, c, width, height);
            afterModifyGroupShapeWH(api, page, c, scaleX, scaleY);
        }
        else if (c instanceof PathShape) {
            // 摆正并处理points
            const matrix = c.matrix2Parent();
            const cFrame = c.frame;
            const boundingBox = c.boundingBox();

            matrix.preScale(cFrame.width, cFrame.height);
            if (c.rotation) api.shapeModifyRotate(page, c, 0);
            if (c.isFlippedHorizontal) api.shapeModifyHFlip(page, c, !c.isFlippedHorizontal);
            if (c.isFlippedVertical) api.shapeModifyVFlip(page, c, !c.isFlippedVertical);

            api.shapeModifyX(page, c, boundingBox.x);
            api.shapeModifyY(page, c, boundingBox.y);
            api.shapeModifyWH(page, c, boundingBox.width, boundingBox.height);

            const matrix2 = c.matrix2Parent();
            matrix2.preScale(boundingBox.width, boundingBox.height); // 当对象太小时，求逆矩阵会infinity
            matrix.multiAtLeft(matrix2.inverse);
            const points = c.points;
            for (let i = 0, len = points.length; i < len; i++) {
                const p = points[i];
                if (p.hasCurveFrom) {
                    const curveFrom = matrix.computeCoord(p.curveFrom);
                    api.shapeModifyCurvFromPoint(page, c, i, curveFrom);
                }
                if (p.hasCurveTo) {
                    const curveTo = matrix.computeCoord(p.curveTo);
                    api.shapeModifyCurvToPoint(page, c, i, curveTo);
                }
                const point = matrix.computeCoord(p.point);
                api.shapeModifyCurvPoint(page, c, i, point);
            }

            // scale
            api.shapeModifyX(page, c, boundingBox.x * scaleX);
            api.shapeModifyY(page, c, boundingBox.y * scaleY);
            const width = boundingBox.width * scaleX;
            const height = boundingBox.height * scaleY;
            api.shapeModifyWH(page, c, width, height);
        }
        else { // textshape imageshape symbolrefshape
            // 需要调整位置跟大小
            const cFrame = c.frame;
            const matrix = c.matrix2Parent();
            const current = [{ x: 0, y: 0 }, { x: cFrame.width, y: cFrame.height }]
                .map((p) => matrix.computeCoord(p));

            const target = current.map((p) => {
                return { x: p.x * scaleX, y: p.y * scaleY }
            })
            const matrixarr = matrix.toArray();
            matrixarr[4] = target[0].x;
            matrixarr[5] = target[0].y;
            const m2 = new Matrix(matrixarr);
            const m2inverse = new Matrix(m2.inverse)

            const invertTarget = target.map((p) => m2inverse.computeCoord(p))

            const wh = { x: invertTarget[1].x - invertTarget[0].x, y: invertTarget[1].y - invertTarget[0].y }

            // 计算新的matrix 2 parent
            const matrix2 = new Matrix();
            {
                const cx = wh.x / 2;
                const cy = wh.y / 2;
                matrix2.trans(-cx, -cy);
                if (c.rotation) matrix2.rotate(c.rotation / 360 * 2 * Math.PI);
                if (c.isFlippedHorizontal) matrix2.flipHoriz();
                if (c.isFlippedVertical) matrix2.flipVert();
                matrix2.trans(cx, cy);
                matrix2.trans(cFrame.x, cFrame.y);
            }
            const xy = matrix2.computeCoord(0, 0);

            const dx = target[0].x - xy.x;
            const dy = target[0].y - xy.y;
            setFrame(page, c, cFrame.x + dx, cFrame.y + dy, wh.x, wh.y, api);
        }
    }
}

function setShapesFrame(api: Api, page: Page, shapes: Shape[], origin1: { x: number, y: number }, origin2: { x: number, y: number }, scaleX: number, scaleY: number) {
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        if (!shape.rotation) {
            const s_r_frame = shape.frame2Root();
            const xy_in_ctrl = { x: s_r_frame.x - origin1.x, y: s_r_frame.y - origin1.y };
            const s_r_xy_n = { x: origin2.x + xy_in_ctrl.x * scaleX, y: origin2.y + xy_in_ctrl.y * scaleY };
            let m = shape.matrix2Parent();
            m.multiAtLeft(m.inverse);
            const t_xy = m.computeCoord(s_r_xy_n);
            const n_w = shape.frame.width * scaleX;
            const n_h = shape.frame.height * scaleY;
            setFrame(page, shape, t_xy.x, t_xy.y, n_w, n_h, api);
        }
    }
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
                singleHdl(api, page, shapes[0], type, start, end, deg, actionType); // 普通对象处理
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
    public asyncMultiEditor_beta(shapes: Shape[], page: Page): AsyncMultiAction2 {
        const api = this.__repo.start("start", {});
        let status: Status = Status.Pending;
        const executeScale = (origin1: PageXY, origin2: PageXY, scaleX: number, scaleY: number) => {
            status = Status.Pending;
            setShapesFrame(api, page, shapes, origin1, origin2, scaleX, scaleY);
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const executeRotate = () => { }
        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
        }
        return { executeScale, close };
    }
    public asyncMultiEditor(shapes: Shape[], page: Page): AsyncMultiAction {
        const api = this.__repo.start("action", {});
        const tool = insert_tool(shapes, page, api);
        let status: Status = Status.Pending;
        const execute = (type: CtrlElementType, start: PageXY, end: PageXY, deg?: number, actionType?: 'rotate' | 'scale') => {
            status = Status.Pending;
            singleHdl(api, page, tool, type, start, end, deg, actionType);
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const close = () => {
            const s = de_tool(tool, page, api);
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return s;
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
function insert_tool(shapes: Shape[], page: Page, api: Api) {
    const fshape = shapes[0];
    const savep = fshape.parent as GroupShape;
    const saveidx = savep.indexOfChild(shapes[0]);
    const gshape = newGroupShape('tool');
    const boundsArr = shapes.map((s) => {
        const box = s.boundingBox()
        const p = s.parent!;
        const m = p.matrix2Root();
        const lt = m.computeCoord(box.x, box.y);
        const rb = m.computeCoord(box.x + box.width, box.y + box.height);
        return { x: lt.x, y: lt.y, width: rb.x - lt.x, height: rb.y - lt.y }
    })
    const firstXY = boundsArr[0];
    const bounds = { left: firstXY.x, top: firstXY.y, right: firstXY.x, bottom: firstXY.y };

    boundsArr.reduce((pre, cur) => {
        expandBounds(pre, cur.x, cur.y);
        expandBounds(pre, cur.x + cur.width, cur.y + cur.height);
        return pre;
    }, bounds)
    const realXY = shapes.map((s) => s.frame2Root())
    const m = new Matrix(savep.matrix2Root().inverse)
    const xy = m.computeCoord(bounds.left, bounds.top)
    gshape.frame.width = bounds.right - bounds.left;
    gshape.frame.height = bounds.bottom - bounds.top;
    gshape.frame.x = xy.x;
    gshape.frame.y = xy.y;
    api.shapeInsert(page, savep, gshape, saveidx)
    for (let i = 0, len = shapes.length; i < len; i++) {
        const s = shapes[i];
        const p = s.parent as GroupShape;
        const idx = p.indexOfChild(s);
        api.shapeMove(page, p, idx, gshape, 0);
        if (p.childs.length <= 0) {
            delete_for_tool(page, p, api);
        }
    }
    for (let i = 0, len = shapes.length; i < len; i++) {
        const c = shapes[i]
        const r = realXY[i]
        const target = m.computeCoord(r.x, r.y);
        const cur = c.matrix2Parent().computeCoord(0, 0);
        api.shapeModifyX(page, c, c.frame.x + target.x - cur.x - xy.x);
        api.shapeModifyY(page, c, c.frame.y + target.y - cur.y - xy.y)
    }
    return gshape;
}
function de_tool(shape: GroupShape, page: Page, api: Api) {
    const savep = shape.parent as GroupShape;
    let idx = savep.indexOfChild(shape);
    const saveidx = idx;
    const m = shape.matrix2Parent();
    const childs: Shape[] = [];
    for (let i = 0, len = shape.childs.length; i < len; i++) {
        const c = shape.childs[i]
        const m1 = c.matrix2Parent();
        m1.multiAtLeft(m);
        const target = m1.computeCoord(0, 0);
        if (shape.rotation) {
            api.shapeModifyRotate(page, c, (c.rotation || 0) + shape.rotation)
        }
        if (shape.isFlippedHorizontal) {
            api.shapeModifyHFlip(page, c, !c.isFlippedHorizontal)
        }
        if (shape.isFlippedVertical) {
            api.shapeModifyVFlip(page, c, !c.isFlippedVertical)
        }
        const m2 = c.matrix2Parent();
        const cur = m2.computeCoord(0, 0);
        api.shapeModifyX(page, c, c.frame.x + target.x - cur.x);
        api.shapeModifyY(page, c, c.frame.y + target.y - cur.y);
    }
    for (let len = shape.childs.length; len > 0; len--) {
        const c = shape.childs[0];
        api.shapeMove(page, shape, 0, savep, idx)
        idx++;
        childs.push(c);
    }
    api.shapeDelete(page, savep, saveidx + childs.length)
    return childs;
}
function delete_for_tool(page: Page, shape: Shape, api: Api): boolean {
    const p = shape.parent as GroupShape;
    if (!p) return false;
    api.shapeDelete(page, p, p.indexOfChild(shape))
    if (p.childs.length <= 0 && p.type === ShapeType.Group) {
        delete_for_tool(page, p, api)
    }
    return true;
}
function expandBounds(bounds: { left: number, top: number, right: number, bottom: number }, x: number, y: number) {
    if (x < bounds.left) bounds.left = x;
    else if (x > bounds.right) bounds.right = x;
    if (y < bounds.top) bounds.top = y;
    else if (y > bounds.bottom) bounds.bottom = y;
}
