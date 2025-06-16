/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

const __uuid = '8BC00DB1-35BD-1B62-F81F-23E231443680'

export interface Notifiable {
    notify(...args: any[]): void
}

export interface Rollbackable {
    onRollback(from: string): void
}

export function castNotifiable(obj: any): Notifiable | undefined {
    if (obj.__uuid === __uuid) return obj as Notifiable;
}

export function castRollbackable(obj: any): Rollbackable | undefined {
    if (obj.__uuid === __uuid) return obj as Rollbackable;
}

export function isDataBasicType(obj: any): boolean {
    return (obj.__uuid === __uuid);
}

export class Basic {
    protected __uuid = __uuid
    typeId = '';

    protected __parent?: Basic
    __propKey?: string; // this在parent中的属性名
    get parent() {
        return this.__parent;
    }

    notify(...args: any[]): void {
        this.__parent && this.__parent.notify(this.__propKey, ...args);
    }

    onRollback(from: string) { // 非正常事务中，需要清空一些缓存数据
        this.__parent && this.__parent.onRollback(from);
    }

    clone(): Basic {
        throw new Error("not implemented")
    }

    getCrdtPath(): string[] {
        if (!this.__parent) return [];
        if (Array.isArray(this.__parent)) {
            const path = this.__parent.getCrdtPath();
            const id = (this as any).id; // hack
            if (id) path.push(id);
            return path;
        }
        return this.__parent.getCrdtPath().concat(this.__propKey!);
    }

    /**
     * for command
     */
    getOpTarget(path: string[]): any {
        let target = this as any;
        for (let i = 0; i < path.length; i++) {
            const k = path[i];
            if (target instanceof Map) {
                target = target.get(k);
            } else if (target instanceof Array) {
                target = target.find((v) => v.id === k);
            } else {
                target = target[k];
            }
            if (!target) {
                // console.warn("not find target " + k, "path: " + path.join(','))
                return;
            }
            if (target instanceof Basic) {
                return target.getOpTarget(path.slice(i + 1));
            }
        }
        return target;
    }
}

export class BasicArray<T> extends Array<T> {
    protected __uuid = __uuid
    protected typeId = 'array';

    protected __parent?: Basic // 由DataGuard设置
    __propKey?: string; // this在parent中的属性名
    get parent() {
        return this.__parent;
    }

    notify(...args: any[]): void {
        this.__parent && this.__parent.notify(this.__propKey, ...args);
    }

    onRollback(from: string) { // 非正常事务中，需要清空一些缓存数据
        this.__parent && this.__parent.onRollback(from);
    }

    getCrdtPath(): string[] {
        if (this.__parent) return this.__parent.getCrdtPath().concat(this.__propKey!);
        else return [];
    }
}

export class BasicMap<T0, T1> extends Map<T0, T1> {
    protected __uuid = __uuid
    protected typeId = 'map';


    protected __parent?: Basic
    __propKey?: string; // this在parent中的属性名
    get parent() {
        return this.__parent;
    }

    notify(...args: any[]): void {
        this.__parent && this.__parent.notify(this.__propKey, ...args);
    }

    onRollback(from: string) { // 非正常事务中，需要清空一些缓存数据
        this.__parent && this.__parent.onRollback(from);
    }

    getCrdtPath(): string[] {
        if (this.__parent) return this.__parent.getCrdtPath().concat(this.__propKey!);
        else return [];
    }

    toJSON() {
        const ret: any = {}
        for (let [k, v] of this) {
            ret[k] = v;
        }
        return ret;
    }
}

export interface IWatchable {
    watch(watcher: ((...args: any[]) => void)): (() => void)

    unwatch(watcher: ((...args: any[]) => void)): boolean
}

export class WatchableObject extends Basic implements Notifiable, IWatchable {
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

export interface IDataGuard {
    guard(data: any): any
}

const TIME_OUT = 1000 * 60 // 1分钟
export class ResourceMgr<T> extends WatchableObject {
    private __resource = new Map<string, T>()
    private __loader?: (id: string) => Promise<T>
    private __updater?: (data: T) => void;
    private __guard?: (data: T) => T;
    private __loading: Map<string, {
        id: string,
        timeout: number,
        resolves: ((v: T | undefined) => void)[],
        rejects: ((e?: any) => void)[],
        maxRepeatCount: number;
    }> = new Map();
    private __crdtpath: string[];

    constructor(crdtpath: string[], guard?: (data: T) => T) {
        super();
        this.__guard = guard;
        this.__crdtpath = crdtpath;
    }

    getCrdtPath(): string[] {
        return this.__crdtpath;
    }

    get size() {
        return this.__resource.size;
    }

    get keys() {
        return Array.from(this.__resource.keys());
    }

    has(key: string) {
        return this.__resource.has(key);
    }

    delete(key: string) {
        return this.__resource.delete(key);
    }

    get resource() {
        return Array.from(this.__resource.values());
    }

    async get(id: string): Promise<T | undefined> {
        let r = this.__resource.get(id);
        if (r) return r;

        let loading = this.__loading.get(id)
        if (!loading) {
            loading = {
                id,
                timeout: Date.now() + TIME_OUT,
                resolves: [],
                rejects: [],
                maxRepeatCount: 0
            }
            this.__loading.set(id, loading);
        } else if (loading.timeout > Date.now()) {
            return new Promise<T | undefined>((resolve, reject) => {
                loading?.resolves.push(resolve)
                loading?.rejects.push(reject)
            })
        } else {
            // 重新加载
            loading.timeout = Date.now() + TIME_OUT;
        }

        if (this.__loader && loading.maxRepeatCount < 10) {
            try {
                const __r = await this.__loader(id);
                if (__r) r = __r;
            } catch (e) {
                loading.maxRepeatCount++;
                console.error(e)
            }
        }

        if (r) r = this.add(id, r)

        loading.resolves.forEach((v) => v(r));
        this.__loading.delete(loading.id);

        return r
    }

    setLoader(loader?: (id: string) => Promise<T>) {
        this.__loader = loader;
    }

    setUpdater(updater: (data: T) => void) {
        this.__updater = updater;
    }

    getSync(id: string): T | undefined {
        return this.__resource.get(id)
    }

    add(id: string, r: T) {
        r = this.__guard && this.__guard(r) || r
        this.__resource.set(id, r);
        if (this.__updater) this.__updater(r);
        this.notify(id);
        return r;
    }

    forEach(callback: (v: T, k: string) => void) {
        this.__resource.forEach((_v, _k) => {
            callback(_v, _k)
        })
    }
}
