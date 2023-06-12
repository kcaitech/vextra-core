import { translateTo, translate, expandTo, adjustLT2, adjustRT2, adjustRB2, adjustLB2 } from "./frame";
import { Shape, GroupShape } from "../data/shape";
import { exportShape, updateFrame } from "./utils";
import { ShapeType } from "../data/typesdefine";
import { ShapeFrame } from "../data/shape";
import { newArtboard, newLineShape, newOvalShape, newRectShape, newTextShape } from "./creator";
import { Page } from "../data/page";
import { ShapeCmdGroup } from "../coop/data/classes";
import { SHAPE_ATTR_ID } from "./consts";
import { CoopRepository } from "./cooprepo";

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
    migrate: (targetParent: Shape) => void;
    trans: (start: PageXY, end: PageXY) => void;
    transByWheel: (dx: number, dy: number) => void;
    close: () => undefined;
}
export interface AsyncBaseAction {
    execute: (type: CtrlElementType, start: PageXY, end: PageXY, deg?: number, actionType?: 'rotate' | 'scale') => void;
    close: () => undefined;
    execute4multi: (shapes: Shape[], type: CtrlElementType, oldControllerFrame: ControllerFrame, newControllerFrame: ControllerFrame) => void;
}
export interface AsyncLineAction {
    execute: (type: CtrlElementType, end: PageXY, deg: number, actionType?: 'rotate' | 'scale') => void;
    close: () => undefined;
}
export interface AsyncCreator {
    init: (page: Page, parent: GroupShape, type: ShapeType, name: string, frame: ShapeFrame) => Shape | undefined;
    setFrame: (point: PageXY) => void;
    setFrameByWheel: (point: PageXY) => void;
    close: () => undefined;
}

export enum Status {
    Pending = 'pending',
    Fulfilled = 'fulfilled'
}
// 单个图形处理(普通对象)
function singleHdl(shape: Shape, type: CtrlElementType, start: PageXY, end: PageXY, deg?: number, actionType?: 'rotate' | 'scale') {
    if (actionType === 'rotate') {
        const newDeg = (shape.rotation || 0) + (deg || 0);
        shape.rotate(newDeg);
    } else {
        if (type === CtrlElementType.RectLT) {
            adjustLT2(shape, end.x, end.y);
        } else if (type === CtrlElementType.RectRT) {
            adjustRT2(shape, end.x, end.y);
        } else if (type === CtrlElementType.RectRB) {
            adjustRB2(shape, end.x, end.y);
        } else if (type === CtrlElementType.RectLB) {
            adjustLB2(shape, end.x, end.y);
        } else if (type === CtrlElementType.RectTop) {
            const m = shape.matrix2Page();
            const p1 = m.inverseCoord(start.x, start.y);
            const p2 = m.inverseCoord(end.x, end.y);
            const dy = p2.y - p1.y;
            const { x, y } = m.computeCoord(0, dy);
            adjustLT2(shape, x, y);
        } else if (type === CtrlElementType.RectRight) {
            const m = shape.matrix2Page();
            const p1 = m.inverseCoord(start.x, start.y);
            const p2 = m.inverseCoord(end.x, end.y);
            const dx = p2.x - p1.x;
            const { x, y } = m.computeCoord(shape.frame.width + dx, 0);
            adjustRT2(shape, x, y);
        } else if (type === CtrlElementType.RectBottom) {
            const m = shape.matrix2Page();
            const p1 = m.inverseCoord(start.x, start.y);
            const p2 = m.inverseCoord(end.x, end.y);
            const dy = p2.y - p1.y;
            const { x, y } = m.computeCoord(shape.frame.width, shape.frame.height + dy);
            adjustRB2(shape, x, y);
        } else if (type === CtrlElementType.RectLeft) {
            const m = shape.matrix2Page();
            const p1 = m.inverseCoord(start.x, start.y);
            const p2 = m.inverseCoord(end.x, end.y);
            const dx = p2.x - p1.x;
            const { x, y } = m.computeCoord(dx, shape.frame.height);
            adjustLB2(shape, x, y);
        }
    }
}
// 单个图形处理(编组对象)
function singleHdl4Group(shape: Shape, type: CtrlElementType, start: PageXY, end: PageXY, deg?: number, actionType?: 'rotate' | 'scale') {
}

// 处理异步编辑
export class Controller {
    private __repo: CoopRepository;
    constructor(repo: CoopRepository) {
        this.__repo = repo;
    }
    create(type: ShapeType, name: string, frame: ShapeFrame): Shape {
        switch (type) {
            case ShapeType.Artboard: return newArtboard(name, frame);
            case ShapeType.Rectangle: return newRectShape(name, frame);
            case ShapeType.Oval: return newOvalShape(name, frame);
            case ShapeType.Line: return newLineShape(name, frame);
            case ShapeType.Text: return newTextShape(name, frame);
            default: return newRectShape(name, frame);
        }
    }
    // 创建自定义frame的图形
    public asyncCreator(mousedownOnPage: PageXY): AsyncCreator {
        if (this.__repo.transactCtx.transact) {
            this.__repo.rollback();
        }
        const anchor: PageXY = mousedownOnPage;
        this.__repo.start("createshape", {});
        let status: Status = Status.Pending;
        let newShape: Shape | undefined;
        let saveParent: GroupShape | undefined;
        const init = (page: Page, parent: GroupShape, type: ShapeType, name: string, frame: ShapeFrame): Shape | undefined => {
            status = Status.Pending;
            saveParent = parent;
            const shape = this.create(type, name, frame);
            const xy = parent.frame2Page();
            shape.frame.x -= xy.x;
            shape.frame.y -= xy.y;
            parent.addChildAt(shape);
            page.onAddShape(shape);
            updateFrame(shape);
            newShape = parent.childs.at(-1);
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
            return newShape
        }
        const setFrame = (point: PageXY) => {
            if (!newShape) return;
            status = Status.Pending;
            if (newShape.type === ShapeType.Line) {
                const { x: sx, y: sy } = anchor;
                const { x: px, y: py } = point;
                if (newShape.isFlippedHorizontal) {
                    if ((px - sx) > 0) {
                        newShape.flipHorizontal();
                    }
                } else {
                    if ((px - sx) < 0) {
                        newShape.flipHorizontal()
                    }
                }
                if (newShape.isFlippedVertical) {
                    if ((py - sy) > 0) {
                        newShape.flipVertical();
                    }
                } else {
                    if ((py - sy) < 0) {
                        newShape.flipVertical();
                    }
                }
                const height = Math.abs(py - sy);
                const width = Math.abs(px - sx);
                expandTo(newShape, width, height);
            } else {
                const { x: sx, y: sy } = anchor;
                const { x: px, y: py } = point;
                const x1 = { x: Math.min(sx, px), y: Math.min(sy, py) };
                const x2 = { x: Math.max(sx, px), y: Math.max(sy, py) };
                const height = x2.y - x1.y;
                const width = x2.x - x1.x;
                expandTo(newShape, width, height);
                translateTo(newShape, x1.x, x1.y);
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const setFrameByWheel = (point: PageXY) => {
            if (!newShape) return;
            status = Status.Pending;
            const { x: sx, y: sy } = anchor;
            const { x: px, y: py } = point;
            const x1 = { x: Math.min(sx, px), y: Math.min(sy, py) };
            const x2 = { x: Math.max(sx, px), y: Math.max(sy, py) };
            const height = x2.y - x1.y;
            const width = x2.x - x1.x;
            expandTo(newShape, width, height);
            translateTo(newShape, x1.x, x1.y);
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }

        const close = () => {
            if (status == Status.Fulfilled && newShape && saveParent) {
                const shapeJson = exportShape(newShape);
                const page = saveParent.getPage();
                if (!shapeJson || !page) {
                    this.__repo.rollback(); // 出错了！
                }
                else {
                    const cmd = ShapeCmdGroup.Make(page.id);
                    cmd.addInsert(saveParent.id, newShape.id, saveParent.childs.length - 1, shapeJson);
                    const frame = newShape.frame2Page();
                    cmd.addModify(newShape.id, SHAPE_ATTR_ID.position, { x: frame.x, y: frame.y }, { x: frame.x, y: frame.y })
                    this.__repo.commit(cmd);
                }
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { init, setFrame, setFrameByWheel, close }
    }
    // 图形编辑，适用于基础控点、控边的异步编辑
    public asyncRectEditor(shapes: Shape[]): AsyncBaseAction {
        if (this.__repo.transactCtx.transact) {
            this.__repo.rollback();
        }

        // 保存可能修改到的属性
        const saveDatas: {
            shape: Shape,
            x: number,
            y: number,
            w: number,
            h: number,
            rotate: number | undefined,
            hflip: boolean | undefined,
            vflip: boolean | undefined
        }[] = shapes.map((shape) => {
            const frame = shape.frame2Page();
            const frame2 = shape.frame;
            return {
                shape,
                x: frame.x,
                y: frame.y,
                w: frame2.width,
                h: frame2.height,
                rotate: shape.rotation,
                hflip: shape.isFlippedHorizontal,
                vflip: shape.isFlippedVertical
            }
        })

        this.__repo.start("action", {});
        let status: Status = Status.Pending;
        const execute = (type: CtrlElementType, start: PageXY, end: PageXY, deg?: number, actionType?: 'rotate' | 'scale') => {
            status = Status.Pending;
            const len = shapes.length;
            if (len === 1) {
                const item = shapes[0];
                if (item.type === ShapeType.Group) {
                    singleHdl4Group(item, type, start, end, deg, actionType); // 编组对象处理
                } else {
                    singleHdl(item, type, start, end, deg, actionType); // 普通对象处理
                }
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const execute4multi = (shapes: Shape[], type: CtrlElementType, oldControllerFrame: ControllerFrame, newControllerFrame: ControllerFrame) => {
            status = Status.Pending;
            for (let i = 0, len = shapes.length; i < len; i++) {
                const shape = shapes[i];
                const { x, y, width, height } = shape.frame2Page();
                const { x: ox, y: oy, width: ow, height: oh } = oldControllerFrame;
                const { x: nx, y: ny, width: nw, height: nh } = newControllerFrame;
                const ratio = { x: nw / ow, y: nh / oh };
                expandTo(shape, width * ratio.x, height * ratio.y);
                translateTo(shape, nx + (x - ox) * ratio.x, ny + (y - oy) * ratio.y);
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const close = () => {
            if (status == Status.Fulfilled && saveDatas.length > 0) {
                const page = saveDatas[0].shape.getPage();
                const cmd = ShapeCmdGroup.Make(page?.id || '');
                saveDatas.forEach((cur) => {
                    const frame2 = cur.shape.frame;
                    if (frame2.width !== cur.w || frame2.height !== cur.h) {
                        cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.size, { w: frame2.width, h: frame2.height }, { w: cur.w, h: cur.h })
                    }
                    if (cur.shape.isFlippedHorizontal !== cur.hflip) {
                        cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.hflip, cur.shape.isFlippedHorizontal, cur.hflip)
                    }
                    if (cur.shape.isFlippedVertical !== cur.vflip) {
                        cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.vflip, cur.shape.isFlippedVertical, cur.vflip)
                    }
                    if (cur.shape.rotation !== cur.rotate) {
                        cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.rotate, cur.shape.rotation, cur.rotate)
                    }
                    const frame = cur.shape.frame2Page();
                    if (frame.x !== cur.x || frame.y !== cur.y) {
                        cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.position, { x: frame.x, y: frame.y }, { x: cur.x, y: cur.y })
                    }
                });

                if (!page) {
                    this.__repo.rollback();
                }
                else {
                    this.__repo.commit(cmd);
                }
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { execute, close, execute4multi }
    }
    public asyncLineEditor(shape: Shape): AsyncLineAction {
        if (this.__repo.transactCtx.transact) {
            this.__repo.rollback();
        }
        // 保存可能修改到的属性
        const saveDatas: {
            shape: Shape,
            x: number,
            y: number,
            w: number,
            h: number,
            rotate: number | undefined,
            hflip: boolean | undefined,
            vflip: boolean | undefined
        }[] = [shape].map((shape) => {
            const frame = shape.frame2Page();
            const frame2 = shape.frame;
            return {
                shape,
                x: frame.x,
                y: frame.y,
                w: frame2.width,
                h: frame2.height,
                rotate: shape.rotation,
                hflip: shape.isFlippedHorizontal,
                vflip: shape.isFlippedVertical
            }
        })
        this.__repo.start("action", {});
        let status: Status = Status.Pending;
        const execute = (type: CtrlElementType, end: PageXY, deg: number, actionType?: 'rotate' | 'scale') => {
            status = Status.Pending;
            if (shape.isLocked) return;
            if (actionType === 'rotate') {
                const newDeg = (shape.rotation || 0) + deg;
                shape.rotate(newDeg);
            } else {
                if (type === CtrlElementType.LineStart) {
                    adjustLT2(shape, end.x, end.y);
                } else if (type === CtrlElementType.LineEnd) {
                    adjustRB2(shape, end.x, end.y);
                }
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const close = () => {
            if (status == Status.Fulfilled && saveDatas.length > 0) {
                const page = saveDatas[0].shape.getPage();
                const cmd = ShapeCmdGroup.Make(page?.id || '');
                saveDatas.forEach((cur) => {
                    const frame2 = cur.shape.frame;
                    if (frame2.width !== cur.w || frame2.height !== cur.h) {
                        cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.size, { w: frame2.width, h: frame2.height }, { w: cur.w, h: cur.h })
                    }
                    if (cur.shape.isFlippedHorizontal !== cur.hflip) {
                        cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.hflip, cur.shape.isFlippedHorizontal, cur.hflip)
                    }
                    if (cur.shape.isFlippedVertical !== cur.vflip) {
                        cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.vflip, cur.shape.isFlippedVertical, cur.vflip)
                    }
                    if (cur.shape.rotation !== cur.rotate) {
                        cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.rotate, cur.shape.rotation, cur.rotate)
                    }
                    const frame = cur.shape.frame2Page();
                    if (frame.x !== cur.x || frame.y !== cur.y) {
                        cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.position, { x: frame.x, y: frame.y }, { x: cur.x, y: cur.y })
                    }
                });
                if (!page) {
                    this.__repo.rollback();
                }
                else {
                    this.__repo.commit(cmd);
                }
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { execute, close }
    }
    // 图形位置移动
    public asyncTransfer(shapes: Shape[]): AsyncTransfer {
        if (this.__repo.transactCtx.transact) { // ???
            this.__repo.rollback();
        }

        // 保存可能修改到的属性
        const saveDatas: {
            shape: Shape,
            x: number,
            y: number,
            parent: Shape | undefined,
            idx: number
        }[] = shapes.map((shape) => {
            const frame = shape.frame2Page();
            return {
                shape,
                x: frame.x,
                y: frame.y,
                parent: shape.parent,
                idx: (() => {
                    if (shape.parent) return (shape.parent as GroupShape).childs.findIndex((v) => v.id === shape.id)
                    return -1;
                })(),
            }
        })

        this.__repo.start("transfer", {});
        // const shapes: Shape[] = s;
        let status: Status = Status.Pending;
        const migrate = (targetParent: Shape) => {
            status = Status.Pending;
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const origin: GroupShape = shape.parent as GroupShape;
                origin.removeChild(shape);
                const { x, y } = shape.frame2Page();
                targetParent.addChild(shape);
                translateTo(shape, x, y);
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const trans = (start: PageXY, end: PageXY) => {
            status = Status.Pending;
            for (let i = 0; i < shapes.length; i++) {
                if (shapes[i].isLocked) continue; // 🔒住不让动
                translate(shapes[i], end.x - start.x, end.y - start.y);
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const transByWheel = (dx: number, dy: number) => {
            status = Status.Pending;
            for (let i = 0; i < shapes.length; i++) {
                if (shapes[i].isLocked) continue; // 🔒住不让动
                translate(shapes[i], dx, dy);
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const close = () => {
            if (status == Status.Fulfilled && saveDatas.length > 0) {
                const page = saveDatas[0].shape.getPage();
                if (!page) {
                    this.__repo.rollback();
                }
                else {
                    const cmd = ShapeCmdGroup.Make(page.id);
                    saveDatas.forEach((cur) => {
                        if (cur.parent && cur.shape.parent && cur.parent.id !== cur.shape.parent.id) {
                            const page = cur.shape.getPage();
                            cmd.addMove(
                                cur.parent.id,
                                cur.shape.parent.id,
                                cur.idx,
                                (cur.shape.parent as GroupShape).childs.findIndex((v) => v.id === cur.shape.id),
                                cur.shape.id)
                        }
                        const frame = cur.shape.frame2Page();
                        if (frame.x !== cur.x || frame.y !== cur.y) {
                            const page = cur.shape.getPage();
                            cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.position, { x: frame.x, y: frame.y }, { x: cur.x, y: cur.y })
                        }
                    })

                    this.__repo.commit(cmd);
                }

            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { migrate, trans, close, transByWheel }
    }
}