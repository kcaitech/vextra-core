/*
 * @LastEditors: Zrx georgezrx@163.com
 * @LastEditTime: 2023-03-02 14:11:24
 * @FilePath: \kcdesign\src\data\basic.ts
 */
export interface IBubblable {
    bubbleup(...args: any[]): void;
}

export class Notifiable {
    public notify(...args: any[]): void {}
}

export class DefaultNotifiable extends Notifiable {
    protected __parent: Notifiable | undefined;
    private __defaultargs: any;

    constructor(defaultargs?: any) {
        super();
        this.__defaultargs = defaultargs;
    }

    notify(...args: any[]): void {
        // throw new Error("Method not implemented.");
        this.__parent && (
            this.__defaultargs && this.__parent.notify(this.__defaultargs, ...args) || 
            this.__parent.notify(...args));
    }
    set parent(p: Notifiable) {
        if (this.__parent !== undefined) {
            throw new Error("")
        }
        this.__parent = p;
    }
}

export class Watchable extends Notifiable {

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

export class NotifyArray<T> extends Array<T> implements Notifiable {
    private __notifyup: Notifiable | undefined;
    constructor(notifyup?: Notifiable) {
        super();
        this.__notifyup = notifyup;
    }
    public notify(...args: any[]): void {
        if (this.__notifyup) this.__notifyup.notify(...args);
    }

}