import { objectId } from '@/basic/objectid';
import { Document } from './document';
import { Page } from './page';

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

const isAtom = (obj: any): boolean => obj && obj.__iid_b306492ce7b875cf08e206c4109490aa;
const isAtomGroup = (obj: any): boolean => obj && obj.__iid_cdd67eac7c12025695ce30803b43c9cd;

class TContext {
    public transact?: Transact;
    public cache: Map<number, Set<PropertyKey> > = new Map();
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
        if (this.__context.transact === undefined) {
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

        if (this.__context.transact === undefined) {
            // console.warn("NOT inside transact!");
            throw new Error("NOT inside transact!");
        } else {
            if (target instanceof Array && propertyKey === "length" && target.length > value) {
                for (let i = value, len = target.length; i < len; i++) {
                    if (!swapCached(this.__context, target, i)) {
                        const r = new Rec(target, i, target[i]);
                        this.__context.transact.push(r);
                    }
                }
            }
            if (!swapCached(this.__context, target, propertyKey)) {
                const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                this.__context.transact.push(r);
            }
        }
        // todo
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

const isProxy = (obj: any): boolean => obj && obj["__isProxy"];

class Rec {
    private __target: object
    private __propertyKey: PropertyKey
    private __value: any
    constructor(target: object, propertyKey: PropertyKey, value: any) {
        this.__target = target
        this.__propertyKey = propertyKey
        this.__value = value
    }
    swap() {
        const v = Reflect.get(this.__target, this.__propertyKey)
        Reflect.set(this.__target, this.__propertyKey, this.__value);
        this.__value = v;
    }
}

class Transact extends Array<Rec> {
    private __name: string;
    constructor(name: string) {
        super();
        this.__name = name;
    }
    swap() {
        for (let i = this.length - 1; i >= 0; i--) {
            this[i].swap();
        }
    }
    push(...items: Rec[]): number {

        return super.push(...items);
    }
}

export interface ISave4Restore {
    save(): any;
    restore(saved: any): void;
}

export class Repository {
    private __context: TContext;
    private __ah: AtomHandler;
    private __gh: GroupHandler;
    private __trans: Transact[] = [];
    private __index: number = 0;
    private __selection: ISave4Restore;
    // private __data: any;

    constructor(selection: ISave4Restore) {
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
        this.__trans[this.__index].swap();
    }

    redo() {
        if (!this.canRedo()) {
            return;
        }
        this.__trans[this.__index].swap();
        this.__index++;
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
    startTransact(name: string, saved: any) {
        if (this.__context.transact !== undefined) {
            throw new Error();
        }
        this.__context.cache.clear();
        this.__context.transact = new Transact(name);
    }

    /**
     * 
     * @param cmd 最后打包成一个cmd，用于op，也可另外存
     */
    commitTransact(cmd: any) {
        if (this.__context.transact === undefined) {
            throw new Error();
        }
        this.__context.cache.clear();
        this.__trans.length = this.__index;
        this.__trans.push(this.__context.transact);
        this.__index++;
        this.__context.transact = undefined;
    }

    rollbackTransact() {
        if (this.__context.transact === undefined) {
            throw new Error();
        }
        this.__context.cache.clear();
        this.__context.transact.swap();
    }

    isInTransact() {
        return this.__context.transact !== undefined;
    }

    proxy(data: any): any {
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