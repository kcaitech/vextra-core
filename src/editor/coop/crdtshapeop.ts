
import { OpType } from "../../coop/common/op";
import { Shape } from "../../data/shape";
import { TreeIndex, TreeMoveOp } from "../../coop/client/crdt";

export class CrdtShapeOp implements TreeMoveOp {
    id: string;
    data: Shape | undefined;
    to: TreeIndex | undefined;
    path: string[];
    type: OpType;
    order: number;

    constructor(
        id: string,
        data: Shape | undefined,
        to: TreeIndex | undefined,
        path: string[],
        type: OpType,
        order: number
    ) {
        this.id = id;
        this.data = data;
        this.to = to;
        this.path = path;
        this.type = type;
        this.order = order;
    }
}