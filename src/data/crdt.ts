
import * as classes from "./baseclasses"
import { Basic, BasicArray } from "./basic"

/**
 * crdt table index 
 */
export class CrdtPoint extends Basic implements classes.CrdtPoint {
    typeId = 'crdt-point'
    x: CrdtIndex
    y: CrdtIndex
    constructor(
        x: CrdtIndex,
        y: CrdtIndex
    ) {
        super()
        this.x = x
        this.y = y
    }

    notify(...args: any[]): void { // 这个修改不需要notify
    }
}
/**
 * crdt array index 
 */
export class CrdtIndex extends Basic implements classes.CrdtIndex {
    typeId = 'crdt-index'
    index: BasicArray<number >
    order: number
    constructor(
        index: number[],
        order: number
    ) {
        super()
        this.index = index as any;
        this.order = order
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
    order: number
    constructor(
        id: string,
        order: number
    ) {
        super()
        this.id = id
        this.order = order
    }
}

