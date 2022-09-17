
export class Watchable {
    private m_watcher:Set<(() => void)> = new Set();

    public watch(watcher:(() => void)): (() => void) {
        this.m_watcher.add(watcher);
        return watcher;
    }
    public unwatch(watcher:(() => void)): boolean {
        return this.m_watcher.delete(watcher);
    }
    public notify() {
        this.m_watcher.forEach(w => {
            w();
        });
    }
}