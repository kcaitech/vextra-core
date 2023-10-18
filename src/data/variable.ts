import { Basic, Watchable } from "./basic"
import * as classes from "./baseclasses"
import { VariableType } from "./baseclasses"

export class Variable extends Watchable(Basic) implements classes.Variable {
    typeId = 'variable'
    id: string
    type: VariableType
    name: string
    value?: any
    constructor(
        id: string,
        type: VariableType,
        name: string,
        value?: any
    ) {
        super()
        this.id = id
        this.type = type
        this.name = name
        this.value = value
    }

    notify(...args: any[]): void {
        super.notify(...args);
        this.__parent?.notify("vairable");
    }
}
