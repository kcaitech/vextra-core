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