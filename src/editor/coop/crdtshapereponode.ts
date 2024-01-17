import { OpItem } from "coop/common/repo";
import { RepoNode } from "./reponode";
import { OpType } from "../../coop/common/op";

import { Page } from "../../data/page";
import { TreeMoveOp, TreeMoveOpRecord, crdtTreeMove, undoTreeMove } from "../../coop/client/crdt";
import { Shape } from "../../data/shape";
import { importShape } from "./utils";
import { Document } from "../../data/document";

function apply(page: Page, op: TreeMoveOp) {
    // todo op data 需要import??
    return crdtTreeMove(page, op);
}

function unapply(page: Page, op: TreeMoveOpRecord) {
    return undoTreeMove(page, op);
}

export class CrdtShapeRepoNode extends RepoNode {
    private document: Document;
    private page: Page;

    constructor(document: Document, page: Page) {
        super(OpType.CrdtTree);
        this.document = document;
        this.page = page;
    }

    // 这是个page节点
    processRemote(ops: OpItem[], needUpdateFrame: Shape[]): void {
        if (ops.length === 0) return;
        this.ops.push(...ops);
        // 先undo local
        if (this.localops.length > 0) {
            for (let i = this.localops.length - 1; i >= 0; i--) {
                unapply(this.page, this.localops[i].op as TreeMoveOpRecord)
            }
        }
        // apply remote
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i].op as TreeMoveOp;
            if (op.data) {
                op.data = importShape(op.data, this.document);
                // needUpdateFrame.push(op.data as Shape);
            }

            apply(this.page, op)
        }
        if (this.localops.length > 0) {
            for (let i = 0; i < this.localops.length; i++) {
                apply(this.page, this.localops[i].op as TreeMoveOp)
            }
        }
    }
}