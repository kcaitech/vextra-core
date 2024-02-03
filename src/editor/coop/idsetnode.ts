import { OpType } from "../../coop/common/op";
import { Basic, ResourceMgr } from "../../data/basic";
import { Shape } from "../../data/shape";
import { IdOp, IdOpRecord } from "../../coop/client/crdt";
import { RepoNode } from "./base";
import { Cmd, OpItem } from "../../coop/common/repo";
import { Document } from "../../data/document";
import { IImportContext, importTableCell, importVariable } from "../../data/baseimport";
import { SNumber } from "../../coop/client/snumber";

function apply(document: Document, target: Object, op: IdOp, needUpdateFrame: Shape[]): IdOpRecord {
    if (typeof op.data === 'string' && (op.data[0] === '{' || op.data[0] === '[')) {
        // import data
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = document;
            curPage: string = "" // 这个用于判断symbol 可以不设置
        };
        const data = JSON.parse(op.data);
        const typeId = data.typeId;
        if (typeId === 'table-cell') {
            op.data = importTableCell(data, ctx);
        } else if (typeId === 'variable') {
            op.data = importVariable(data, ctx);
        } else {
            throw new Error('need import ' + typeId)
        }
    }
    let value = op.data;
    if (typeof value === 'object' && (!(value instanceof Basic))) throw new Error("need import: " + op.data.typeId);
    let origin;
    if (target instanceof Map) {
        origin = target.get(op.id);
        if (value) target.set(op.id, value);
        else target.delete(op.id);
    } else if (target instanceof ResourceMgr) {
        origin = target.getSync(op.id);
        if (value) target.add(op.id, value);
    } else {
        origin = (target as any)[op.id];
        (target as any)[op.id] = value;
    }
    return {
        data: typeof value === 'object' ? JSON.stringify(value, (k, v) => k.startsWith('__') ? undefined : v) : value,
        id: op.id, // 这个跟随cmd id 的？
        type: op.type,
        path: op.path,
        order: SNumber.MAX_SAFE_INTEGER,
        origin: origin,
        target,
        data2: value
    }
}

function revert(op: IdOpRecord): IdOpRecord {
    return {
        data: op.origin,
        id: op.id,
        type: op.type,
        path: op.path,
        order: SNumber.MAX_SAFE_INTEGER,
        origin: op.data,
        target: undefined,
        data2: undefined
    }
}

// todo import, updateframe

export class CrdtIdRepoNode extends RepoNode {
    private document: Document;
    private savedOrigin: boolean = false;
    private origin: any; // baseVer的状态
    constructor(document: Document) {
        super(OpType.Idset);
        this.document = document;
    }

    getOpTarget(path: string[]) {
        if (path[0] === this.document.id) return this.document.getOpTarget(path);
        const page = this.document.pagesMgr.getSync(path[0]);
        if (page) return page.getOpTarget(path);
    }

    private saveOrigin(target: any, ops: OpItem[]) {
        if (this.savedOrigin) return;
        if (!target) return;
        if (this.localops.length === 0) {
            this.origin = (target as any)[ops[0].op.id];
        } else {
            this.origin = (this.localops[0].op as IdOpRecord).origin;
        }
        this.savedOrigin = true;
    }

    undoLocals(): void {
        if (this.localops.length === 0) return;
        const op0 = this.localops[0].op as IdOpRecord;
        const target = op0.target; // this.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        const rop = revert(op0);
        target && apply(this.document, target, rop, []);
    }
    redoLocals(): void {
        if (this.localops.length === 0) return;
        // 找到最后个有target的
        for (let i = this.localops.length - 1; i >= 0; --i) {
            const op = this.localops[i].op as IdOpRecord;
            const target = op.target; // this.getOpTarget(op0.path.slice(0, op0.path.length - 1));
            if (target) {
                apply(this.document, target, op, []);
                break;
            }
        }
    }

    receive(ops: OpItem[], needUpdateFrame: Shape[]) {
        if (ops.length === 0) throw new Error();

        const op0 = ops[0].op;
        const target = this.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        // save origin
        this.saveOrigin(target, ops);
        this.ops.push(...ops);

        if (!target) {
            this.undoLocals();
            this.localops.forEach(item => (item.op as IdOpRecord).target = undefined) // 不可再undo
        } else {
            if (this.localops.length === 0) {
                apply(this.document, target, this.ops[this.ops.length - 1].op as IdOp, needUpdateFrame)
            }
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
            if (op.cmd !== op2?.cmd) {
                console.log("ops", ops);
                console.log("op2", op2, i);
                console.log("localops", this.localops);
                throw new Error("op not match");
            }
        }
    }
    dropOps(ops: OpItem[]): void {
    }
    undo(ops: OpItem[], needUpdateFrame: Shape[], receiver?: Cmd) {
        if (ops.length === 0) throw new Error();
        const op0 = ops[0].op as IdOpRecord;
        const target = op0.target; // this.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        const rop = revert(op0);
        const record = target && apply(this.document, target, rop, needUpdateFrame) || rop
        if (receiver) {
            receiver.ops.push(record);
            this.commit([{ cmd: receiver, op: record }]);
        } else {
            this.popLocal(ops);
            // replace op
            const idx = ops[0].cmd.ops.indexOf(op0);
            if (idx < 0) throw new Error();
            ops[0].cmd.ops.splice(idx, 1, record);
        }
    }
    redo(ops: OpItem[], needUpdateFrame: Shape[], receiver?: Cmd) {
        if (ops.length === 0) throw new Error();
        const op0 = ops[0].op;
        // 没有target也要保证op正确
        const target = this.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        const op = ops[ops.length - 1].op as IdOpRecord;
        const rop = revert(op);
        const record = target && apply(this.document, target, rop, needUpdateFrame) || rop;
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
    roll2Version(baseVer: string, version: string, needUpdateFrame: Shape[]) {
        if (SNumber.comp(baseVer, version) > 0) throw new Error();
        // search and apply
        const ops = this.ops.concat(...this.localops);
        if (ops.length === 0) return;

        const op0 = ops[0].op;
        const target = this.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        if (!target) return;

        // let baseIdx = ops.findIndex((op) => op.cmd.version > baseVer);
        let verIdx = ops.findIndex((op) => SNumber.comp(op.cmd.version, version) > 0);

        // if (baseIdx < 0) baseIdx = 0;
        if (verIdx < 0) verIdx = ops.length;
        if (verIdx === 0) {
            const op = ops[verIdx].op as IdOpRecord;
            let origin;
            if (this.savedOrigin) {
                origin = this.origin;
            } else {
                origin = op.origin; // 没有save的话，那么op只能是本地op
            }
            apply(this.document,
                target, {
                data: origin,
                id: op.id,
                type: op.type,
                path: op.path,
                order: op.order
            }, needUpdateFrame);
        } else {
            const op = ops[verIdx - 1];
            if (!op) throw new Error("not found");
            apply(this.document, target, op.op as IdOp, needUpdateFrame);
        }
    }

}