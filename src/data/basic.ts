
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
    get parent() {
        return this.__parent;
    }

    notify(...args: any[]): void {
        this.__parent && this.__parent.notify(this.typeId, ...args);
    }

    onRollback(from: string) { // 非正常事务中，需要清空一些缓存数据
        this.__parent && this.__parent.onRollback(from);
    }

    clone(): Basic {
        throw new Error("not implemented")
    }
}

export class BasicArray<T> extends Array<T> {
    protected __uuid = __uuid
    protected typeId = 'array';

    protected __parent?: Basic // 由DataGuard设置
    get parent() {
        return this.__parent;
    }
    notify(...args: any[]): void {
        this.__parent && this.__parent.notify(this.typeId, ...args);
    }
    setTypeId(typeId: string) {
        this.typeId = typeId;
    }
    onRollback(from: string) { // 非正常事务中，需要清空一些缓存数据
        this.__parent && this.__parent.onRollback(from);
    }
}

export class BasicMap<T0, T1> extends Map<T0, T1> {
    protected __uuid = __uuid
    protected typeId = 'map';

    protected __parent?: Basic
    get parent() {
        return this.__parent;
    }

    notify(...args: any[]): void {
        this.__parent && this.__parent.notify(this.typeId, ...args);
    }
    onRollback(from: string) { // 非正常事务中，需要清空一些缓存数据
        this.__parent && this.__parent.onRollback(from);
    }
}

// @deprecated 这个用法导致语法检查失效
// type Constructor<T = Record<string, any>> = new (...args: any[]) => T;
// export const Watchable = <T extends Constructor>(SuperClass: T) =>
//     class extends SuperClass implements Notifiable {
//         public __uuid = __uuid
//         public __watcher: Set<((...args: any[]) => void)> = new Set();
//         public watch(watcher: ((...args: any[]) => void)): (() => void) {
//             this.__watcher.add(watcher);
//             return () => {
//                 this.__watcher.delete(watcher);
//             };
//         }
//         public unwatch(watcher: ((...args: any[]) => void)): boolean {
//             return this.__watcher.delete(watcher);
//         }
//         public notify(...args: any[]) {
//             if (this.__watcher.size === 0) return;
//             // 在set的foreach内部修改set会导致无限循环
//             Array.from(this.__watcher).forEach(w => {
//                 w(...args);
//             });
//         }
//     }

export class WatchableObject extends Basic implements Notifiable {
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

export interface ISave4Restore {
    save(): any;
    restore(saved: any): void;
}

export interface IDataGuard {
    guard(data: any): any
}

const TIME_OUT = 1000 * 60 // 1分钟
export class ResourceMgr<T> extends WatchableObject {
    private __resource = new Map<string, T>()
    private __loader?: (id: string) => Promise<T>
    private __updater?: (data: T) => void;
    private __guard?: IDataGuard;
    private __loading: Map<string, {
        id: string,
        timeout: number,
        resolves: ((v: T | undefined) => void)[],
        rejects: ((e?: any) => void)[]
    }> = new Map();

    constructor(guard?: IDataGuard) {
        super();
        // this.__loader = loader;
        this.__guard = guard;
    }
    get size() {
        return this.__resource.size;
    }
    get keys() {
        return Array.from(this.__resource.keys());
    }
    get resource() {
        return Array.from(this.__resource.values());
    }
    async get(id: string): Promise<T | undefined> {
        let r = this.__resource.get(id)
        if (r) return r;

        let loading = this.__loading.get(id)
        if (!loading) {
            loading = {
                id,
                timeout: Date.now() + TIME_OUT,
                resolves: [],
                rejects: []
            }
            this.__loading.set(id, loading);
        }
        else if (loading.timeout > Date.now()) {
            return new Promise<T | undefined>((resolve, reject) => {
                loading?.resolves.push(resolve)
                loading?.rejects.push(reject)
            })
        }
        else {
            // 重新加载
            loading.timeout = Date.now() + TIME_OUT;
        }

        r = this.__loader && await this.__loader(id)
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
        r = this.__guard && this.__guard.guard(r) || r
        this.__resource.set(id, r);
        if (this.__updater) this.__updater(r);
        this.notify();
        return r;
    }
}
