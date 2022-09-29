
export class Watchable {
    private m_watcher:Set<((...args: any[]) => void)> = new Set();

    public watch(watcher:((...args: any[]) => void)): (() => void) {
        this.m_watcher.add(watcher);
        return watcher;
    }
    public unwatch(watcher:((...args: any[]) => void)): boolean {
        return this.m_watcher.delete(watcher);
    }
    public notify(...args: any[]) {
        this.m_watcher.forEach(w => {
            w(...args);
        });
    }
}