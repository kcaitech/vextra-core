
import * as classes from "./baseclasses"
import { Basic, BasicArray } from "./basic"

/**
 * crdt array index 
 */
export class CrdtIndex extends Basic implements classes.CrdtIndex {
    typeId = 'crdt-index'
    index: BasicArray<number>
    order: string
    constructor(
        index?: number[],
        order?: string
    ) {
        super()
        this.index = index instanceof BasicArray ? index : (() => {
            const arr = new BasicArray();
            if (index) arr.push(...index);
            return arr;
        })();
        this.order = order ?? ""
    }

    notify(...args: any[]): void {
    }
}

export class CrdtNumber extends Basic implements classes.CrdtNumber {
    typeId = 'crdt-number'
    id: string
    crdtidx: CrdtIndex
    value: number
    constructor(
        id: string,
        crdtindex: CrdtIndex,
        value: number
    ) {
        super()
        this.id = id
        this.crdtidx = crdtindex
        this.value = value
    }

    notify(...args: any[]): void {
    }
}

export class CrdtId extends Basic implements classes.CrdtId {
    typeId = 'crdt-id'
    id: string
    order: string
    constructor(
        id: string,
        order?: string
    ) {
        super()
        this.id = id
        this.order = order ?? ""
    }
}

