import { Op, OpType } from "../../coop/common/op";

export class CrdtIdOp implements Op {
    id: string;
    path: string[];
    type: OpType;
    order: number;
    value: any;

    constructor(id: string, path: string[], order: number, value: any) {
        this.id = id; // attribute id
        this.path = path;
        this.type = OpType.Idset;
        this.order = order;
        this.value = value;
    }
}