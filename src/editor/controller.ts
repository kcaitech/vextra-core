import { Repository } from "../data/transact";
import { translateTo, translate, expandTo, adjustLT2, adjustRT2, adjustRB2, adjustLB2 } from "./frame";
import { Shape, GroupShape } from "../data/shape";
import { updateFrame } from "./utils";
import { ShapeType } from "../data/typesdefine";
import { ShapeFrame } from "../data/shape";
import { newArtboard, newLineShape, newOvalShape, newRectShape } from "./creator";
import { Page } from "../data/page";

interface PageXY { // 页面坐标系的xy
    x: number,
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
}
export interface AsyncTransfer {
    migrate: (targetParent: Shape) => void;
    trans: (start: PageXY, end: PageXY) => void;
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
    setFrame: (point: PageXY) => void;
    setFrameByWheel: (point: PageXY) => void;
    close: () => undefined;
}

export enum Status {
    Pending = 'pending',
    Fulfilled = 'fulfilled'
}

// 处理异步编辑
export class Controller {
    private __repo: Repository;
    constructor(repo: Repository) {
        this.__repo = repo;
    }
    create(type: ShapeType, name: string, frame: ShapeFrame): Shape {
        switch (type) {
            case ShapeType.Artboard: return newArtboard(name, frame);
            case ShapeType.Rectangle: return newRectShape(name, frame);
            case ShapeType.Oval: return newOvalShape(name, frame);
            case ShapeType.Line: return newLineShape(name, frame);
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
        const init = (page: Page, parent: GroupShape, type: ShapeType, name: string, frame: ShapeFrame): Shape | undefined => {
            status = Status.Pending;
            const shape = this.create(type, name, frame);
            const xy = parent.frame2Page();
            shape.frame.x -= xy.x;
            shape.frame.y -= xy.y;
            parent.addChildAt(shape);
            if (shape.type == ShapeType.Artboard) {
                page.addArtboard(shape);
            }
            page.addShape(shape);
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
            if (status == Status.Fulfilled) {
                this.__repo.commit({});
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
        this.__repo.start("action", {});
        let status: Status = Status.Pending;
        const execute = (type: CtrlElementType, start: PageXY, end: PageXY, deg?: number, actionType?: 'rotate' | 'scale') => {
            status = Status.Pending;
            for (let i = 0; i < shapes.length; i++) {
                const item = shapes[i];
                if (item.isLocked) continue; // 🔒住不让动
                if (actionType === 'rotate') {
                    const newDeg = (item.rotation || 0) + (deg || 0);
                    item.rotate(newDeg);
                } else {
                    if (type === CtrlElementType.RectLT) {
                        adjustLT2(item, end.x, end.y);
                    } else if (type === CtrlElementType.RectRT) {
                        adjustRT2(item, end.x, end.y);
                    } else if (type === CtrlElementType.RectRB) {
                        adjustRB2(item, end.x, end.y);
                    } else if (type === CtrlElementType.RectLB) {
                        adjustLB2(item, end.x, end.y);
                    } else if (type === CtrlElementType.RectTop) {
                        const m = item.matrix2Page();
                        const p1 = m.inverseCoord(start.x, start.y);
                        const p2 = m.inverseCoord(end.x, end.y);
                        const dy = p2.y - p1.y;
                        const { x, y } = m.computeCoord(0, dy);
                        adjustLT2(item, x, y);
                    } else if (type === CtrlElementType.RectRight) {
                        const m = item.matrix2Page();
                        const p1 = m.inverseCoord(start.x, start.y);
                        const p2 = m.inverseCoord(end.x, end.y);
                        const dx = p2.x - p1.x;
                        const { x, y } = m.computeCoord(item.frame.width + dx, 0);
                        adjustRT2(item, x, y);
                    } else if (type === CtrlElementType.RectBottom) {
                        const m = item.matrix2Page();
                        const p1 = m.inverseCoord(start.x, start.y);
                        const p2 = m.inverseCoord(end.x, end.y);
                        const dy = p2.y - p1.y;
                        const { x, y } = m.computeCoord(item.frame.width, item.frame.height + dy);
                        adjustRB2(item, x, y);
                    } else if (type === CtrlElementType.RectLeft) {
                        const m = item.matrix2Page();
                        const p1 = m.inverseCoord(start.x, start.y);
                        const p2 = m.inverseCoord(end.x, end.y);
                        const dx = p2.x - p1.x;
                        const { x, y } = m.computeCoord(dx, item.frame.height);
                        adjustLB2(item, x, y);
                    }
                }
            }
            this.__repo.transactCtx.fireNotify();
            status = Status.Fulfilled;
        }
        const close = () => {
            if (status == Status.Fulfilled) {
                this.__repo.commit({});
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { execute, close }
    }
    public asyncLineEditor(shape: Shape): AsyncLineAction {
        if (this.__repo.transactCtx.transact) {
            this.__repo.rollback();
        }
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
            if (status == Status.Fulfilled) {
                this.__repo.commit({});
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { execute, close }
    }
    // 图形位置移动
    public asyncTransfer(s: Shape[]): AsyncTransfer {
        if (this.__repo.transactCtx.transact) {
            this.__repo.rollback();
        }
        this.__repo.start("transfer", {});
        const shapes: Shape[] = s;
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
        const close = () => {
            if (status == Status.Fulfilled) {
                this.__repo.commit({});
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { migrate, trans, close }
    }
}