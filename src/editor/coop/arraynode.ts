import { Op, OpType } from "../../coop/common/op";
import { ArrayMoveOp, ArrayMoveOpRecord, CrdtItem, crdtArrayMove, undoArrayMove } from "../../coop/client/crdt";
import { Shape } from "../../data/shape";
import { RepoNode } from "./base";
import { Cmd, OpItem } from "../../coop/common/repo";
import { Document } from "../../data/document";

function apply(target: Array<CrdtItem>, op: ArrayMoveOp): ArrayMoveOpRecord {
    return crdtArrayMove(target, op);
}

function unapply(target: Array<CrdtItem>, op: ArrayMoveOpRecord): ArrayMoveOpRecord {
    return undoArrayMove(target, op);
}

function revert(op: ArrayMoveOpRecord): ArrayMoveOpRecord {
    return {
        from: op.to,
        to: op.from,
        type: op.type,
        data: op.data,
        order: Number.MAX_SAFE_INTEGER,
        id: op.id,
        path: op.path
    }
}

// fills borders
// 不需要变换及执行顺序可交换
// 但为了版本可以前进后退，需要undo-do-redo
export class CrdtArrayReopNode extends RepoNode {
    private document: Document;

    constructor(document: Document) {
        super(OpType.CrdtArr);
        this.document = document;
    }

    getOpTarget(path: string[]) {
        if (path[0] === this.document.id) return this.document.getOpTarget(path);
        const page = this.document.pagesMgr.getSync(path[0]);
        if (page) return page.getOpTarget(path);
    }

    receive(ops: OpItem[], needUpdateFrame: Shape[]) {
        if (ops.length === 0) throw new Error();
        const target = this.getOpTarget(ops[0].op.path);
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
            this.ops.push(op2);
        }
    }

    commit(ops: OpItem[]): void {
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
        const target = this.getOpTarget(ops[0].op.path);
        const saveops: Op[] | undefined = (!receiver) ? ops.map(op => op.op) : undefined;
        for (let i = ops.length - 1; i >= 0; i--) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
            const record: ArrayMoveOpRecord | undefined = target && unapply(target, ops[i].op as ArrayMoveOpRecord);
            if (record) ops[i].op = record;
            else ops[i].op = revert(ops[i].op as ArrayMoveOpRecord);
        }

        if (receiver) {
            this.commit((ops.map(item => {
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

        const target = this.getOpTarget(ops[0].op.path);
        const saveops: Op[] | undefined = (!receiver) ? ops.map(op => op.op) : undefined;
        for (let i = ops.length - 1; i >= 0; i--) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
            const record: ArrayMoveOpRecord | undefined = target && unapply(target, ops[i].op as ArrayMoveOpRecord);
            if (record) ops[i].op = record;
            else ops[i].op = revert(ops[i].op as ArrayMoveOpRecord);
        }

        if (receiver) {
            this.commit((ops.map(item => {
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

    roll2Version(baseVer: number, version: number, needUpdateFrame: Shape[]): void {
        if (baseVer > version) throw new Error();
        // search and apply
        const ops = this.ops.concat(...this.localops);
        if (ops.length === 0) return;

        const target = this.getOpTarget(ops[0].op.path);
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