// 数据被Proxy后，用于判断
// 1、 是否代理对象
// 2、 代理对象与原对象是否相同判断
export class ProxyObject {
    private __this: ProxyObject;
    constructor() {
        this.__this = this;
    }
    get __isProxy() {
        return this !== this.__this;
    }
    get object() {
        return this.__this;
    }
    equals(o: ProxyObject) {
        return this.object === o.object;
    }
}

export class Watchable extends ProxyObject {

    private static __wid = 0;
    static genWId() {
        return this.__wid++;
    }

    private __watcher:Set<((...args: any[]) => void)> = new Set();

    public watch(watcher:((...args: any[]) => void)): (() => void) {
        this.__watcher.add(watcher);
        return watcher;
    }
    public unwatch(watcher:((...args: any[]) => void)): boolean {
        return this.__watcher.delete(watcher);
    }
    public notify(...args: any[]) {
        this.__watcher.forEach(w => {
            w(...args);
        });
    }
}