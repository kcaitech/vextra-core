
import * as classes from "./baseclasses"
import { Basic, BasicArray } from "./basic"
/**
 * crdt table index 
 */
export class CrdtIndex2 extends Basic implements classes.CrdtIndex2 {
    typeId = 'crdt-index2'
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
    index?: BasicArray<number >
    order: number
    uid: string
    constructor(
        order: number,
        uid: string
    ) {
        super()
        this.order = order
        this.uid = uid
    }

    notify(...args: any[]): void {
    }
}