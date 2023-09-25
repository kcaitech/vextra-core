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
        name: string
    ) {
        super()
        this.id = id
        this.type = type
        this.name = name
    }
}
