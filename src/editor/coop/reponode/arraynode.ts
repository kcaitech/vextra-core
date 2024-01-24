import { Page } from "../../../data/page";
import { OpType } from "../../../coop/common/op";
import { ArrayMoveOp, ArrayMoveOpRecord, CrdtItem, crdtArrayMove, undoArrayMove } from "../../../coop/client/crdt";
import { Shape } from "../../../data/shape";
import { LocalOpItem as OpItem } from "../localcmd";
import { RepoNode } from "./base";

function apply(target: Array<CrdtItem>, op: ArrayMoveOp): ArrayMoveOpRecord {
    return crdtArrayMove(target, op);
}

function unapply(target: Array<CrdtItem>, op: ArrayMoveOpRecord): ArrayMoveOpRecord {
    return undoArrayMove(target, op);
}

// fills borders
// 不需要变换及执行顺序可交换
// 但为了版本可以前进后退，需要undo-do-redo
export class CrdtArrayReopNode extends RepoNode {
    private page: Page;

    constructor(page: Page) {
        super(OpType.CrdtArr);
        this.page = page;
    }

    receive(ops: OpItem[], needUpdateFrame: Shape[]) {
        if (ops.length === 0) throw new Error();
        const target = this.page.getOpTarget(ops[0].op.path);
        if (!target) {
            this.ops.push(...ops);
            return;
        }
        // undo-do-redo
        // undo
        for (let i = this.localops.length - 1; i >= 0; i--) {
            const op = this.localops[i];
            unapply(target, op.op as ArrayMoveOpRecord);
        }

        // do
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const record = apply(target, op.op as ArrayMoveOp);
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
            const record = apply(target, op.op as ArrayMoveOpRecord);
            if (record) {
                // replace op
                op.op = record;
                const idx = op.cmd.ops.indexOf(op.op);
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, record);
            }
        }
    }

    receiveLocal(ops: OpItem[]): void {
        // check
        if (ops.length === 0) throw new Error();
        if (ops.length > this.localops.length) throw new Error();
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const op2 = this.localops.shift();
            // check
            if (op.cmd.id !== op2?.cmd.id) throw new Error("op not match");
            this.ops.push(op);
        }
    }

    commit(ops: OpItem[]): void {
        // this.localallops.length = this.localindex; // 丢弃被undo的ops
        this.localops.push(...ops);
        // this.localallops.push(...ops);
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

    undo(ops: OpItem[], needUpdateFrame: Shape[]) {
        // check
        if (ops.length === 0) throw new Error();
        const target = this.page.getOpTarget(ops[0].op.path);
        if (!target) {
            return;
        }
        for (let i = ops.length - 1; i >= 0; i--) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
            const record = unapply(target, ops[i].op as ArrayMoveOpRecord);
            if (record) {
                ops[i].op = record;
            }
        }
        // const cmd = ops[0].cmd;
        // if (cmd.posttime === 0) { // 未提交
        //     // check
        //     if (this.localops.length < ops.length) throw new Error();
        //     this.localops.splice(this.localops.length - ops.length, ops.length);
        // }
    }

    redo(ops: OpItem[], needUpdateFrame: Shape[]) {
        return this.undo(ops.reverse(), needUpdateFrame);
        // if (ops.length === 0) throw new Error();
        // const target = this.page.getOpTarget(ops[0].op.path);
        // if (!target) {
        //     return;
        // }
        // for (let i = 0; i < ops.length; i++) {
        //     if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
        //     const record = unapply(target, ops[i].op as ArrayMoveOpRecord);
        //     if (record) {
        //         ops[i].op = record;
        //     }
        // }
    }

    roll2Version(baseVer: number, version: number, needUpdateFrame: Shape[]): void {
        if (baseVer > version) throw new Error();
        // search and apply
        const ops = this.ops.concat(...this.localops);
        if (ops.length === 0) return;

        const target = this.page.getOpTarget(ops[0].op.path);
        if (!target) return;

        let baseIdx = ops.findIndex((op) => op.cmd.version > baseVer);
        let verIdx = ops.findIndex((op) => op.cmd.version > version);

        if (baseIdx < 0) baseIdx = 0;
        if (verIdx < 0) verIdx = ops.length;
        for (let i = baseIdx; i < verIdx; i++) {
            const op = ops[i];
            const record = apply(target, op.op as ArrayMoveOp);
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