import { objectId, __objidkey } from '@/basic/objectid';
import { Notifiable, Watchable } from './basic';

export function Atom(target: any) {
    if (target.prototype.__iid_cdd67eac7c12025695ce30803b43c9cd) {
        throw new Error("AtomData and AtomGroup are Conflict");
    }
    if (!target.prototype.__iid_b306492ce7b875cf08e206c4109490aa) {
        target.prototype.__iid_b306492ce7b875cf08e206c4109490aa = true;
    }
}

export function AtomGroup(target: any) {
    if (target.prototype.__iid_b306492ce7b875cf08e206c4109490aa) {
        throw new Error("AtomData and AtomGroup are Conflict");
    }
    if (!target.prototype.__iid_cdd67eac7c12025695ce30803b43c9cd) {
        target.prototype.__iid_cdd67eac7c12025695ce30803b43c9cd = true;
    }
}

export interface ICMD {
    exec(): void;
    unexec(): void;
}

const isAtom = (obj: any): boolean => obj && obj.__iid_b306492ce7b875cf08e206c4109490aa;
const isAtomGroup = (obj: any): boolean => obj && obj.__iid_cdd67eac7c12025695ce30803b43c9cd;

class TContext {
    public transact?: Transact;
    public cache: Map<number, Set<PropertyKey> > = new Map();
    private __notifys: Map<number, Notifiable> = new Map();
    public optiNotify: boolean = true;
    addNotify(target: Notifiable) {
        if (this.optiNotify) {
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

class AtomHandler {
    private __context: TContext;
    constructor(context: TContext) {
        this.__context = context;
    }
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any) {
        if (propertyKey.toString().startsWith("__")) {
            // do nothing
        } else if (this.__context.transact === undefined) {
            // console.warn("NOT inside transact!");
            throw new Error("NOT inside transact!");
        }
        else {
            throw new Error("Can't Modify Atom Data!");
        }
        return Reflect.set(target, propertyKey, value, receiver);
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const val = Reflect.get(target, propertyKey, receiver);
        if (val === undefined && propertyKey === "__isProxy") {
            return true;
        }
        if (target instanceof Map && typeof val === 'function') {
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
}

class GroupHandler {
    private __context: TContext;
    constructor(context: TContext) {
        this.__context = context;
    }
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any) {
        // console.log(target, propertyKey, value, receiver)
        let needNotify = false;
        if (this.__context.transact === undefined) {
            // console.log(target, propertyKey, value, receiver)
            if (propertyKey.toString().startsWith("__")) {
                // do nothing
            } else {
                throw new Error("NOT inside transact!");
            }
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
                if ((propIsInt || propertyKey.toString().startsWith('m_'))) {
                    needNotify = true;
                    if (!swapCached(this.__context, target, propertyKey)) {
                        const saveLen = target.length;
                        const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                        this.__context.transact.push(r);

                        const ret = Reflect.set(target, propertyKey, value, receiver);
                        if (needNotify && target instanceof Notifiable) {
                            // target.notify();
                            this.__context.addNotify(target);
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
        }
        else if (propertyKey.toString().startsWith('m_')) {
            needNotify = true;
            if (!swapCached(this.__context, target, propertyKey)) {
                const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                this.__context.transact.push(r);
            }
        }

        const ret = Reflect.set(target, propertyKey, value, receiver);
        if (needNotify && target instanceof Notifiable) {
            // target.notify();
            this.__context.addNotify(target);
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
            if ((propIsInt || propertyKey.toString().startsWith('m_'))) {
                needNotify = true;
                if (!swapCached(this.__context, target, propertyKey)) {
                    const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                    this.__context.transact.push(r);
                }
                // todo length
            }
        }
        else if (propertyKey.toString().startsWith('m_')) {
            needNotify = true;
            if (!swapCached(this.__context, target, propertyKey)) {
                const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                this.__context.transact.push(r);
            }
        }

        const result = Reflect.deleteProperty(target, propertyKey);
        if (needNotify && target instanceof Notifiable) {
            // target.notify();
            this.__context.addNotify(target);
        }

        return result;
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const val = Reflect.get(target, propertyKey, receiver);
        if (val === undefined && propertyKey === "__isProxy") {
            return true;
        }
        if (target instanceof Map && typeof val === 'function') {
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
    swap(ctx: TContext) {
        const v = Reflect.get(this.__target, this.__propertyKey)
        if (this.__target instanceof Array && this.__value === undefined && this.__propertyKey) {
            const propInt: number = Number.parseInt(this.__propertyKey.toString());
            const propIsInt = Number.isInteger(propInt) && propInt.toString() == this.__propertyKey;
            if (propIsInt) {
                // 不影响length
                Reflect.deleteProperty(this.__target, this.__propertyKey);
            } else {
                Reflect.set(this.__target, this.__propertyKey, this.__value);
            }
        } else {
            Reflect.set(this.__target, this.__propertyKey, this.__value);
        }
        this.__value = v;
        if (this.__target instanceof Notifiable) {
            // this.__target.notify();
            ctx.addNotify(this.__target);
        }
    }
//     get target() {
//         return this.__target;
//     }
}

class Transact extends Array<Rec | ICMD> {
    private __name: string;
    // private __cmds: Array<ICMD> = [];
    constructor(name: string) {
        super();
        this.__name = name;
    }
    exec(ctx: TContext): void {
        // throw new Error('Method not implemented.');
        // this.swap(ctx);
        for (let i = 0, len = this.length; i < len; i++) {
            const r = this[i];
            if (r instanceof Rec) {
                r.swap(ctx);
            }
            else {
                r.exec();
            }
        }
    }
    unexec(ctx: TContext): void {
        // throw new Error('Method not implemented.');
        // this.swap(ctx);
        for (let i = this.length - 1; i >= 0; i--) {
            const r = this[i];
            if (r instanceof Rec) {
                r.swap(ctx);
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
        return super.push(...items);
    }
    // pushCMD(...cmds: ICMD[]): void {
    // }
}

export interface ISave4Restore {
    save(): any;
    restore(saved: any): void;
}

export class Repository extends Watchable {
    private __context: TContext;
    private __ah: AtomHandler;
    private __gh: GroupHandler;
    private __trans: Transact[] = [];
    private __index: number = 0;
    private __selection: ISave4Restore;
    // private __data: any;

    constructor(selection: ISave4Restore) {
        super();
        // this.__data = data;
        this.__selection = selection;
        this.__context = new TContext();
        this.__ah = new AtomHandler(this.__context);
        this.__gh = new GroupHandler(this.__context);
        // this.__data = this.makeProxy(data) as any;
    }

    // get data() {
    //     return this.__data;
    // }

    undo() {
        if (!this.canUndo()) {
            return;
        }
        this.__index--;
        this.__context.optiNotify = true;
        this.__trans[this.__index].unexec(this.__context);
        this.__context.fireNotify();
        this.notify();
    }

    redo() {
        if (!this.canRedo()) {
            return;
        }
        this.__context.optiNotify = true;
        this.__trans[this.__index].exec(this.__context);
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
        this.__context.transact.unexec(this.__context);
        this.__context.clearNotify();
    }

    isInTransact() {
        return this.__context.transact !== undefined;
    }

    makeProxy(data: any): any {
        if (isProxy(data)) {
            return data;
        }

        const stack: any[] = [];
        if (isAtom(data)) {
            return new Proxy(data, this.__ah);
        }
        if (isAtomGroup(data)) {
            stack.push(data);
        }
        else {
            throw new Error("Data is Wrong?!");
        }

        while (stack.length > 0) {
            const d = stack.pop();

            // if (d instanceof Document || d instanceof Page) {
            //     d.initRepo(this);
            // }

            if (d instanceof Map) {
                d.forEach((v, k, m) => {
                    if (k.startsWith("__")) {
                        // donothing
                    }
                    else if (isAtom(v)) {
                        m.set(k, isProxy(v) ? v : new Proxy(v, this.__ah));
                    }
                    else if (isAtomGroup(v)) {
                        if (!isProxy(v)) {
                            m.set(k, new Proxy(v, this.__gh));
                            stack.push(v);
                        }
                    }
                    else if (typeof (v) === 'object' && k.startsWith("m_")) { // 还有array set map
                        if (!isProxy(v)) {
                            m.set(k, new Proxy(v, this.__gh));
                            stack.push(v);
                        }
                    }
                    // else if (v instanceof Array && Number.parseInt(k).toString() === k) {// k也可能是1，2，3
                    //     // todo
                    // }
                    else {
                        // todo check
                        // 原生类型
    
                        // if (k.startsWith("m_")) {
                        //     throw new Error("Data is Wrong?!");
                        // }
                    }
                })
            }
            else {
                for (const k in d) {
                    const v = Reflect.get(d, k);
                    if (k.startsWith("__")) {
                        // donothing
                    }
                    else if (isAtom(v)) {
                        Reflect.set(d, k, isProxy(v) ? v : new Proxy(v, this.__ah));
                    }
                    else if (isAtomGroup(v)) {
                        if (!isProxy(v)) {
                            Reflect.set(d, k, new Proxy(v, this.__gh));
                            stack.push(v);
                        }
                    }
                    else if (typeof (v) === 'object' && k.startsWith("m_")) { // 还有array set map
                        if (!isProxy(v)) {
                            Reflect.set(d, k, new Proxy(v, this.__gh));
                            stack.push(v);
                        }
                    }
                    // else if (v instanceof Array && Number.parseInt(k).toString() === k) {// k也可能是1，2，3
                    //     // todo
                    // }
                    else {
                        // todo check
                        // 原生类型

                        // if (k.startsWith("m_")) {
                        //     throw new Error("Data is Wrong?!");
                        // }
                    }
                }
            }
        }
        return new Proxy(data, this.__gh);
    }
}