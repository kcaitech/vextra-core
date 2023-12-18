import { Basic } from "./basic"
import * as classes from "./baseclasses"
import { VariableType } from "./baseclasses"

export class Variable extends (Basic) implements classes.Variable {
    // watchable 
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
        if (this.__watcher.size > 0) {
            // 在set的foreach内部修改set会导致无限循环
            Array.from(this.__watcher).forEach(w => {
                w(...args);
            });
        }
        this.__parent?.notify("variable");
    }

    typeId = 'variable'
    id: string
    type: VariableType
    name: string
    value: any
    constructor(
        id: string,
        type: VariableType,
        name: string,
        value: any
    ) {
        super()
        this.id = id
        this.type = type
        this.name = name
        this.value = value
    }

    // notify(...args: any[]): void {
    //     super.notify(...args);
    //     this.__parent?.notify("variable");
    // }
}
