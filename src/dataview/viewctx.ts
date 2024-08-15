
import { Shape, ShapeType, SymbolShape } from "../data/shape";
import { SymbolRefShape } from "../data/classes";
import { EventEmitter } from "../basic/event";
import { objectId } from "../basic/objectid";
import { Notifiable } from "../data/basic";


export type VarsContainer = (SymbolRefShape | SymbolShape)[];


export interface PropsType {
    data: Shape;
    scale?: { x: number, y: number };
    varsContainer?: VarsContainer;
    isVirtual?: boolean;
}

interface DataView extends Notifiable {
    // id: string;
    layout(props?: PropsType): void;
    render(): number;
    parent?: DataView;
    updateFrames(): boolean;
    emit(name: string, ...args: any[]): void;
}

export interface ViewType {
    new(ctx: DViewCtx, props: PropsType, shapes?: Shape[]): DataView;
}

export function updateViewsFrame(updates: { data: DataView }[]) {
    if (updates.length === 0) return;
    type Node = { view: DataView, childs: Node[], needupdate: boolean, parent: Node | undefined, visited: boolean }
    const updatetree: Map<number, Node> = new Map();
    updates.forEach((_s) => {
        const s = _s.data;
        let n: Node | undefined = updatetree.get(objectId(s));
        if (n) {
            n.needupdate = true;
            return;
        }
        n = { view: s, childs: [], needupdate: true, parent: undefined, visited: false }
        updatetree.set(objectId(s), n);

        let cn = n;
        let p = s.parent;
        while (p) {
            let pn: Node | undefined = updatetree.get(objectId(p));
            if (!pn) {
                pn = { view: p, childs: [], needupdate: false, parent: undefined, visited: false }
                updatetree.set(objectId(p), pn);
            }

            pn.childs.push(cn);
            cn.parent = pn;

            cn = pn;
            p = p.parent;
        }
    });


    const afterTravel = (root: Node, traver: (n: Node) => void) => {
        const nodes = [root];
        let n = nodes[nodes.length - 1];
        while (n) {
            if (n.visited || n.childs.length === 0) {
                traver(n);
                nodes.pop();
            } else {
                n.visited = true;
                nodes.push(...n.childs);
            }
            n = nodes[nodes.length - 1];
        }
    }

    const roots: Node[] = [];
    for (let n of updatetree.values()) {
        if (!n.parent) roots.push(n);
    }

    for (let i = 0, len = roots.length; i < len; ++i) {
        const root = roots[i];
        // 从下往上更新
        afterTravel(root, (next: Node) => {
            const needupdate = next.needupdate;
            const changed = needupdate && next.view.updateFrames();
            if (changed && next.parent) next.parent.needupdate = true;
        })
    }
}


export class DViewCtx extends EventEmitter {

    static FRAME_TIME = 40; // 25帧

    comsMap: Map<ShapeType, ViewType> = new Map();
    // 选区
    // 缩放监听

    // 先更新数据再绘制
    protected relayoutset: Map<number, DataView> = new Map();
    // 要由上往下更新
    protected dirtyset: Map<number, DataView> = new Map();

    private needNotify: Map<number, DataView> = new Map();

    setReLayout(v: DataView) {
        this.relayoutset.set(objectId(v), v);
        this.continueLoop();
    }
    setDirty(v: DataView) {
        this.dirtyset.set(objectId(v), v);
        this.continueLoop();
    }

    addNotifyLayout(v: DataView) {
        this.needNotify.set(objectId(v), v);
    }

    removeReLayout(v: DataView) {
        const vid = objectId(v);
        // const ov = this.relayoutset.get(vid);
        // if (ov !== v) {
        //     return false;
        // }
        return this.relayoutset.delete(vid);
    }
    removeDirty(v: DataView) {
        const vid = objectId(v);
        // const ov = this.dirtyset.get(vid);
        // if (ov !== v) {
        //     return false;
        // }
        return this.dirtyset.delete(vid);
    }

    protected focusshape: DataView | undefined;

    protected onIdle(): boolean {
        return false;
    }

    layoutAll() {
        // 先按层级排序，由高向下更新
        const update: { data: DataView, level: number }[] = [];
        const level = (v: DataView) => {
            let l = 0;
            let p = v.parent;
            while (p) {
                l++;
                p = p.parent;
            }
            return l;
        }

        this.relayoutset.forEach((v, k) => {
            update.push({ data: v, level: level(v) });
        });

        // 小的在前
        update.sort((a, b) => {
            return a.level - b.level;
        });

        for (let i = 0; i < update.length; i++) {
            const d = update[i].data;
            if (this.relayoutset.has(objectId(d))) { // 再次判断，可能已经更新过了
                d.layout();
            }
        }

        // update frames
        updateViewsFrame(update);
    }

    private updateFocus() {
        if (!this.focusshape) return false;

        const startTime = Date.now();
        const focusdepends: number[] = [];
        let p: DataView | undefined = this.focusshape;
        while (p) {
            focusdepends.push(objectId(p));
            p = p.parent;
        }

        const needupdate: DataView[] = [];
        this.relayoutset.forEach((v, k) => {
            needupdate.push(v);
        });
        // 由高向下更新
        for (let i = focusdepends.length - 1; i >= 0; i--) {
            const d = this.relayoutset.get(focusdepends[i]);
            if (d) d.layout();
        }

        const updated: { data: DataView }[] = [];
        for (let i = 0, len = needupdate.length; i < len; ++i) {
            if (!this.relayoutset.get(objectId(needupdate[i]))) {
                updated.push({ data: needupdate[i] })
            }
        }
        // update frames
        updateViewsFrame(updated);

        for (let i = focusdepends.length - 1; i >= 0; i--) {
            const d = this.dirtyset.get(focusdepends[i]);
            if (d) d.render();
        }

        this.notifyLayout();

        // check time
        const expendsTime = Date.now() - startTime;
        return (expendsTime > DViewCtx.FRAME_TIME);
    }

    private notifyLayout() {
        this.needNotify.forEach((v) => {
            v.notify('layout');
            v.emit('layout');
        });
        this.needNotify.clear();
    }

    // todo idle
    // todo selection
    // protected idlecallbacks: Array<() => boolean> = [];
    // onIdle(cb: () => boolean) {
    //     this.idlecallbacks.push(cb);
    // }
    /**
     * return: if continue
     */
    protected aloop(): boolean {

        const hasUpdate = this.relayoutset.size > 0 || this.dirtyset.size > 0;

        // 优先更新选中对象
        if (this.updateFocus()) {
            return true;
        }

        // update
        // render
        this.layoutAll();

        const emitStartTime = Date.now();
        // 排版完成，emit nextTick
        this.emit("nextTick");
        if (Date.now() - emitStartTime > DViewCtx.FRAME_TIME) {
            console.error("!!! nextTick too long !!!");
        }
        // { // check time
        //     const expendsTime = Date.now() - startTime;
        //     if (expendsTime > DViewCtx.FRAME_TIME) {
        //         return true;
        //     }
        // }

        // 渲染
        this.dirtyset.forEach((v, k) => {
            v.render();
        });

        this.notifyLayout();

        if (this.relayoutset.size || this.dirtyset.size) {
            console.log("loop not empty ", this.relayoutset.size, this.dirtyset.size);
        }

        if (hasUpdate || this.relayoutset.size > 0 || this.dirtyset.size > 0) {
            return true;
        }

        return this.onIdle();
    }

    continueLoop() {
        if (this.__looping && !this.__inframe && this.requestAnimationFrame) this._startLoop(this.requestAnimationFrame);
    }

    private _startLoop(requestAnimationFrame: (run: () => void) => void) {
        const run = () => {
            this.__inframe = false;
            if (!this.__looping) return;
            if (this.aloop()) {
                requestAnimationFrame(run);
                this.__inframe = true;
            }
        }
        requestAnimationFrame(run);
        this.__inframe = true;
    }

    private __looping: boolean = false;
    private __inframe: boolean = false;
    private requestAnimationFrame?: (run: () => void) => void;

    loop(requestAnimationFrame: (run: () => void) => void) {
        this.requestAnimationFrame = requestAnimationFrame;
        if (this.__looping) return;
        this.__looping = true;
        this._startLoop(requestAnimationFrame);
    }

    stopLoop() {
        this.__looping = false;
    }
}