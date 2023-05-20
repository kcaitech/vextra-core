import { objectId, __objidkey } from '../basic/objectid';
import { BasicMap, castNotifiable, IDataGruad, ISave4Restore, Notifiable } from './basic';
import { Watchable } from './basic';

export interface ICMD {
    exec(): void;
    unexec(): void;
}

class TContext {
    public transact?: Transact;
    public cache: Map<number, Set<PropertyKey>> = new Map();
    private __notifys: Map<number, Notifiable> = new Map();
    public optiNotify: boolean = true;
    addNotify(target: Notifiable | undefined) {
        if (!target) {
            // 
        }
        else if (this.optiNotify) {
            this.__notifys.set(objectId(target), target)
        }
        else {
            target.notify();
        }
    }
    fireNotify() {
        this.__notifys.forEach((target) => {
            target.notify();
        })
        this.__notifys.clear();
    }
    clearNotify() {
        this.__notifys.clear();
    }
}

function swapCached(context: TContext, target: object, propertyKey: PropertyKey): boolean {
    const cache = context.cache;
    let set = cache.get(objectId(target));
    if (!set) {
        set = new Set<PropertyKey>();
        set.add(propertyKey);
        cache.set(objectId(target), set);
        return false;
    }
    else if (set.has(propertyKey)) {
        return true;
    } else {
        set.add(propertyKey);
        return false;
    }
}
class ProxyHandler {
    private __context: TContext;
    private __p2r: WeakMap<any, any>;
    constructor(context: TContext, p2r: WeakMap<any, any>) {
        this.__context = context;
        this.__p2r = p2r;
    }
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any) {
        let needNotify = false;
        let ignore = false;
        if (typeof propertyKey === 'string' && propertyKey.startsWith('__')) {
            ignore = true;
        }
        else if (this.__context.transact === undefined) {
            throw new Error("NOT inside transact!");
        } else if (target instanceof Array) {
            if (propertyKey === "length") {
                if (target.length > value) {
                    for (let i = value, len = target.length; i < len; i++) {
                        const a = target[i];
                        if (a && !swapCached(this.__context, target, i)) {
                            const r = new Rec(target, i, target[i]);
                            this.__context.transact.push(r);
                        }
                    }
                }
                if (target.length != value) {
                    needNotify = true;
                    if (!swapCached(this.__context, target, propertyKey)) {
                        const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                        this.__context.transact.push(r);
                    }
                }
            } else {
                const propInt: number = Number.parseInt(propertyKey.toString());
                const propIsInt = Number.isInteger(propInt) && propInt.toString() == propertyKey;
                if ((propIsInt || !propertyKey.toString().startsWith('__'))) {
                    needNotify = true;
                    if (!swapCached(this.__context, target, propertyKey)) {
                        const saveLen = target.length;
                        const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                        this.__context.transact.push(r);

                        if (!ignore) {
                            if (typeof value === 'object') value.__parent = target;
                            value = deepProxy(value, this, this.__p2r);
                        }

                        const ret = Reflect.set(target, propertyKey, value, receiver);
                        if (needNotify) {
                            // target.notify();
                            this.__context.addNotify(castNotifiable(target));
                        }
                        // length, 设置完数据后array会自动增长长度，绕过了proxy
                        if (saveLen !== target.length) {
                            if (!swapCached(this.__context, target, "length")) {
                                const r = new Rec(target, "length", saveLen);
                                this.__context.transact.push(r);
                            }
                        }
                        return ret;
                    }
                }
            }
        } else {
            needNotify = true;
            if (!swapCached(this.__context, target, propertyKey)) {
                const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                this.__context.transact.push(r);
            }
        }

        if (!ignore) {
            if (typeof value === 'object') value.__parent = target;
            value = deepProxy(value, this, this.__p2r);
        }

        const ret = Reflect.set(target, propertyKey, value, receiver);
        if (needNotify) {
            // target.notify();
            this.__context.addNotify(castNotifiable(target));
        }
        return ret;
    }
    deleteProperty(target: object, propertyKey: PropertyKey) {
        let needNotify = false;
        if (this.__context.transact === undefined) {
            // console.log(target, propertyKey, value, receiver)
            if (propertyKey.toString().startsWith("__")) {
                // do nothing
            } else {
                throw new Error("NOT inside transact!");
            }
        } else if (target instanceof Array) {
            const propInt: number = Number.parseInt(propertyKey.toString());
            const propIsInt = Number.isInteger(propInt) && propInt.toString() == propertyKey;
            if ((propIsInt || !propertyKey.toString().startsWith('__'))) {
                needNotify = true;
                if (!swapCached(this.__context, target, propertyKey)) {
                    const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                    this.__context.transact.push(r);
                }
                // todo length
            }
        }
        else if (!propertyKey.toString().startsWith('__')) {
            needNotify = true;
            if (!swapCached(this.__context, target, propertyKey)) {
                const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                this.__context.transact.push(r);
            }
        }

        const result = Reflect.deleteProperty(target, propertyKey);
        if (needNotify) {
            // target.notify();
            this.__context.addNotify(castNotifiable(target));
        }
        return result;
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const val = Reflect.get(target, propertyKey, receiver);
        if (val === undefined && propertyKey === "__isProxy") {
            return true;
        }
        if (target instanceof Map && typeof val === 'function') {
            if (propertyKey == 'set' || propertyKey == 'delete') {
                if (this.__context.transact !== undefined) {
                    if (!swapCached(this.__context, target, propertyKey)) {
                        return Reflect.get(this.sub(this.__p2r, this.__context), propertyKey, receiver);
                    }
                    this.__context.addNotify(castNotifiable(target));
                }
            }
            return val.bind(target);
        }
        return val;
    }
    has(target: object, propertyKey: PropertyKey) {
        if (target instanceof Map) {
            return target.has(propertyKey);
        }
        const val = Reflect.has(target, propertyKey);
        // if (target instanceof Map && typeof val === 'function') {
        //     return val.bind(target);
        // }
        return val;
    }
    sub(p2r: WeakMap<any, any>, _con: TContext) {
        return {
            set(key: any, value: any) {
                try {
                    const t = new Map();
                    const set_inner = t.set.bind(p2r.get(this));
                    set_inner(key, value);
                    const r = new Rec(this, 'set', { isContentExist: true, content: value });
                    _con.transact?.push(r);
                } catch (error) {
                    throw new Error(`${error}`);
                }
            },
            delete(key: any) {
                try {
                    const t = new Map();
                    const get = t.get.bind(p2r.get(this));
                    const ori = get(key)
                    const delete_inner = t.delete.bind(p2r.get(this));
                    delete_inner(key)
                    const r = new Rec(this, 'delete', { isContentExist: false, content: ori });
                    _con.transact?.push(r);
                } catch (error) {
                    throw new Error(`${error}`);
                }
            }
        };
    }
}

export const isProxy = (obj: any): boolean => obj && obj["__isProxy"];

class Rec {
    private __target: object
    private __propertyKey: PropertyKey
    private __value: any
    constructor(target: object, propertyKey: PropertyKey, value: any) {
        this.__target = target
        this.__propertyKey = propertyKey
        this.__value = value
    }
    swap(ctx: TContext, p2r: WeakMap<any, any>) {
        if (this.__target instanceof BasicMap) {
            if (this.__propertyKey == 'set' || this.__propertyKey == 'delete') {
                if (this.__value.isContentExist) {
                    p2r.get(this.__target).delete(this.__value.content.id);
                } else {
                    p2r.get(this.__target).set(this.__value.content.id, this.__value.content);
                }
                this.__value.isContentExist = !this.__value.isContentExist;
            }
        } else {
            const v = Reflect.get(this.__target, this.__propertyKey)
            if (this.__target instanceof Array && this.__value === undefined && this.__propertyKey) {
                const propInt: number = Number.parseInt(this.__propertyKey.toString());
                const propIsInt = Number.isInteger(propInt) && propInt.toString() == this.__propertyKey;
                if (propIsInt) {
                    // 不影响length
                    Reflect.deleteProperty(this.__target, this.__propertyKey);
                } else {
                    if (typeof this.__value === 'object') this.__value.__parent = this.__target;
                    Reflect.set(this.__target, this.__propertyKey, this.__value);
                }
            } else {
                if (typeof this.__value === 'object') this.__value.__parent = this.__target;
                Reflect.set(this.__target, this.__propertyKey, this.__value);
            }
            this.__value = v;
        }
        if (this.__target) {
            // this.__target.notify();
            ctx.addNotify(castNotifiable(this.__target));
        }
    }
    get target() {
        return this.__target;
    }
    get propertyKey() {
        return this.__propertyKey;
    }
}

class ArrayRec extends Rec {
    private __haslen: boolean = false;
    private __len: number = 0;
    private __recs: Array<Rec> = [];
    constructor(target: object) {
        super(target, "", "");
    }

    push(rec: Rec) {
        if (objectId(rec.target) !== objectId(this.target)) {
            throw new Error("");
        }
        if (this.__recs.length === 0) {
            this.__len = Reflect.get(rec.target, "length");// (rec.target as Array<any>).length;
        }
        if (rec.propertyKey == "length") {
            this.__haslen = true;
        }
        else {
            this.__recs.push(rec);
        }
    }

    swap(ctx: TContext, p2r: WeakMap<any, any>): void {
        const len = Reflect.get(this.target, "length")
        for (let i = 0, l = this.__recs.length; i < l; i++) {
            this.__recs[i].swap(ctx, p2r);
        }
        if (this.__haslen) {
            Reflect.set(this.target, "length", this.__len);
            this.__len = len;
        }
    }
}

class Transact extends Array<Rec | ICMD> {
    private __name: string;
    private __cache: Map<number, ArrayRec> = new Map();
    // private __cmds: Array<ICMD> = [];
    constructor(name: string) {
        super();
        this.__name = name;
    }
    exec(ctx: TContext, p2r: WeakMap<any, any>): void {
        // throw new Error('Method not implemented.');
        // this.swap(ctx);
        for (let i = 0, len = this.length; i < len; i++) {
            const r = this[i];
            if (r instanceof Rec) {
                r.swap(ctx, p2r);
            }
            else {
                r.exec();
            }
        }
    }
    unexec(ctx: TContext, p2r: WeakMap<any, any>): void {

        // 数组的操作是操作完[1，2，3]元素后再操作length，
        // 如果反过来，先操作length再操作元素，会使元素数据丢失
        // for (let i = 0, len = this.length; i < len; i++) {
        //     const r = this[i];
        //     if (r instanceof Rec) {
        //         r.swap(ctx);
        //     }
        //     // else {
        //     //     r.unexec();
        //     // }
        // }
        for (let i = this.length - 1; i >= 0; i--) {
            const r = this[i];
            if (r instanceof Rec) {
                r.swap(ctx, p2r);
            }
            else {
                r.unexec();
            }
        }
    }
    // swap(ctx: TContext) {
    //     for (let i = this.length - 1; i >= 0; i--) {
    //         this[i].swap(ctx);
    //     }
    // }
    push(...items: (Rec | ICMD)[]): number {
        for (let i = 0, len = items.length; i < len; i++) {
            const a = items[i];
            if (a instanceof Rec && a.target instanceof Array) {
                let arrRec = this.__cache.get(objectId(a.target));
                if (arrRec === undefined) {
                    arrRec = new ArrayRec(a.target);
                    this.__cache.set(objectId(a.target), arrRec);
                    super.push(arrRec);
                }
                arrRec.push(a);
            }
            else {
                super.push(a);
            }
        }
        return this.length;
        // return super.push(...items);
    }
    // pushCMD(...cmds: ICMD[]): void {
    // }
}

export class Repository extends Watchable(Object) implements IDataGruad {
    private __context: TContext;
    private __ph: ProxyHandler;
    private __trans: Transact[] = [];
    private __index: number = 0;
    private __proxy2raw: WeakMap<any, any> = new WeakMap();
    // private __selection: ISave4Restore;

    constructor() {
        super();
        // this.__selection = selection;
        this.__context = new TContext();
        this.__ph = new ProxyHandler(this.__context, this.__proxy2raw);
    }
    get transactCtx() {
        return this.__context;
    }

    undo() {
        if (!this.canUndo()) {
            return;
        }
        this.__index--;
        this.__context.optiNotify = true;
        this.__trans[this.__index].unexec(this.__context, this.__proxy2raw);
        this.__context.fireNotify();
        this.notify();
    }

    redo() {
        if (!this.canRedo()) {
            return;
        }
        this.__context.optiNotify = true;
        this.__trans[this.__index].exec(this.__context, this.__proxy2raw);
        this.__index++;
        this.__context.fireNotify();
        this.notify();
    }

    canUndo() {
        return this.__index > 0;
    }

    canRedo() {
        return this.__index < this.__trans.length;
    }

    /**
     * 
     * @param name 
     * @param saved selection等
     */
    start(name: string, saved: any) {
        if (this.__context.transact !== undefined) {
            throw new Error();
        }
        this.__context.optiNotify = true;
        this.__context.cache.clear();
        this.__context.transact = new Transact(name);
    }

    push(...cmds: ICMD[]): void {
        if (this.__context.transact === undefined) {
            throw new Error();
        }
        this.__context.transact.push(...cmds);
    }

    /**
     * 
     * @param cmd 最后打包成一个cmd，用于op，也可另外存
     */
    commit(cmd: any) {
        if (this.__context.transact === undefined) {
            throw new Error();
        }
        this.__context.cache.clear();
        this.__trans.length = this.__index;
        this.__trans.push(this.__context.transact);
        this.__index++;
        this.__context.transact = undefined;
        this.__context.fireNotify();
        this.notify();
    }

    rollback() {
        if (this.__context.transact === undefined) {
            throw new Error();
        }
        this.__context.cache.clear();
        this.__context.transact.unexec(this.__context, this.__proxy2raw);
        this.__context.transact = undefined;
        this.__context.fireNotify();
    }

    isInTransact() {
        return this.__context.transact !== undefined;
    }

    guard(data: any): any {
        return deepProxy(data, this.__ph, this.__proxy2raw);
    }
}

function deepProxy(data: any, h: ProxyHandler, p2r: WeakMap<any, any>): any {
    if (typeof data !== 'object' || isProxy(data)) {
        return data;
    }
    const stack: any[] = [data];
    while (stack.length > 0) {
        const d = stack.pop();

        if (d instanceof Map) {
            d.forEach((v, k, m) => {
                if (k.startsWith("__")) {
                    // donothing
                }
                else if (typeof (v) === 'object') { // 还有array set map
                    v.__parent = d;
                    if (!isProxy(v)) {
                        m.set(k, new Proxy(v, h));
                        stack.push(v);
                    }
                }
            })
        }
        else {
            for (const k in d) {
                const v = Reflect.get(d, k);
                if (k.startsWith("__")) {
                    // donothing
                }
                else if (typeof (v) === 'object') { // 还有array set map
                    v.__parent = d;
                    if (!isProxy(v)) {
                        const p = new Proxy(v, h);
                        Reflect.set(d, k, p);
                        stack.push(v);
                        if (v instanceof BasicMap) {
                            p2r.set(p, v);
                        }
                    }
                }
            }
        }
    }
    return new Proxy(data, h);
}
