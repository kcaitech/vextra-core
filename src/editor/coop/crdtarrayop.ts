import { CrdtIndex } from "../../data/crdt";
import { OpType } from "../../coop/common/op";
import { ArrayMoveOp, CrdtItem } from "../../coop/client/crdt";

export class CrdtArrayMoveOp implements ArrayMoveOp {
    id: string;
    path: string[];
    type: OpType;
    order: number;
    data: CrdtItem | undefined;
    to: CrdtIndex | undefined; // undefined表示不在列表里
    constructor(
        id: string,
        path: string[],
        type: OpType,
        order: number,
        data: CrdtItem | undefined,
        to: CrdtIndex | undefined
    ) {
        this.id = id
        this.path = path
        this.type = type
        this.order = order
        this.data = data
        this.to = to
    }
}
