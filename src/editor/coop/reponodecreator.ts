import { Op, OpType } from "../../coop/common/op";
import { RepoNode } from "./reponode";

export function reponodecreator(op: Op, path: string[]): RepoNode {
    // todo
    // 中间节点怎么判断类型？
    // shape操作
    if (path.length > 1) {
        return new RepoNode();
    }
    switch (op.type) {
        case OpType.None:
            throw new Error('unknown op.type');
        case OpType.Array:
        case OpType.Idset:
        case OpType.Table:
        case OpType.CrdtArr:
        case OpType.CrdtTree:
            break;
        default:
            throw new Error('unknown op.type');
    }
    throw new Error('not implemented');
}