/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { DViewCtx, GraphicsLibrary, PropsType } from "./viewctx";
import { Shape, ShapeType, SymbolRefShape, SymbolShape } from "../data";
import { getShapeViewId } from "./basic";
import { EL } from "./el";
import { objectId } from "../basic/objectid";
import { IRenderer } from "../render/basic";
import { SVGConstructorMap } from "../render/SVG/painters/map";
import { CanvasConstructorMap } from "../render/canvas/painters/map";

class EventEL extends EL {
    private _events: { [key: string]: Function[] } = {};
    private _onceEvents: { [key: string]: Function[] } = {};
    private _emitLevel: number = 0;
    private _removes: Function[] = [];
    on(name: string, cb: Function) {
        (this._events[name] || (this._events[name] = [])).push(cb);
        const rm = () => this._events[name] && this._events[name].splice(this._events[name].indexOf(cb) >>> 0, 1);
        return {
            remove: () => {
                if (this._emitLevel === 0) rm();
                else this._removes.push(rm);
            }
        };
    }
    once(name: string, cb: Function) {
        (this._onceEvents[name] || (this._onceEvents[name] = [])).push(cb);
        const rm = () => this._onceEvents[name] && this._onceEvents[name].splice(this._onceEvents[name].indexOf(cb) >>> 0, 1);
        return {
            remove: () => {
                if (this._emitLevel === 0) rm();
                else this._removes.push(rm);
            }
        };
    }
    emit(name: string, ...args: any[]) {
        this._emitLevel++;
        try {
            (this._events[name] || []).forEach((fn: Function) => fn(...args));
            (this._onceEvents[name] || []).forEach((fn: Function) => fn(...args));
            delete this._onceEvents[name];
        } finally {
            this._emitLevel--;
        }
        if (this._emitLevel === 0) {
            this._removes.forEach((fn: Function) => fn());
            this._removes.length = 0;
        }
    }

    // watcher, 使用Watchable 包装, 语法检查无效了
    public __watcher: Set<((...args: any[]) => void)> = new Set();
    public watch(watcher: ((...args: any[]) => void)): (() => void) {
        this.__watcher.add(watcher);
        return () => {
            this.__watcher.delete(watcher);
        };
    }
    public unwatch(watcher: ((...args: any[]) => void)): boolean {
        return this.__watcher.delete(watcher);
    }
    public notify(...args: any[]) {
        if (this.__watcher.size === 0) return;
        // 在set的foreach内部修改set会导致无限循环
        Array.from(this.__watcher).forEach(w => {
            w(...args);
        });
    }
}

export interface RootView {
    onAddView(view: DataView | DataView[]): void;
    onRemoveView(parent: DataView, view: DataView | DataView[]): void;
    getView(id: string): DataView | undefined;
    addDelayDestroy(view: DataView | DataView[]): void;
    get isRootView(): boolean;
}

export class DataView extends EventEL {
    protected m_ctx: DViewCtx;
    protected m_gl: GraphicsLibrary = 'SVG';
    protected m_renderer: IRenderer;
    protected m_data: Shape;
    protected m_children: DataView[] = [];
    protected m_parent: DataView | undefined;
    protected m_props: PropsType // 缓存排版参数，用于下次直接layout

    protected m_varsContainer?: (SymbolRefShape | SymbolShape)[];
    protected m_isVirtual?: boolean;

    protected m_is_destroyed: boolean = false;
    protected m_nodeCount: number = 1;

    constructor(ctx: DViewCtx, props: PropsType) {
        super("");
        this.m_ctx = ctx;
        this.m_data = props.data;
        this.m_props = props;
        this.m_isVirtual = props.isVirtual;

        this._data_watcher = this._data_watcher.bind(this);
        this.m_data.watch(this._data_watcher);
        this.varsContainer = (props.varsContainer);

        this.m_ctx.setDirty(this);
        ctx.markRaw(this)

        this.m_renderer = this.rendererBuilder(this.m_gl);
    }

    get ctx() {
        return this.m_ctx;
    }

    get children() {
        return this.m_children;
    }

    getRenderer(gl?: GraphicsLibrary) {
        if (gl && gl !== this.m_gl) {
            this.m_gl = gl;
            this.m_renderer = this.rendererBuilder(this.m_gl);
        }
        return this.m_renderer;
    }

    get props() {
        return this.m_props;
    }

    set props(props: PropsType) {
        this.m_props = props;
    }

    get isVirtual(): boolean | undefined {
        return this.m_isVirtual;
    }

    set isVirtual(isVirtual: boolean | undefined) {
        this.m_isVirtual = isVirtual;
    }

    rendererBuilder(gl: GraphicsLibrary): IRenderer {
        const view = this;
        switch (gl) {
            case "SVG":
                let SVGRendererConstructor = SVGConstructorMap.get(view.type);
                if (!SVGRendererConstructor) {
                    console.error(`SVGRendererConstructor not found for type: ${view.type}`);
                    SVGRendererConstructor = SVGConstructorMap.get(ShapeType.Rectangle)!;
                }
                return new SVGRendererConstructor(view as any); // todo: fix type
            case "Canvas":
                let CanvasRendererConstructor = CanvasConstructorMap.get(view.type);
                if (!CanvasRendererConstructor) {
                    console.error(`CanvasRendererConstructor not found for type: ${view.type}`);
                    CanvasRendererConstructor = CanvasConstructorMap.get(ShapeType.Rectangle)!;
                }
                return new CanvasRendererConstructor(view as any); // todo: fix type
            default:
                throw new Error(`Unsupported graphics library: ${gl}`);
        }
    }

    get canvasRenderingContext2D(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
        return this.m_ctx.canvas;
    }

    setData(data: Shape) {
        if (objectId(data) === objectId(this.m_data)) return;
        const old = this.m_data;
        old.unwatch(this._data_watcher);
        data.watch(this._data_watcher);
        this.m_data = data;
    }

    get varsContainer() {
        return this.m_varsContainer;
    }

    set varsContainer(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
        if (this.m_varsContainer) {
            this.m_varsContainer.forEach((c) => c.unwatch(this._data_watcher));
        }
        this.m_varsContainer = varsContainer;
        if (this.m_varsContainer) {
            this.m_varsContainer.forEach((c) => c.watch(this._data_watcher));
        }
    }
    // mock shape
    get isViewNode() {
        return true;
    }
    get nodeCount() {
        return this.m_nodeCount;
    }
    get data() {
        return this.m_data;
    }
    get id() {
        return getShapeViewId(this.m_data.id, this.m_varsContainer);
    }
    get parent() {
        return this.m_parent;
    }
    get childs() {
        return this.m_children;
    }
    get naviChilds(): DataView[] | undefined {
        return this.m_children;
    }
    get type() {
        return this.m_data.type;
    }
    get name() {
        return this.m_data.name;
    }
    get isVirtualShape() {
        return this.m_isVirtual;
    }

    private _data_watcher(...args: any[]) {
        this.m_ctx.setReLayout(this);
        this.m_ctx.setDirty(this);
        this.onUpdate(...args);
        this.notify(...args);
    }

    onDestroy() {
    }

    get isDestroyed() {
        return this.m_is_destroyed;
    }

    onUpdate(...args: any[]) {
    }

    layout(args: any) {
        throw new Error('not implemented');
    }

    layoutProxy = { updateFrames: () => false };

    render(gl: GraphicsLibrary): number {
        if (gl !== this.m_gl) {
            this.m_gl = gl;
            this.m_renderer = this.rendererBuilder(this.m_gl);
        }
        return this.m_renderer.render();
    }

    asyncRender(gl: GraphicsLibrary): number {
        if (gl !== this.m_gl) {
            this.m_gl = gl;
            this.m_renderer = this.rendererBuilder(this.m_gl);
        }
        return this.m_renderer.asyncRender();
    }

    getRootView(): RootView | undefined {
        let p: DataView | undefined = this;
        while (p) {
            if ((p as any as RootView).isRootView) return p as any as RootView;
            p = p.m_parent;
        }
    }

    onMounted() { }
    protected onUnmounted() { }

    addChild(child: DataView, idx?: number) {
        if (child.m_parent) throw new Error('child already added');
        if (idx !== undefined) {
            this.m_children.splice(idx, 0, child);
        }
        else {
            this.m_children.push(child);
        }
        child.m_parent = this;

        this.m_nodeCount += child.m_nodeCount;
        let p = this.m_parent;
        let root: DataView = this;
        while (p) {
            root = p;
            p.m_nodeCount += child.m_nodeCount;
            p = p.m_parent;
        }
        if ((root as any).isRootView) {
            (root as any as RootView).onAddView(child);
        }
        child.onMounted();
    }

    removeChild(idx: number | DataView) {
        if (typeof idx !== 'number') {
            idx = this.m_children.findIndex(c => c.id === (idx as DataView).id);
        }
        const dom = this.m_children.splice(idx, 1)[0];
        if (dom) {
            this.m_nodeCount -= dom.m_nodeCount;
            let p = this.m_parent;
            let root: DataView = this;
            while (p) {
                root = p;
                p.m_nodeCount -= dom.m_nodeCount;
                p = p.m_parent;
            }
            if ((root as any).isRootView) {
                (root as any as RootView).onRemoveView(this, dom);
            }
            dom.m_parent = undefined;
            dom.onUnmounted();
        }
        return dom;
    }

    moveChild(child: DataView, toIdx: number): boolean {
        if (child.m_parent !== this) {
            throw new Error("child not in this parent");
        }
        if (toIdx < 0 || toIdx >= this.m_children.length) {
            throw new Error("invalid index");
        }
        const fIdx = this.m_children.indexOf(child);
        if (fIdx === toIdx) {
            return false;
        }
        if (fIdx < 0) {
            throw new Error("child not in this parent");
        }
        this.m_children.splice(fIdx, 1);
        this.m_children.splice(toIdx, 0, child);
        return true;
    }

    removeChilds(idx: number, len: number) {
        const dom = this.m_children.splice(idx, len);
        if (dom && dom.length) {
            let nodeCount = 0;
            dom.forEach(d => {
                nodeCount += d.m_nodeCount;
            });

            this.m_nodeCount -= nodeCount;
            let p = this.m_parent;
            let root: DataView = this;
            while (p) {
                root = p;
                p.m_nodeCount -= nodeCount;
                p = p.m_parent;
            }
            if ((root as any).isRootView) {
                (root as any as RootView).onRemoveView(this, dom);
            }
            dom.forEach(d => {
                d.m_parent = undefined
                d.onUnmounted();
            });
        }
        return dom;
    }

    destroy() {
        if (this.m_parent) throw new Error("parent is not null");
        if (this.m_is_destroyed) throw new Error("already distroyed");
        this.m_ctx.removeReLayout(this);
        this.m_ctx.removeDirty(this);

        this.m_data.unwatch(this._data_watcher);
        if (this.m_varsContainer) {
            this.m_varsContainer.forEach((c) => c.unwatch(this._data_watcher));
        }
        this.removeChilds(0, Number.MAX_VALUE).forEach((c) => c.destroy());
        this.onDestroy();
        this.m_is_destroyed = true;
        this.notify('destroy');
    }
}
