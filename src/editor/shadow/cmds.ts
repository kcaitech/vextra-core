// 在事务undo/redo时，需要同步通知左侧对象树对应的操作

import { IPageShadow } from "@/data/ishadow";
import { GroupShape, Shape } from "@/data/shape";
import { ICMD } from "@/data/transact";

export class ShadowInsertCMD implements ICMD {
    private __shadow: IPageShadow;
    private __parent: GroupShape;
    private __idx: number;
    private __shape: Shape;
    constructor(shadow: IPageShadow, parent: GroupShape, index: number, shape: Shape) {
        this.__shadow = shadow;
        this.__parent = parent;
        this.__idx = index;
        this.__shape = shape;
    }
    exec(): void {
        this.__shadow.insert(this.__parent, this.__idx, this.__shape);
    }
    unexec(): void {
        this.__shadow.delete(this.__shape);
    }
}
export class ShadowDelCMD implements ICMD {
    private __shadow: IPageShadow;
    private __parent: GroupShape;
    private __idx: number;
    private __shape: Shape;
    constructor(shadow: IPageShadow, shape: Shape, shapeParent: GroupShape, idx: number) {
        this.__shadow = shadow;
        this.__parent = shapeParent;
        this.__idx = idx; // this.__parent.indexOfChild(shape);
        this.__shape = shape;
    }
    exec(): void {
        this.__shadow.delete(this.__shape);
    }
    unexec(): void {
        this.__shadow.insert(this.__parent, this.__idx, this.__shape);
    }
}
export class ShadowModifyCMD implements ICMD {
    private __shadow: IPageShadow;
    private __parent: GroupShape;
    private __idx: number;
    private __shape: Shape;
    private __taridx: number;
    private __target: GroupShape;
    constructor(shadow: IPageShadow, shape: Shape, shapeParent: GroupShape, idx: number, target: GroupShape, index: number) {
        this.__shadow = shadow;
        this.__parent = shapeParent;
        this.__idx = idx; //this.__parent.indexOfChild(shape);
        this.__shape = shape;
        this.__taridx = index;
        this.__target = target;
    }
    exec(): void {
        this.__shadow.move(this.__shape, this.__target, this.__taridx);
    }
    unexec(): void {
        this.__shadow.move(this.__shape, this.__parent, this.__idx);
    }
}
