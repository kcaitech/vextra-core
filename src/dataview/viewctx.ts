import { RenderTransform } from "../render";
import { Shape, ShapeType, SymbolShape } from "../data/shape";
import { SymbolRefShape } from "../data/classes";


export type VarsContainer = (SymbolRefShape | SymbolShape)[];


export interface PropsType {
    data: Shape;
    transx?: RenderTransform;
    varsContainer?: VarsContainer;
}

interface DataView {
    id: string;
    update(props?: PropsType, force?: boolean): void;
    render(): number;
}

export interface ComType {
    new(ctx: DViewCtx, props: PropsType): DataView;
}

export class DViewCtx {
    comsMap: Map<ShapeType, ComType> = new Map();
    // 选区
    // 缩放监听

    // 先更新数据再绘制
    protected datachangeset: Map<string, DataView> = new Map();
    // 要由上往下更新
    protected dirtyset: Map<string, DataView> = new Map();

    setUpdate(v: DataView) {
        this.datachangeset.set(v.id, v);
        this._continueLoop();
    }
    setDirty(v: DataView) {
        this.dirtyset.set(v.id, v);
        this._continueLoop();
    }

    removeUpdate(vid: string) {
        return this.datachangeset.delete(vid);
    }
    removeDirty(vid: string) {
        return this.dirtyset.delete(vid);
    }

    /**
     * return: if continue
     */
    protected aloop(): boolean {
        // update
        // render
        // todo
        // this.datachangeset.forEach((v, k) => {
        //     v.update();
        // });

        this.dirtyset.forEach((v, k) => {
            v.render();
        });

        if (this.datachangeset.size || this.dirtyset.size) {
            console.log("loop not empty ", this.datachangeset.size, this.dirtyset.size);
        }

        // return (this.datachangeset.size > 0 || this.dirtyset.size > 0);
        return false;
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