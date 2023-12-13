import { Watchable } from "../data/basic";
import { DViewCtx, PropsType } from "./viewctx";
import { Shape, SymbolRefShape, SymbolShape } from "../data/classes";
import { RenderTransform } from "../render";
import { genid } from "./basic";
import { EL } from "./el";

export class DataView extends Watchable(EL) {
    m_ctx: DViewCtx;
    m_data: Shape;
    // m_el?: HTMLElement | SVGElement; // bind
    m_children: DataView[] = [];
    m_parent: DataView | undefined;
    m_transx?: RenderTransform;
    m_varsContainer?: (SymbolRefShape | SymbolShape)[];

    // m_isdirty: boolean = false;
    m_isdistroyed: boolean = false;

    m_nodeCount: number = 1;

    constructor(ctx: DViewCtx, props: PropsType) {
        super("");
        this.m_ctx = ctx;
        this.m_data = props.data;

        this._datawatcher = this._datawatcher.bind(this);
        // watch data & varsContainer
        this.m_data.watch(this._datawatcher);
        if (this.m_varsContainer) {
            this.m_varsContainer.forEach((c) => c.watch(this._datawatcher));
        }

        // build childs
        this.onCreate();
        // this.update(props, true);
    }

    get isViewNode() {
        return true;
    }
    get nodeCount() {
        return this.m_nodeCount;
    }

    private _datawatcher(...args: any[]) {
        this.m_ctx.setUpdate(this);
        this.onDataChange(...args);
        super.notify(...args);
    }

    onCreate() {

    }

    onDestory() {

    }

    onDataChange(...args: any[]) {

    }

    data() {
        return this.m_data;
    }

    id() {
        if (this.m_varsContainer) return genid(this.m_data, this.m_varsContainer);
        return this.m_data.id;
    }

    // 1. 新创建，则正常创建，append
    // 2. 运行期更新，
    //    2.1 内部更新
    //        2.1.1 仅更新dom内部
    //        2.1.2 更换dom节点类型
    //    2.2 外部更新
    //        2.2.1 移动位置
    // 3. 销毁

    // bind(node: HTMLElement /* old, for reuse */) { // 
    //     // if same tag, modify
    //     // else replace
    //     if (this.m_el === node) return;
    //     if (this.m_el) this.m_el.remove();
    //     this.m_el = node;
    //     this.m_ctx.dirtyset.set(this.id(), this);
    // }

    // unbind() {
    //     if (this.m_el && this.m_el.parentNode) this.m_el.remove();
    // }

    update(props?: PropsType, force?: boolean) {
        throw new Error('not implemented');
    }

    // 
    render(): number {
        return 0;
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
        while (p) {
            p.m_nodeCount += child.m_nodeCount;
            p = p.m_parent;
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
        while (p) {
            p.m_nodeCount += nodeCount;
            p = p.m_parent;
        }
    }

    removeChild(idx: number) {
        const dom = this.m_children.splice(idx, 1)[0];
        if (dom) {
            this.m_nodeCount -= dom.m_nodeCount;
            let p = this.m_parent;
            while (p) {
                p.m_nodeCount -= dom.m_nodeCount;
                p = p.m_parent;
            }
            dom.m_parent = undefined;
        }
        return dom;
    }

    moveChild(child: DataView, toIdx: number) {
        if (child.m_parent !== this) {
            throw new Error("child not in this parent");
        }
        if (toIdx < 0 || toIdx >= this.m_children.length) {
            throw new Error("invalid index");
        }
        const fIdx = this.m_children.indexOf(child);
        if (fIdx === toIdx) {
            return;
        }
        if (fIdx < 0) {
            throw new Error("child not in this parent");
        }
        this.m_children.splice(fIdx, 1);
        this.m_children.splice(toIdx, 0, child);
    }

    removeChilds(idx: number, len: number) {
        const dom = this.m_children.splice(idx, len);
        if (dom) {
            let nodeCount = 0;
            dom.forEach(d => {
                d.m_parent = undefined;
                nodeCount += d.m_nodeCount;
            });

            this.m_nodeCount -= nodeCount;
            let p = this.m_parent;
            while (p) {
                p.m_nodeCount -= nodeCount;
                p = p.m_parent;
            }
        }
        return dom;
    }

    toSVGString(): string {
        // const frame = this.m_data.frame;
        // const attrs: { [kye: string]: string | number } = {};
        // attrs['xmlns'] = "http://www.w3.org/2000/svg";
        // attrs['xmlns:xlink'] = "http://www.w3.org/1999/xlink";
        // attrs['xmlns:xhtml'] = "http://www.w3.org/1999/xhtml";
        // attrs['preserveAspectRatio'] = "xMinYMin meet";
        // attrs.width = frame.width;
        // attrs.height = frame.height;
        // attrs.viewBox = `${frame.x} ${frame.y} ${frame.width} ${frame.height}`;
        // attrs.overflow = "visible";
        // return stringh('svg', attrs, [this.m_el?.innerHTML || ""]);
        throw new Error("not implemented");
    }

    destory() {
        if (this.m_parent) throw new Error("parent is not null");
        if (this.m_isdistroyed) throw new Error("already distroyed");
        const tid = this.id();
        this.m_ctx.removeUpdate(tid);
        this.m_ctx.removeDirty(tid);

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
