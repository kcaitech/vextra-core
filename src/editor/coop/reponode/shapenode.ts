import { Op, OpType } from "../../../coop/common/op";
import { Page } from "../../../data/page";
import { TreeMoveOp, TreeMoveOpRecord, crdtTreeMove, undoTreeMove } from "../../../coop/client/crdt";
import { Shape } from "../../../data/shape";
import { importShape } from "../utils";
import { Document } from "../../../data/document";
import { RepoNode } from "./base";
import { Cmd, OpItem } from "../../../coop/common/repo";

function apply(document: Document, page: Page, op: TreeMoveOp, needUpdateFrame: Shape[]) {

    if (op.data) { // todo 不管是不是shape都重新生成个新的？// 这有个问题，如果id没变，上层的监听一直在旧shape上
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

    receive(ops: OpItem[], needUpdateFrame: Shape[]) {
        if (ops.length === 0) throw new Error();

        // undo-do-redo
        // undo
        for (let i = this.localops.length - 1; i >= 0; i--) {
            const op = this.localops[i];
            unapply(this.page, op.op as TreeMoveOpRecord);
        }

        // do
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const record = apply(this.document, this.page, op.op as TreeMoveOp, needUpdateFrame);
            if (record) {
                // replace op
                op.op = record;
                const idx = op.cmd.ops.indexOf(op.op);
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, record);
            }
        }
        this.ops.push(...ops);

        // redo
        for (let i = 0; i < this.localops.length; i++) {
            const op = this.localops[i];
            const record = apply(this.document, this.page, op.op as TreeMoveOpRecord, needUpdateFrame);
            if (record) {
                // replace op
                op.op = record;
                const idx = op.cmd.ops.indexOf(op.op);
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, record);
            }
        }
    }
    receiveLocal(ops: OpItem[]) {
        if (ops.length === 0) throw new Error();
        if (ops.length > this.localops.length) throw new Error();
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const op2 = this.localops.shift();
            // check
            if (op.cmd.id !== op2?.cmd.id) throw new Error("op not match");
            this.ops.push(op2);
        }
    }
    commit(ops: OpItem[]) {
        this.localops.push(...ops);
    }
    popLocal(ops: OpItem[]) {
        // check
        if (this.localops.length < ops.length) throw new Error();
        for (let i = ops.length - 1; i >= 0; i--) {
            const op = ops[i];
            const op2 = this.localops.pop();
            // check
            if (op.cmd !== op2?.cmd) throw new Error("op not match");
        }
    }
    dropOps(ops: OpItem[]): void {
    }
    
    undo(ops: OpItem[], needUpdateFrame: Shape[], receiver?: Cmd) {
        // check
        if (ops.length === 0) throw new Error();
        const target = this.page;
        const saveops: Op[] | undefined = (!receiver) ? ops.map(op => op.op) : undefined;
        for (let i = ops.length - 1; i >= 0; i--) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
            const record: TreeMoveOpRecord | undefined = target && unapply(target, ops[i].op as TreeMoveOpRecord);
            if (record) ops[i].op = record;
        }

        if (receiver) {
            if (target) this.commit((ops.map(item => {
                receiver.ops.push(item.op);
                return { op: item.op, cmd: receiver }
            })))
        } else {
            this.popLocal(ops);
            // replace op
            for (let i = 0; i < ops.length; i++) {
                const op = ops[i];
                const saveop = saveops![i];
                const idx = op.cmd.ops.indexOf(saveop);
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, op.op);
            }
        }
    }

    redo(ops: OpItem[], needUpdateFrame: Shape[], receiver?: Cmd) {
        // check
        if (ops.length === 0) throw new Error();
        ops.reverse();
        const target = this.page;
        const saveops: Op[] | undefined = (!receiver) ? ops.map(op => op.op) : undefined;
        for (let i = ops.length - 1; i >= 0; i--) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
            const record: TreeMoveOpRecord | undefined = target && unapply(target, ops[i].op as TreeMoveOpRecord);
            if (record) ops[i].op = record;
        }

        if (receiver) {
            if (target) this.commit((ops.map(item => {
                receiver.ops.push(item.op);
                return { op: item.op, cmd: receiver }
            })))
        } else {
            // replace op
            for (let i = 0; i < ops.length; i++) {
                const op = ops[i];
                const saveop = saveops![i];
                const idx = op.cmd.ops.indexOf(saveop);
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, op.op);
            }
            this.commit(ops);
        }
    }
    roll2Version(baseVer: number, version: number, needUpdateFrame: Shape[]) {
        if (baseVer > version) throw new Error();
        // search and apply
        const ops = this.ops.concat(...this.localops);
        if (ops.length === 0) return;

        let baseIdx = ops.findIndex((op) => op.cmd.version > baseVer);
        let verIdx = ops.findIndex((op) => op.cmd.version > version);

        if (baseIdx < 0) baseIdx = 0;
        if (verIdx < 0) verIdx = ops.length;
        for (let i = baseIdx; i < verIdx; i++) {
            const op = ops[i];
            const record = apply(this.document, this.page, op.op as TreeMoveOp, needUpdateFrame);
            if (record) {
                // replace op
                op.op = record;
                const idx = op.cmd.ops.indexOf(op.op);
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, record);
            }
        }
    }
}