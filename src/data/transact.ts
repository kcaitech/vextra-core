/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { objectId } from '../basic/objectid';
import { castNotifiable, castRollbackable, IDataGuard, isDataBasicType, Notifiable, WatchableObject } from './basic';

// map 对象record
interface MapRec {
    isContentExist: boolean // 元素是否在map对象身上
    key: any // 键
    content: any // 值
}

export class TContext {
    public transact?: Transact;
    public cache: Map<number, Set<PropertyKey>> = new Map();
    private __notifys: Map<number, { target: Notifiable, keys: Set<PropertyKey> }> = new Map();
    public optiNotify: boolean = true;
    settrap: boolean = true;
    addNotify(target: Notifiable | undefined, key: PropertyKey) {
        if (!target) {
            //
        }
        else if (this.optiNotify) {
            const id = objectId(target);
            let item = this.__notifys.get(id);
            if (!item) {
                this.__notifys.set(id, { target, keys: new Set([key]) })
            } else {
                item.keys.add(key);
            }
        }
        else {
            target.notify(key);
        }
    }
    fireNotify() {
        this.__notifys.forEach((n) => {
            n.target.notify(...n.keys);
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
    protected __context: TContext;
    private __getter?: (target: object, propertyKey: PropertyKey, receiver?: any) => any
    constructor(context: TContext) {
        this.__context = context;
    }
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any) {

        if (propertyKey.toString().startsWith('__')) {
            if (propertyKey === '__getter') {
                this.__getter = value
                return true
            }
            return Reflect.set(target, propertyKey, value, receiver);
        }
        if (this.__context.transact === undefined) {
            throw new Error(`NOT inside transact: set '${propertyKey.toString()}'`);
        }
        if (this.__context.settrap) {
            throw new Error(`NOT inside Api: set '${propertyKey.toString()}'`);
        }

        let needNotify = false;
        if (!(target instanceof Array)) {
            needNotify = true;
            if (!swapCached(this.__context, target, propertyKey)) {
                const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                this.__context.transact.push(r);
            }
        }
        else if (propertyKey === "length") { // array
            if (target.length > value) {
                // delete
                for (let i = value, len = target.length; i < len; i++) {
                    const a = target[i];
                    if (!a) continue;
                    if (!swapCached(this.__context, target, i)) {
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
        } else { // array
            needNotify = true;
            if (!swapCached(this.__context, target, propertyKey)) {
                const saveLen = target.length;
                const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
                this.__context.transact.push(r);

                checkSetParent(value, target, this.__context, propertyKey);
                value = deepProxy(value, this.__context);

                const ret = Reflect.set(target, propertyKey, value, receiver);

                this.__context.addNotify(castNotifiable(target), propertyKey);

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

        checkSetParent(value, target, this.__context, propertyKey);
        value = deepProxy(value, this.__context);

        const ret = Reflect.set(target, propertyKey, value, receiver);
        if (needNotify) {
            this.__context.addNotify(castNotifiable(target), propertyKey);
        }
        return ret;
    }
    deleteProperty(target: object, propertyKey: PropertyKey) {
        if (propertyKey.toString().startsWith("__")) {
            return Reflect.deleteProperty(target, propertyKey);
        }
        if (this.__context.transact === undefined) {
            throw new Error(`NOT inside transact: delete '${propertyKey.toString()}'`);
        }
        if (this.__context.settrap) {
            throw new Error(`NOT inside Api: delete '${propertyKey.toString()}'`);
        }
        if (!swapCached(this.__context, target, propertyKey)) {
            const r = new Rec(target, propertyKey, Reflect.get(target, propertyKey));
            this.__context.transact.push(r);
        }
        const result = Reflect.deleteProperty(target, propertyKey);
        this.__context.addNotify(castNotifiable(target), propertyKey);
        return result;
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        if (!(target instanceof Map)) {
            const val = Reflect.get(target, propertyKey, receiver);
            if (val === undefined && propertyKey === "__isProxy") {
                return true;
            }
            if (this.__getter) {
                return this.__getter(target, propertyKey, receiver)
            }
            return val;
        }

        // map对象上的属性和方法都会进入get
        if (propertyKey === 'get') { // 高频操作，单独提出并置顶，提高响应速度
            return Reflect.get(target, propertyKey, receiver).bind(target);
        } else if (propertyKey === 'set' || propertyKey === 'delete') { // 需要进入事务的方法
            if (this.__context.transact === undefined) { // 二级处理中有对底层数据的修改，所以应该在事务内进行
                throw new Error(`NOT inside transact: set '${propertyKey.toString()}'`);
            }
            if (this.__context.settrap) {
                throw new Error(`NOT inside Api: set '${propertyKey.toString()}'`);
            }
            return Reflect.get(this.sub(this.__context, target, this.__context), propertyKey);
        } else if (propertyKey === 'size') { // map对象上唯一的一个可访问属性
            return target.size;
        } else if (propertyKey === 'clear') { // todo clear操作为批量删除，也需要进入事务
            return false;
        } else { // 其他操作，get、values、has、keys、forEach、entries，不影响数据
            const val = Reflect.get(target, propertyKey, receiver);
            if (val === undefined) {
                if (propertyKey === "__isProxy") {
                    return true;
                }
            } else if (typeof val === 'function') {
                return val.bind(target);
            }
            return val;
        }
    }
    has(target: object, propertyKey: PropertyKey) {
        if (target instanceof Map) {
            return target.has(propertyKey);
        }
        const val = Reflect.has(target, propertyKey);
        return val;
    }
    sub(_con: TContext, target: Map<any, any>, context: TContext) {
        return {
            get(key: any) {
                const get = Map.prototype.get.bind(target);
                return get(key);
            },
            set(key: any, value: any) {
                const set_inner = Map.prototype.set.bind(target);

                checkSetParent(value, target, context, key);
                value = deepProxy(value, context);
                set_inner(key, value);
                const map_rec: MapRec = { isContentExist: true, content: value, key };
                const r = new Rec(target, 'set', map_rec);
                _con.transact?.push(r);
                _con.addNotify(castNotifiable(target), key);
            },
            delete(key: any) {
                const get = Map.prototype.get.bind(target);
                const ori = get(key)
                const delete_inner = Map.prototype.delete.bind(target);
                delete_inner(key);
                const map_rec: MapRec = { isContentExist: false, content: ori, key };
                const r = new Rec(target, 'delete', map_rec);
                _con.transact?.push(r);
                _con.addNotify(castNotifiable(target), key);
            }
        };
    }
}

export const isProxy = (obj: any): boolean => obj && obj["__isProxy"];

function checkSetParent(value: any, parent: any, context: TContext, propertyKey: PropertyKey) {
    if (typeof value === 'object' && isDataBasicType(parent)) {
        // parent 也需要proxy上, 否则数据变动时不会触发通知
        value.__parent = isProxy(parent) ? parent : new Proxy(parent, new ProxyHandler(context));
        value.__propKey = propertyKey; // 这有个问题是，数组
    }
}

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
        if (this.__target instanceof Map) {
            if (this.__propertyKey === 'set' || this.__propertyKey === 'delete') {
                if (this.__value.isContentExist) {
                    this.__target.delete(this.__value.key);
                } else {
                    this.__target.set(this.__value.key, this.__value.content);
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
                    checkSetParent(this.__value, this.__target, ctx, this.__propertyKey);
                    Reflect.set(this.__target, this.__propertyKey, this.__value);
                }
            } else {
                checkSetParent(this.__value, this.__target, ctx, this.__propertyKey);
                Reflect.set(this.__target, this.__propertyKey, this.__value);
            }
            this.__value = v;
        }
        ctx.addNotify(castNotifiable(this.__target), this.__propertyKey);
    }
    get target() {
        return this.__target;
    }
    get propertyKey() {
        return this.__propertyKey;
    }
    get value() {
        return this.__value;
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

    swap(ctx: TContext): void {
        const len = Reflect.get(this.target, "length")
        for (let i = 0, l = this.__recs.length; i < l; i++) {
            this.__recs[i].swap(ctx);
        }
        if (this.__haslen) {
            Reflect.set(this.target, "length", this.__len);
            this.__len = len;
        }
    }
}

class Transact extends Array<Rec> {
    private __name: string;
    private __cache: Map<number, ArrayRec> = new Map();
    constructor(name: string) {
        super();
        this.__name = name;
    }
    get name () {
        return this.__name;
    }
    exec(ctx: TContext): void {
        for (let i = 0, len = this.length; i < len; i++) {
            const r = this[i];
            r.swap(ctx);
        }
    }
    unexec(ctx: TContext): void {
        for (let i = this.length - 1; i >= 0; i--) {
            const r = this[i];
            r.swap(ctx);
        }
    }
    rollback(ctx: TContext, from: string): void {
        for (let i = this.length - 1; i >= 0; i--) {
            const r = this[i];
            r.swap(ctx);
            const rb = castRollbackable(r.target);
            if (rb) {
                rb.onRollback(from);
            }
        }
    }
    push(...items: Rec[]): number {
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
    }
}

export class TransactDataGuard extends WatchableObject implements IDataGuard {
    private __context: TContext;
    // private __ph: ProxyHandler;
    private __trans: Transact[] = [];
    private __index: number = 0;

    constructor(settrap?: boolean ) {
        super();
        this.__context = new TContext();
        // this.__ph = new ProxyHandler(this.__context);
        this.__context.settrap = settrap ?? true; // default true
    }
    get transactCtx() {
        return this.__context;
    }

    undo() {
        if (!this.canUndo()) {
            return false;
        }
        this.__index--;
        this.__context.optiNotify = true;
        this.__trans[this.__index].unexec(this.__context);
        this.__context.fireNotify();
        this.notify();
        return true;
    }

    redo() {
        if (!this.canRedo()) {
            return false;
        }
        this.__context.optiNotify = true;
        this.__trans[this.__index].exec(this.__context);
        this.__index++;
        this.__context.fireNotify();
        this.notify();
        return true;
    }

    canUndo() {
        return this.__index > 0;
    }

    canRedo() {
        return this.__index < this.__trans.length;
    }

    private __saveStartStack?: Error; // 用于记录开始了事务的地方
    /**
     *
     * @param name
     * @param saved selection等
     */
    start(name: string) {
        if (this.__context.transact !== undefined) {
            throw new Error(`has transact not committed：${this.__context.transact.name}`);
        }
        this.__saveStartStack = new Error();
        this.__context.optiNotify = true;
        this.__context.cache.clear();
        this.__context.transact = new Transact(name);
    }

    /**
     *
     * @param cmd 最后打包成一个cmd，用于op，也可另外存
     */
    _commit(stack: boolean) {
        if (this.__context.transact === undefined) {
            throw new Error("No transace neet commit");
        }
        this.__context.cache.clear();
        this.__trans.length = this.__index;
        if (stack) {
            this.__trans.push(this.__context.transact);
            this.__index++;
        }
        this.__saveStartStack = undefined;
        this.__context.transact = undefined;
        this.__context.fireNotify();
        this.notify();
    }

    commit(stack: boolean = false) {
        this._commit(stack)
    }

    rollback(from: string = "") {
        if (this.__context.transact === undefined) {
            throw new Error();
        }
        this.__context.cache.clear();
        this.__context.transact.rollback(this.__context, from);
        this.__context.transact = undefined;
        this.__context.fireNotify();
    }

    isInTransact() {
        return this.__context.transact !== undefined;
    }

    guard(data: any): any {
        return deepProxy(data, this.__context);
    }
    isGuarded(data: any): boolean {
        return typeof data === 'object' && isProxy(data);
    }
}

function deepProxy(data: any, context: TContext): any {
    if (typeof data !== 'object' || isProxy(data)) {
        return data;
    }
    const stack: any[] = [data];
    while (stack.length > 0) {
        const d = stack.pop();
        let parent: any = undefined;
        if (isDataBasicType(d)) { // 当一个map对象为BasicMap对象时，其才能成为自身values集元素的__parent;
            parent = isProxy(d) ? d : new Proxy(d, new ProxyHandler(context));
        }
        if (d instanceof Map) {
            d.forEach((v, k, m) => {
                if (k.toString().startsWith("__")) {
                    // donothing
                }
                else if (v && typeof (v) === 'object') { // 还有array set map
                    if (parent) {
                        v.__parent = parent;
                        v.__propKey = k;
                    }
                    if (!isProxy(v)) {
                        m.set(k, new Proxy(v, new ProxyHandler(context)));
                        stack.push(v);
                    }
                }
            })
        }
        else {
            for (const k in d) {
                const v = Reflect.get(d, k);
                if (k.toString().startsWith("__")) {
                    // donothing
                }
                // todo 看一下什么场景下会出现null的属性值
                else if (v && typeof (v) === 'object') { // 还有array set map
                    if (parent) {
                        v.__parent = parent;
                        v.__propKey = k;
                    }
                    if (!isProxy(v)) {
                        const p = new Proxy(v, new ProxyHandler(context));
                        Reflect.set(d, k, p);
                        stack.push(v);
                    }
                }
            }
        }
    }
    return new Proxy(data, new ProxyHandler(context));
}
