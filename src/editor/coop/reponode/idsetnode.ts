import { Page } from "../../../data/page";
import { RepoNode } from "./reponode";
import { OpType } from "../../../coop/common/op";
import { Basic } from "../../../data/basic";
import { Shape } from "../../../data/shape";
import { IdSetOp } from "../../../coop/client/crdt";
import { LocalOpItem as OpItem } from "../localcmd";

function apply(target: Object, op: IdSetOp) {
    // todo 需要import ? 需要
    let value = op.data;
    if (typeof op.data === 'object') switch (op.data.typeId) {
        // import
    }
    if (typeof value === 'object' && (!(value instanceof Basic))) throw new Error("need import: " + op.data.typeId);
    (target as any)[op.id] = value;
}

export class CrdtIdRepoNode extends RepoNode {
    private page: Page;

    constructor(page: Page) {
        super(OpType.Idset);
        this.page = page;
    }

    processRemote(ops: OpItem[], needUpdateFrame: Shape[]): void {

        if (ops.length === 0) return;

        this.ops.push(...ops);
        
        if (this.localops.length === 0) {
            // 应用最后一个
            const lastop = ops[ops.length - 1];
            const target = this.page.getOpTarget(lastop.op.path);
            // apply lastop
            if (target) apply(target, lastop.op as IdSetOp);
        }
    }

}