import { Page } from "../../data/page";
import { RepoNode } from "../../coop/client/reponode";
import { OpType } from "../../coop/common/op";
import { OpItem } from "../../coop/common/repo";
import { CrdtIdOp } from "../../coop/client/crdtidop";

import { Basic } from "data/basic";

function apply(target: Object, op: CrdtIdOp) {
    // todo 需要import ? 需要
    let value = op.value;
    if (typeof op.value === 'object') switch (op.value.typeId) {
        // import
    }
    if (typeof value === 'object' && (!(value instanceof Basic))) throw new Error("need import: " + op.value.typeId);
    (target as any)[op.id] = value;
}

export class CrdtIdRepoNode extends RepoNode {
    private page: Page;

    constructor(page: Page) {
        super(OpType.Idset);
        this.page = page;
    }

    processRemote(ops: OpItem[]): void {

        if (ops.length === 0) return;

        this.ops.push(...ops);
        
        if (this.localops.length === 0) {
            // 应用最后一个
            const lastop = ops[ops.length - 1];
            const target = this.page.getOpTarget(lastop.op.path);
            // apply lastop
            if (target) apply(target, lastop.op as CrdtIdOp);
        }
    }

}