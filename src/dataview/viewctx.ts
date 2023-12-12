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
    id(): string;
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
        this.datachangeset.set(v.id(), v);
        this._continueLoop();
    }
    setDirty(v: DataView) {
        this.dirtyset.set(v.id(), v);
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

        // return (this.datachangeset.size > 0 || this.dirtyset.size > 0);
        return false;
    }

    private _continueLoop() {
        if (this.__looping && !this.__toId) this._startLoop();
    }

    private _startLoop() {
        const run = () => {
            if (!this.__looping) return;
            if (this.aloop()) {
                this.__toId = setTimeout(run, 0);
            }
            else {
                this.__toId = undefined;
            }
        }
        this.__toId = setTimeout(run, 0);
    }

    private __looping: boolean = false;
    private __toId: any;
    loop() {
        if (this.__looping) return;
        this.__looping = true;
        this._startLoop();
    }

    stopLoop() {
        if (!this.__looping) return;
        this.__looping = false;
        if (this.__toId) {
            clearTimeout(this.__toId);
            this.__toId = undefined;
        }
    }
}