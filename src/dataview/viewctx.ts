import { RenderTransform } from "../render";
import { Shape, ShapeType, SymbolShape } from "../data/shape";
import { SymbolRefShape } from "../data/classes";
import { EventEmitter } from "../basic/event";


export type VarsContainer = (SymbolRefShape | SymbolShape)[];


export interface PropsType {
    data: Shape;
    transx?: RenderTransform;
    varsContainer?: VarsContainer;
    isVirtual?: boolean;
}

interface DataView {
    id: string;
    layout(props?: PropsType): void;
    render(): number;
    parent?: DataView;
}

export interface ViewType {
    new(ctx: DViewCtx, props: PropsType): DataView;
}

export class DViewCtx extends EventEmitter {

    static FRAME_TIME = 40; // 25帧

    comsMap: Map<ShapeType, ViewType> = new Map();
    // 选区
    // 缩放监听

    // 先更新数据再绘制
    protected relayoutset: Map<string, DataView> = new Map();
    // 要由上往下更新
    protected dirtyset: Map<string, DataView> = new Map();

    setReLayout(v: DataView) {
        this.relayoutset.set(v.id, v);
        this._continueLoop();
    }
    setDirty(v: DataView) {
        this.dirtyset.set(v.id, v);
        this._continueLoop();
    }

    removeReLayout(v: DataView) {
        const vid = v.id;
        const ov = this.relayoutset.get(vid);
        if (ov !== v) {
            return false;
        }
        return this.relayoutset.delete(vid);
    }
    removeDirty(v: DataView) {
        const vid = v.id;
        const ov = this.dirtyset.get(vid);
        if (ov !== v) {
            return false;
        }
        return this.dirtyset.delete(vid);
    }

    protected focusshape: Shape | undefined;

    protected onIdle(): boolean {
        return false;
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
        const startTime = Date.now();

        // 优先更新选中对象
        if (this.focusshape) {

            const focusdepends: string[] = [];
            let p: Shape | undefined = this.focusshape;
            while (p) {
                focusdepends.push(p.id);
                p = p.parent;
            }

            // 由高向下更新
            for (let i = focusdepends.length - 1; i >= 0; i--) {
                const d = this.relayoutset.get(focusdepends[i]);
                if (d) d.layout();
            }

            for (let i = focusdepends.length - 1; i >= 0; i--) {
                const d = this.dirtyset.get(focusdepends[i]);
                if (d) d.render();
            }

            // check time
            const expendsTime = Date.now() - startTime;
            if (expendsTime > DViewCtx.FRAME_TIME) {
                return true;
            }
        }

        // update
        // render
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
            update.push({
                data: v,
                level: level(v)
            });
        });

        // 小的在前
        update.sort((a, b) => {
            return a.level - b.level;
        });

        for (let i = 0; i < update.length; i++) {
            const d = update[i].data;
            if (this.relayoutset.has(d.id)) { // 再次判断，可能已经更新过了
                d.layout();
            }
        }

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

        if (this.relayoutset.size || this.dirtyset.size) {
            console.log("loop not empty ", this.relayoutset.size, this.dirtyset.size);
        }

        if (hasUpdate || this.relayoutset.size > 0 || this.dirtyset.size > 0) {
            return true;
        }

        return this.onIdle();
    }

    private _continueLoop() {
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