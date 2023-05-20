
const __uuid = '8BC00DB1-35BD-1B62-F81F-23E231443680'

export interface Notifiable {
    notify(...args: any[]): void
}

export function castNotifiable(obj: any): Notifiable | undefined {
    if (obj.__uuid === __uuid) return obj as Notifiable;
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
}

type Constructor<T = Record<string, any>> = new (...args: any[]) => T;

export const Watchable = <T extends Constructor>(SuperClass: T) =>
    class extends SuperClass implements Notifiable {
        protected __uuid = __uuid
        private __watcher: Set<((...args: any[]) => void)> = new Set();

        public watch(watcher: ((...args: any[]) => void)): (() => void) {
            this.__watcher.add(watcher);
            return watcher;
        }
        public unwatch(watcher: ((...args: any[]) => void)): boolean {
            return this.__watcher.delete(watcher);
        }
        public notify(...args: any[]) {
            this.__watcher.forEach(w => {
                w(...args);
            });
        }
    }

export interface ISave4Restore {
    save(): any;
    restore(saved: any): void;
}

export interface IDataGruad {
    guard(data: any): any
}

const TIME_OUT = 1000 * 60 // 1分钟
export class ResourceMgr<T> extends Watchable(Object) {
    private __resource = new Map<string, T>()
    private __loader?: (id: string) => Promise<T>
    private __guard?: IDataGruad;
    private __loading: Map<string, {
        id: string,
        timeout: number,
        resolves: ((v: T | undefined) => void)[],
        rejects: ((e?: any) => void)[]
    }> = new Map();

    constructor(guard?: IDataGruad) {
        super();
        // this.__loader = loader;
        this.__guard = guard;
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
        else if (loading.timeout < Date.now()) {
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
    getSync(id: string): T | undefined {
        return this.__resource.get(id)
    }
    add(id: string, r: T) {
        r = this.__guard && this.__guard.guard(r) || r
        this.__resource.set(id, r);
        this.notify();
        return r;
    }
}
