import { Page } from "../../data/page";
import { OpType } from "../../coop/common/op";
import { Basic } from "../../data/basic";
import { Shape } from "../../data/shape";
import { IdSetOp, IdSetOpRecord } from "../../coop/client/crdt";
import { RepoNode } from "./base";
import { Cmd, OpItem } from "../../coop/common/repo";

function apply(target: Object, op: IdSetOp, needUpdateFrame: Shape[]): IdSetOpRecord {
    let value = op.data;
    if (typeof op.data === 'object') switch (op.data.typeId) {
        // todo 需要import ? 需要
        // import
        // throw new Error("not implemented")
    }
    if (typeof value === 'object' && (!(value instanceof Basic))) throw new Error("need import: " + op.data.typeId);
    const origin = (target as any)[op.id];
    (target as any)[op.id] = value;
    return {
        data: value,
        id: op.id, // 这个跟随cmd id 的？
        type: op.type,
        path: op.path,
        order: Number.MAX_SAFE_INTEGER,
        origin: origin
    }
}

// todo import, updateframe

export class CrdtIdRepoNode extends RepoNode {
    private page: Page;
    private savedOrigin: boolean = false;
    private origin: any; // baseVer的状态
    constructor(page: Page) {
        super(OpType.Idset);
        this.page = page;
    }

    private saveOrigin(target: any, ops: OpItem[]) {
        if (this.savedOrigin) return;
        if (!target) return;
        if (this.localops.length === 0) {
            this.origin = (target as any)[ops[0].op.id];
        } else {
            this.origin = (this.localops[0].op as IdSetOpRecord).origin;
        }
        this.savedOrigin = true;
    }

    receive(ops: OpItem[], needUpdateFrame: Shape[]) {
        if (ops.length === 0) throw new Error();
        const op0 = ops[0].op;
        const target = this.page.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        // save origin
        this.saveOrigin(target, ops);
        this.ops.push(...ops);
        if (this.localops.length === 0 && target) {
            apply(target, this.ops[this.ops.length - 1].op as IdSetOp, needUpdateFrame)
        }
    }
    receiveLocal(ops: OpItem[]) {
        // local back
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
        if (ops.length === 0) throw new Error();
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
        if (ops.length === 0) throw new Error();
        const op0 = ops[0].op;
        const target = this.page.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        if (!target) {
            if (!receiver) this.popLocal(ops);
            return;
        }
        const op = ops[0].op as IdSetOpRecord;
        const record = apply(target, {
            data: op.origin,
            id: op.id,
            type: op.type,
            path: op.path,
            order: op.order
        }, needUpdateFrame)
        if (receiver) {
            receiver.ops.push(record);
            this.commit([{ cmd: receiver, op: record }]);
        } else {
            this.popLocal(ops);
            // replace op
            const idx = ops[0].cmd.ops.indexOf(op);
            if (idx < 0) throw new Error();
            ops[0].cmd.ops.splice(idx, 1, record);
        }
    }
    redo(ops: OpItem[], needUpdateFrame: Shape[], receiver?: Cmd) {
        if (ops.length === 0) throw new Error();
        const op0 = ops[0].op;
        const target = this.page.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        if (!target) {
            if (!receiver) this.popLocal(ops);
            return;
        }
        const op = ops[ops.length - 1].op as IdSetOpRecord;
        const record = apply(target, op, needUpdateFrame);
        if (receiver) {
            receiver.ops.push(record);
            this.commit([{ cmd: receiver, op: record }]);
        } else {
            this.commit([{ cmd: ops[0].cmd, op: record }]);
            // replace op
            const idx = ops[0].cmd.ops.indexOf(op);
            if (idx < 0) throw new Error();
            ops[0].cmd.ops.splice(idx, 1, record);
        }
    }
    roll2Version(baseVer: number, version: number, needUpdateFrame: Shape[]) {
        if (baseVer > version) throw new Error();
        // search and apply
        const ops = this.ops.concat(...this.localops);
        if (ops.length === 0) return;

        const op0 = ops[0].op;
        const target = this.page.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        if (!target) return;

        // let baseIdx = ops.findIndex((op) => op.cmd.version > baseVer);
        let verIdx = ops.findIndex((op) => op.cmd.version > version);

        // if (baseIdx < 0) baseIdx = 0;
        if (verIdx < 0) verIdx = ops.length;
        if (verIdx === 0) {
            const op = ops[verIdx].op as IdSetOpRecord;
            let origin;
            if (this.savedOrigin) {
                origin = this.origin;
            } else {
                origin = op.origin; // 没有save的话，那么op只能是本地op
            }
            apply(target, {
                data: origin,
                id: op.id,
                type: op.type,
                path: op.path,
                order: op.order
            }, needUpdateFrame);
        } else {
            const op = ops[verIdx - 1];
            if (!op) throw new Error("not found");
            apply(target, op.op as IdSetOp, needUpdateFrame);
        }
    }

}