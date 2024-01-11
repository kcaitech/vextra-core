import * as classes from "./baseclasses";
import { CrdtIndex } from "./crdt";
import { Shape, ShapeFrame, ShapeType } from "./shape";
import { Style } from "./style";

// 插入对象时，如果对应的symbol.crdtid，这与此slot绑定，丢弃
// 在移动对象到symbol里时，需要检查里面是否有symbolslot，如果有则丢弃（是否要检查引用的是同一个？）
// 
export class SymbolSlotShape extends Shape implements classes.SymbolSlotShape {
    typeId = 'symbol-slot-shape'
    refId?: string
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
    }
}