import { objectId } from "../basic/objectid";
import { WatchableObject } from "./basic";
import { Shape, SymbolShape } from "./shape";
import { SymbolRefShape } from "./symbolref";

export class SymbolMgr extends WatchableObject {
    private __resource = new Map<string, { symbols: Array<SymbolShape>, refs: Map<number, SymbolRefShape> }>()
    private __guard?: (data: Shape) => Shape;
    // private __updater?: (data: SymbolShape) => void;
    // private __loading: Map<string, {
    //     id: string,
    //     resolves: ((v: SymbolShape | undefined) => void)[],
    //     rejects: ((e?: any) => void)[]
    // }> = new Map();
    private __crdtpath: string[];

    private __regist: Map<string, string>;

    constructor(crdtpath: string[], regist: Map<string, string>, guard?: (data: Shape) => Shape) {
        super();
        this.__regist = regist;
        this.__guard = guard;
        this.__crdtpath = crdtpath;
    }
    // get parent() {
    //     return this.__parent;
    // }
    // set parent(parent: Basic | undefined) {
    //     this.__parent = parent;
    // }

    getCrdtPath(): string[] {
        return this.__crdtpath;
    }
    get size() {
        return this.__resource.size;
    }
    get keys() {
        return Array.from(this.__resource.keys());
    }
    // get resource() {
    //     return Array.from(this.__resource.values()).map((v) => v.symbols);
    // }
    get(id: string): SymbolShape | undefined {
        return this._get(id)
        // if (r) return r;
        // // 等通知
        // let loading = this.__loading.get(id);
        // if (!loading) {
        //     loading = {
        //         id,
        //         resolves: [],
        //         rejects: []
        //     }
        //     this.__loading.set(id, loading);
        // }
        // const _loading = loading;
        // return new Promise<SymbolShape | undefined>((resolve, reject) => {
        //     _loading.resolves.push(resolve)
        //     _loading.rejects.push(reject)
        // })
    }
    // setUpdater(updater: (data: SymbolShape) => void) {
    //     this.__updater = updater;
    // }
    // getSync(id: string): SymbolShape | undefined {
    //     return this._get(id)
    // }
    // getSync2(id: string): SymbolShape[] | undefined {
    //     return this.__resource.get(id)?.symbols;
    // }
    add(id: string, r: SymbolShape) {
        r = this.__guard && this.__guard(r) as SymbolShape || r
        let arr = this.__resource.get(id)
        if (!arr) {
            arr = { symbols: [], refs: new Map() };
            this.__resource.set(id, arr);
        }
        arr.symbols.push(r);
        // if (this.__updater) this.__updater(r);

        // 这时symbolshape可能还没有parent
        // resolve loading
        // const loading = this.__loading.get(id);
        // if (loading) loading.resolves.forEach(r => r(arr));
        // this.notify(id);

        this._notify(id);

        return r;
    }

    private _get(id: string) {
        const val = this.__resource.get(id)?.symbols
        // if (r && r.length > 0) return r;
        if (!val) return undefined;

        const reg = this.__regist.get(id);
        if (!reg) return val[val.length - 1];

        let sym;
        // todo val 有多个时，需要提示用户修改
        for (let i = 0; i < val.length; ++i) {
            const v = val[i];
            const p = v.getPage();
            if (!p && reg === 'freesymbols') {
                sym = v;
                break;
            } else if (p && p.id === reg) {
                sym = v;
            }
        }
        return sym;
    }

    private _notify(id: string) {
        const run = () => {
            const sym = this._get(id);
            if (!sym) return;
            // const loading = this.__loading.get(id);
            // if (loading) loading.resolves.forEach(r => r(sym));
            // this.notify(id);

            const item = this.__resource.get(id)!;
            item.refs.forEach(ref => ref.onSymbolReady());
        }
        setTimeout(run);
    }

    getRefs(id: string): Map<number, SymbolRefShape> | undefined {
        return this.__resource.get(id)?.refs;
    }
    removeRef(id: string, ref: SymbolRefShape) {
        const item = this.__resource.get(id);
        if (!item) return;
        item.refs.delete(objectId(ref)); // 使用objectId，以防止全局id重复
    }
    addRef(id: string, ref: SymbolRefShape) {
        ref = this.__guard && this.__guard(ref) as SymbolRefShape || ref
        let item = this.__resource.get(id);
        if (!item) {
            item = { symbols: [], refs: new Map() };
            this.__resource.set(id, item);
        }
        item.refs.set(objectId(ref), ref);
    }
}