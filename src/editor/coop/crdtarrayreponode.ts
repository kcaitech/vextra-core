import { Page } from "../../data/page";
import { RepoNode } from "./reponode";
import { OpType } from "../../coop/common/op";
import { OpItem } from "coop/common/repo";

import { CrdtItem, crdtArrayMove } from "../../coop/client/crdt";
import { CrdtArrayMoveOp } from "../../coop/client/crdtarrayop";
import { Shape } from "../../data/shape";

function apply(target: Array<CrdtItem>, op: CrdtArrayMoveOp) {
    return crdtArrayMove(target, op);
}

// fills borders
export class CrdtArrayReopNode extends RepoNode {
    private page: Page;

    constructor(page: Page) {
        super(OpType.CrdtArr);
        this.page = page;
    }

    processRemote(ops: OpItem[], needUpdateFrame: Shape[]): void {
        if (ops.length === 0) return;
        // 直接apply
        this.ops.push(...ops);
        // apply
        const target = this.page.getOpTarget(ops[0].op.path);
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            if (target) apply(target, op.op as CrdtArrayMoveOp);
        }
    }

}