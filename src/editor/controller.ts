import { translateTo, translate, expandTo, adjustLT2, adjustRT2, adjustRB2, adjustLB2, erScaleByT, erScaleByR, erScaleByB, erScaleByL, scaleByT, scaleByR, scaleByB, scaleByL } from "./frame";
import { Shape, GroupShape, PathShape } from "../data/shape";
import { getFormatFromBase64 } from "../basic/utils";
import { ShapeType } from "../data/typesdefine";
import { ShapeFrame } from "../data/shape";
import { newArtboard, newImageShape, newLineShape, newOvalShape, newRectShape, newTable, newTextShape } from "./creator";
import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
import { v4 } from "uuid";
import { Document } from "../data/document";
import { ResourceMgr } from "../data/basic";
import { Api } from "./command/recordapi";
import { Matrix } from "../basic/matrix";
import { Artboard } from "../data/artboard";
import { Color } from "../data/style";
import { afterModifyGroupShapeWH } from "./frame";
interface PageXY { // 页面坐标系的xy
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
export interface AsyncCreator {
    init: (page: Page, parent: GroupShape, type: ShapeType, name: string, frame: ShapeFrame) => Shape | undefined;
    init_media: (page: Page, parent: GroupShape, name: string, frame: ShapeFrame, media: { buff: Uint8Array, base64: string }) => Shape | undefined;
    init_text: (page: Page, parent: GroupShape, frame: ShapeFrame, content: string) => Shape | undefined;
    setFrame: (point: PageXY) => void;
    setFrameByWheel: (point: PageXY) => void;
    collect: (page: Page, shapes: Shape[], target: Artboard) => void;
    close: () => undefined;
}
export interface AsyncBaseAction {
    executeRotate: (deg: number) => void;
    executeScale: (type: CtrlElementType, start: PageXY, end: PageXY) => void;
    executeErScale: (type: CtrlElementType, scale: number) => void
    close: () => undefined;
}
export interface AsyncMultiAction {
    executeScale: (origin1: { x: number, y: number }, origin2: { x: number, y: number }, sx: number, sy: number) => void;
    executeRotate: (deg: number, m: Matrix) => void;
    close: () => void;
}
export interface AsyncLineAction {
    execute: (type: CtrlElementType, end: PageXY, deg: number, actionType?: 'rotate' | 'scale') => void;
    close: () => undefined;
}

export interface AsyncTransfer {
    migrate: (targetParent: GroupShape) => void;
    trans: (start: PageXY, end: PageXY) => void;
    stick: (dx: number, dy: number) => void;
    transByWheel: (dx: number, dy: number) => void;
    close: () => undefined;
}

export enum Status {
    Pending = 'pending',
    Fulfilled = 'fulfilled'
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
                const shape = newTextShape(name);
                shape.frame = frame;
                return shape;
            }
            case ShapeType.Image: return newImageShape(name, frame, ref, mediasMgr);
            case ShapeType.Table: return newTable(name, frame, 3, 3);
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
            api.shapeInsert(page, parent, shape, parent.childs.length);
            newShape = parent.childs.at(-1); // 需要把proxy代理之后的shape返回，否则无法触发notify
            if (newShape?.type === ShapeType.Artboard) api.setFillColor(page, newShape, 0, new Color(0, 0, 0, 0));
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
                const shape = newTextShape(name);
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
        const collect = (page: Page, shapes: Shape[], target: Artboard) => { // 容器收束
            status = Status.Pending;
            if (shapes.length) {
                for (let i = 0; i < shapes.length; i++) {
                    const s = shapes[i];
                    const p = s.parent as GroupShape;
                    const idx = p.indexOfChild(s);
                    api.shapeMove(page, p, idx, target, 0);
                    if (p.childs.length <= 0) {
                        deleteEmptyGroupShape(page, s, api);
                    }
                }
                const realXY = shapes.map((s) => s.frame2Root());
                const t_xy = target.frame;
                const savep = shapes[0].parent as GroupShape;
                const m = new Matrix(savep.matrix2Root().inverse);
                for (let i = 0; i < shapes.length; i++) {
                    const c = shapes[i];
                    const r = realXY[i]
                    const target = m.computeCoord(r.x, r.y);
                    const cur = c.matrix2Parent().computeCoord(0, 0);
                    api.shapeModifyX(page, c, c.frame.x + target.x - cur.x - t_xy.x);
                    api.shapeModifyY(page, c, c.frame.y + target.y - cur.y - t_xy.y);
                }
            }
            api.setFillColor(page, target, 0, new Color(1, 255, 255, 255));
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const close = () => {
            if (status == Status.Fulfilled && newShape && this.__repo.isNeedCommit()) {
                if (newShape.type === ShapeType.Artboard) {
                    api.setFillColor(savepage!, newShape, 0, new Color(1, 255, 255, 255));
                }
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { init, init_media, init_text, setFrame, setFrameByWheel, collect, close }
    }
    // 单个图形异步编辑
    public asyncRectEditor(shape: Shape, page: Page): AsyncBaseAction {
        const api = this.__repo.start("action", {});
        let status: Status = Status.Pending;
        const executeRotate = (deg: number) => {
            status = Status.Pending;
            const newDeg = (shape.rotation || 0) + (deg || 0);
            api.shapeModifyRotate(page, shape, newDeg);
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const executeScale = (type: CtrlElementType, start: PageXY, end: PageXY) => {
            status = Status.Pending;
            if (type === CtrlElementType.RectLT) {
                adjustLT2(api, page, shape, end.x, end.y);
            } else if (type === CtrlElementType.RectRT) {
                adjustRT2(api, page, shape, end.x, end.y);
            } else if (type === CtrlElementType.RectRB) {
                adjustRB2(api, page, shape, end.x, end.y);
            } else if (type === CtrlElementType.RectLB) {
                adjustLB2(api, page, shape, end.x, end.y);
            } else if (type === CtrlElementType.RectTop) {
                scaleByT(api, page, shape, end);
            } else if (type === CtrlElementType.RectRight) {
                scaleByR(api, page, shape, end);
            } else if (type === CtrlElementType.RectBottom) {
                scaleByB(api, page, shape, end);
            } else if (type === CtrlElementType.RectLeft) {
                scaleByL(api, page, shape, end);
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const executeErScale = (type: CtrlElementType, scale: number) => {
            status = Status.Pending;
            if (type === CtrlElementType.RectTop) {
                erScaleByT(api, page, shape, scale);
            } else if (type === CtrlElementType.RectRight) {
                erScaleByR(api, page, shape, scale);
            } else if (type === CtrlElementType.RectBottom) {
                erScaleByB(api, page, shape, scale);
            } else if (type === CtrlElementType.RectLeft) {
                erScaleByL(api, page, shape, scale);
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
        return { executeRotate, executeScale, executeErScale, close };
    }
    // 多对象的异步编辑
    public asyncMultiEditor(shapes: Shape[], page: Page): AsyncMultiAction {
        const api = this.__repo.start("action", {});
        let status: Status = Status.Pending;
        const pMap: Map<string, Matrix> = new Map();
        const executeScale = (origin1: PageXY, origin2: PageXY, sx: number, sy: number) => {
            status = Status.Pending;
            for (let i = 0; i < shapes.length; i++) {
                const s = shapes[i];
                const p = s.parent;
                if (!p) continue;
                if (!s.rotation) set_shape_frame(api, s, page, pMap, origin1, origin2, sx, sy);
                else if (s instanceof GroupShape && s.type === ShapeType.Group) adjust_group_rotate_frame(api, page, s, sx, sy);
                else if (s instanceof PathShape) {
                    adjust_pathshape_rotate_frame(api, page, s);
                    set_shape_frame(api, s, page, pMap, origin1, origin2, sx, sy);
                }
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const executeRotate = (deg: number, m: Matrix) => {
            status = Status.Pending;
            for (let i = 0; i < shapes.length; i++) {
                const s = shapes[i];
                const sp = s.parent;
                if (!sp) continue;
                // 计算左上角的目标位置
                const m2r = s.matrix2Root();
                m2r.multiAtLeft(m);
                const target_xy = m2r.computeCoord(0, 0); // 目标位置（root）
                // 计算集体旋转后的xy
                let np = new Matrix();
                const ex = pMap.get(sp.id);
                if (ex) np = ex;
                else {
                    np = new Matrix(sp.matrix2Root().inverse);
                    pMap.set(sp.id, np);
                }
                const sf_common = np.computeCoord(target_xy);
                // 计算自转后的xy
                const r = s.rotation || 0;
                let cr = deg;
                if (s.isFlippedHorizontal) cr = -cr;
                if (s.isFlippedVertical) cr = -cr;
                api.shapeModifyRotate(page, s, r + cr);
                const sf_self = s.matrix2Parent().computeCoord(0, 0);
                // 比较集体旋转与自转的xy偏差
                const delta = { x: sf_common.x - sf_self.x, y: sf_common.y - sf_self.y };
                api.shapeModifyX(page, s, s.frame.x + delta.x);
                api.shapeModifyY(page, s, s.frame.y + delta.y);
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) this.__repo.commit();
            else this.__repo.rollback();
        }
        return { executeScale, executeRotate, close };
    }
    public asyncLineEditor(shape: Shape): AsyncLineAction {
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
        const stick = (dx: number, dy: number) => {
            status = Status.Pending;
            for (let i = 0; i < shapes.length; i++) {
                if (shapes[i].isLocked) continue; // 🔒住不让动
                translate(api, page, shapes[i], dx, dy);
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
        return { migrate, trans, stick, close, transByWheel }
    }
}
function deleteEmptyGroupShape(page: Page, shape: Shape, api: Api): boolean {
    const p = shape.parent as GroupShape;
    if (!p) return false;
    api.shapeDelete(page, p, p.indexOfChild(shape))
    if (p.childs.length <= 0) {
        deleteEmptyGroupShape(page, p, api)
    }
    return true;
}
function adjust_group_rotate_frame(api: Api, page: Page, s: GroupShape, sx: number, sy: number) {
    const boundingBox = s.boundingBox();
    const matrix = s.matrix2Parent();
    for (let i = 0, len = s.childs.length; i < len; i++) { // 将旋转、翻转放入到子对象
        const cc = s.childs[i]
        const m1 = cc.matrix2Parent();
        m1.multiAtLeft(matrix);
        const target = m1.computeCoord(0, 0);

        if (s.rotation) api.shapeModifyRotate(page, cc, (cc.rotation || 0) + s.rotation);
        if (s.isFlippedHorizontal) api.shapeModifyHFlip(page, cc, !cc.isFlippedHorizontal);
        if (s.isFlippedVertical) api.shapeModifyVFlip(page, cc, !cc.isFlippedVertical);

        const m2 = cc.matrix2Parent();
        m2.trans(boundingBox.x, boundingBox.y);
        const cur = m2.computeCoord(0, 0);

        api.shapeModifyX(page, cc, cc.frame.x + target.x - cur.x);
        api.shapeModifyY(page, cc, cc.frame.y + target.y - cur.y);
    }

    if (s.rotation) api.shapeModifyRotate(page, s, 0);
    if (s.isFlippedHorizontal) api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal);
    if (s.isFlippedVertical) api.shapeModifyVFlip(page, s, !s.isFlippedVertical);

    api.shapeModifyX(page, s, boundingBox.x * sx);
    api.shapeModifyY(page, s, boundingBox.y * sy);
    const width = boundingBox.width * sx;
    const height = boundingBox.height * sy;
    api.shapeModifyWH(page, s, width, height);
    afterModifyGroupShapeWH(api, page, s, sx, sy);
}
function adjust_pathshape_rotate_frame(api: Api, page: Page, s: PathShape) {
    const matrix = s.matrix2Parent();
    const frame = s.frame;
    const boundingBox = s.boundingBox();
    matrix.preScale(frame.width, frame.height);
    if (s.rotation) api.shapeModifyRotate(page, s, 0);
    if (s.isFlippedHorizontal) api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal);
    if (s.isFlippedVertical) api.shapeModifyVFlip(page, s, !s.isFlippedVertical);
    api.shapeModifyX(page, s, boundingBox.x);
    api.shapeModifyY(page, s, boundingBox.y);
    api.shapeModifyWH(page, s, boundingBox.width, boundingBox.height);
    const matrix2 = s.matrix2Parent();
    matrix2.preScale(boundingBox.width, boundingBox.height);
    matrix.multiAtLeft(matrix2.inverse);
    const points = s.points;
    for (let i = 0, len = points.length; i < len; i++) {
        const p = points[i];
        if (p.hasCurveFrom) {
            const curveFrom = matrix.computeCoord(p.curveFrom);
            api.shapeModifyCurvFromPoint(page, s, i, curveFrom);
        }
        if (p.hasCurveTo) {
            const curveTo = matrix.computeCoord(p.curveTo);
            api.shapeModifyCurvToPoint(page, s, i, curveTo);
        }
        const point = matrix.computeCoord(p.point);
        api.shapeModifyCurvPoint(page, s, i, point);
    }
}
function set_shape_frame(api: Api, s: Shape, page: Page, pMap: Map<string, Matrix>, origin1: { x: number, y: number }, origin2: { x: number, y: number }, sx: number, sy: number) {
    const p = s.parent;
    if (!p) return;
    const m = s.matrix2Root();
    const lt = m.computeCoord(0, 0);
    const r_o_lt = { x: lt.x - origin1.x, y: lt.y - origin1.y };
    const target_xy = { x: origin2.x + sx * r_o_lt.x, y: origin2.y + sy * r_o_lt.y };
    let np = new Matrix();
    const ex = pMap.get(p.id);
    if (ex) np = ex;
    else {
        np = new Matrix(p.matrix2Root().inverse);
        pMap.set(p.id, np);
    }
    const xy = np.computeCoord(target_xy);
    if (sx < 0) {
        api.shapeModifyHFlip(page, s, !s.isFlippedHorizontal);
        sx = -sx;
    }
    if (sy < 0) {
        api.shapeModifyVFlip(page, s, !s.isFlippedVertical);
        sy = -sy;
    }
    if (s.isFlippedHorizontal || s.isFlippedVertical) {
        api.shapeModifyWH(page, s, s.frame.width * sx, s.frame.height * sy);
        const self = s.matrix2Parent().computeCoord(0, 0);
        const delta = { x: xy.x - self.x, y: xy.y - self.y };
        api.shapeModifyX(page, s, s.frame.x + delta.x);
        api.shapeModifyY(page, s, s.frame.y + delta.y);
    } else {
        api.shapeModifyX(page, s, xy.x);
        api.shapeModifyY(page, s, xy.y);
        api.shapeModifyWH(page, s, s.frame.width * sx, s.frame.height * sy);
    }
    if (s instanceof GroupShape && s.type === ShapeType.Group) afterModifyGroupShapeWH(api, page, s, sx, sy);
}