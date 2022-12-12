export interface IBubblable {
    bubbleup(...args: any[]): void;
}

export class Notifiable {
    public notify(...args: any[]): void {}
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