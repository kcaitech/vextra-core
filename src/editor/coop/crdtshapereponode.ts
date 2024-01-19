import { OpItem } from "coop/common/repo";
import { RepoNode } from "./reponode";
import { OpType } from "../../coop/common/op";

import { Page } from "../../data/page";
import { TreeMoveOp, TreeMoveOpRecord, crdtTreeMove, undoTreeMove } from "../../coop/client/crdt";
import { Shape } from "../../data/shape";
import { importShape } from "./utils";
import { Document } from "../../data/document";

function apply(document: Document, page: Page, op: TreeMoveOp, needUpdateFrame: Shape[]) {

    if (op.data) { // 不管是不是shape都重新生成个新的？// 这有个问题，如果id没变，上层的监听一直在旧shape上
        op.data = importShape(op.data, document);
    }

    let shape = page.getShape(op.id);
    if (shape && shape.parent) { // 旧
        needUpdateFrame.push(shape.parent);
    }

    const ret = crdtTreeMove(page, op);

    shape = shape ?? page.getShape(op.id);
    if (shape) {
        needUpdateFrame.push(shape);
    }

    // todo 迁移notify??或者使用objectid

    return ret;
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
            apply(this.document, this.page, op, needUpdateFrame)
        }
        if (this.localops.length > 0) {
            for (let i = 0; i < this.localops.length; i++) {
                const op = this.localops[i].op as TreeMoveOp;
                apply(this.document, this.page, op, needUpdateFrame)
            }
        }
    }

    processLocal(ops: OpItem[], needApply: boolean, needUpdateFrame: Shape[]): void {
        super.processLocal(ops, needApply, needUpdateFrame);
        if (needApply) { // 在延迟加载page时需要apply
            for (let i = 0; i < ops.length; i++) {
                const op = ops[i].op as TreeMoveOp;
                apply(this.document, this.page, op, needUpdateFrame)
            }
        }
    }
}