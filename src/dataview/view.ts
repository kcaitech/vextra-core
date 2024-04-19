import { DViewCtx, PropsType } from "./viewctx";
import { Shape, SymbolRefShape, SymbolShape } from "../data/classes";
import { RenderTransform, getShapeViewId, stringh } from "./basic";
import { EL } from "./el";
import { objectId } from "../basic/objectid";

// EventEmitter

// interface IKeyAny {
//     [key: string]: any
// }

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
    addDelayDestory(view: DataView | DataView[]): void;
    get isRootView(): boolean;
}

export class DataView extends EventEL {
    m_ctx: DViewCtx;
    m_data: Shape;
    m_children: DataView[] = [];
    m_parent: DataView | undefined;
    m_transx?: RenderTransform;
    private m_varsContainer?: (SymbolRefShape | SymbolShape)[];
    m_isVirtual?: boolean;

    m_isdistroyed: boolean = false;
    m_nodeCount: number = 1;

    constructor(ctx: DViewCtx, props: PropsType) {
        super("");
        this.m_ctx = ctx;
        this.m_data = props.data;
        this.m_transx = props.transx;
        this.m_varsContainer = props.varsContainer;
        this.m_isVirtual = props.isVirtual;

        this._datawatcher = this._datawatcher.bind(this);
        // watch data & varsContainer
        this.m_data.watch(this._datawatcher);
        this.varsContainer = (props.varsContainer);

        this.m_ctx.setDirty(this);
    }

    setData(data: Shape) {
        if (objectId(data) === objectId(this.m_data)) return;
        const old = this.m_data;
        old.unwatch(this._datawatcher);
        data.watch(this._datawatcher);
        this.m_data = data;
    }

    get varsContainer() {
        return this.m_varsContainer;
    }
    protected set varsContainer(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
        if (this.m_varsContainer) {
            this.m_varsContainer.forEach((c) => c.unwatch(this._datawatcher));
        }
        this.m_varsContainer = varsContainer;
        if (this.m_varsContainer) {
            this.m_varsContainer.forEach((c) => c.watch(this._datawatcher));
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

    private _datawatcher(...args: any[]) {
        this.m_ctx.setReLayout(this);
        this.m_ctx.setDirty(this);
        this.onDataChange(...args);
        this.notify(...args);
    }

    onDestory() {

    }

    onDataChange(...args: any[]) {
    }

    layout(props?: PropsType) {
        throw new Error('not implemented');
    }

    // 
    render(): number {
        return 0;
    }

    getRootView(): RootView | undefined {
        let p: DataView | undefined = this;
        while (p) {
            if ((p as any as RootView).isRootView) return p as any as RootView;
            p = p.m_parent;
        }
    }

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
    }

    addChilds(childs: DataView[], idx?: number) {
        // check
        childs.forEach(c => {
            if (c.m_parent) throw new Error('child already added');
        })
        if (idx !== undefined) {
            this.m_children.splice(idx, 0, ...childs);
        }
        else {
            this.m_children.push(...childs);
        }
        let nodeCount = 0;
        childs.forEach(c => {
            c.m_parent = this;
            nodeCount += c.m_nodeCount;
        })

        this.m_nodeCount += nodeCount;
        let p = this.m_parent;
        let root: DataView = this;
        while (p) {
            root = p;
            p.m_nodeCount += nodeCount;
            p = p.m_parent;
        }
        if ((root as any).isRootView) {
            (root as any as RootView).onAddView(childs);
        }
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
                // d.m_parent = undefined;
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
            dom.forEach(d => d.m_parent = undefined);
        }
        return dom;
    }

    toSVGString(): string {
        const frame = this.m_data.frame;
        const attrs: { [kye: string]: string | number } = {};
        attrs['version'] = "1.1";
        attrs['xmlns'] = "http://www.w3.org/2000/svg";
        attrs['xmlns:xlink'] = "http://www.w3.org/1999/xlink";
        attrs['xmlns:xhtml'] = "http://www.w3.org/1999/xhtml";
        attrs['preserveAspectRatio'] = "xMinYMin meet";
        attrs.width = frame.width;
        attrs.height = frame.height;
        // attrs.viewBox = `${frame.x} ${frame.y} ${frame.width} ${frame.height}`;
        attrs.overflow = "visible";
        return stringh('svg', attrs, super.toSVGString());
    }

    destory() {
        if (this.m_parent) throw new Error("parent is not null");
        if (this.m_isdistroyed) throw new Error("already distroyed");
        const tid = this.id;
        this.m_ctx.removeReLayout(this);
        this.m_ctx.removeDirty(this);

        // if (this.m_el) {
        //     this.m_el.remove();
        //     this.m_el = undefined;
        // }
        this.m_data.unwatch(this._datawatcher);
        if (this.m_varsContainer) {
            this.m_varsContainer.forEach((c) => c.unwatch(this._datawatcher));
        }
        this.removeChilds(0, Number.MAX_VALUE).forEach((c) => c.destory());
        // --this.m_ctx.instanceCount;
        // remove first?
        this.onDestory();
        this.m_isdistroyed = true;
        // destroy childs
        // destroy dom
        // recycle?
    }
}
