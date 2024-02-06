import { Op, OpType } from "../../coop/common/op";
import { Page } from "../../data/page";
import { TreeMoveOp, TreeMoveOpRecord, crdtTreeMove } from "../../coop/client/crdt";
import { Shape } from "../../data/shape";
import { importShape } from "./utils";
import { Document } from "../../data/document";
import { RepoNode } from "./base";
import { Cmd, OpItem } from "../../coop/common/repo";
import { SNumber } from "../../coop/client/snumber";

function _apply(document: Document, page: Page, op: TreeMoveOp) {

    let data = op.data;
    if (typeof data === 'string') {
        // import data
        const _data = JSON.parse(data);
        data = importShape(_data, document, page);
    }

    let shape = page.getShape(op.id);
    // if (shape && shape.parent) { // 旧?
    //     needUpdateFrame.push(shape.parent);
    // }

    const ret = crdtTreeMove(page, op, data as Shape);
    if (!ret) {
        // 
    }
    else if (shape && !ret.to) { // 删除
        page.onRemoveShape(shape);
        shape = undefined;
    }
    else if (!shape && ret.to && ret.data) { // 插入
        shape = ret.data2 as Shape;
        page.onAddShape(shape);
    }

    // if (ret && shape) {
    //     needUpdateFrame.push(shape);
    // }

    // todo 迁移notify??或者使用objectid

    return ret;
}

function apply(document: Document, page: Page, op: TreeMoveOp) {
    const ret = _apply(document, page, op);
    // 序列化
    if (ret?.data) {
        const value = ret.data;
        ret.data = typeof value === 'object' ? JSON.stringify(value, (k, v) => k.startsWith('__') ? undefined : v) : value;
    }
    return ret;
}

function unapply(document: Document, op: TreeMoveOpRecord) {
    return op.target && apply(document, op.target, revert(op));
}

// 不序列化化op
function unapply2(document: Document, op: TreeMoveOpRecord) {
    return op.target && _apply(document, op.target, revert(op));
}

function revert(op: TreeMoveOpRecord): TreeMoveOpRecord {
    return {
        id: op.id,
        type: op.type,
        path: op.path,
        data: op.origin,
        from: op.to,
        to: op.from,
        origin: op.data,
        target: undefined,
        data2: undefined
    }
}

function stringifyData(op: TreeMoveOpRecord) {
    if (typeof op.data === 'object') op.data = JSON.stringify(op.data, (k, v) => k.startsWith('__'));
    return op;
}

export class CrdtShapeRepoNode extends RepoNode {
    private document: Document;
    // private page: Page;

    constructor(document: Document) {
        super(OpType.CrdtTree);
        this.document = document;
        // this.page = page;
    }

    undoLocals(): void {
        for (let i = this.localops.length - 1; i >= 0; i--) {
            const op = this.localops[i];
            unapply2(this.document, op.op as TreeMoveOpRecord);
        }
    }

    redoLocals(): void {
        if (this.localops.length === 0) return;
        const target = this.document.pagesMgr.getSync(this.localops[0].op.path[0]);
        if (target) for (let i = 0; i < this.localops.length; i++) {
            const op = this.localops[i];
            _apply(this.document, target, op.op as TreeMoveOpRecord);
            // if (record) {
            //     // replace op
            //     op.op = record;
            //     const idx = op.cmd.ops.indexOf(op.op);
            //     if (idx < 0) throw new Error();
            //     op.cmd.ops.splice(idx, 1, record);
            // }
        }
    }

    receive(ops: OpItem[]) {
        if (ops.length === 0) throw new Error();

        // undo-do-redo
        // undo
        for (let i = this.localops.length - 1; i >= 0; i--) {
            const op = this.localops[i];
            unapply2(this.document, op.op as TreeMoveOpRecord);
        }

        const target = this.document.pagesMgr.getSync(ops[0].op.path[0]);
        // do
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const record = target && apply(this.document, target, op.op as TreeMoveOp);
            if (record) {
                // replace op
                const idx = op.cmd.ops.indexOf(op.op);
                op.op = record;
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, record);
            }
            if (op.cmd.isRecovery) {
                this.baseVer = op.cmd.baseVer;
            }
        }
        this.ops.push(...ops);

        // redo
        if (target) {
            for (let i = 0; i < this.localops.length; i++) {
                const op = this.localops[i];
                const record = apply(this.document, target, op.op as TreeMoveOpRecord);
                if (record) {
                    // replace op
                    const idx = op.cmd.ops.indexOf(op.op);
                    op.op = record;
                    if (idx < 0) throw new Error();
                    op.cmd.ops.splice(idx, 1, record);
                }
                else {
                    const idx = op.cmd.ops.indexOf(op.op);
                    if (idx < 0) throw new Error();
                    op.cmd.ops.splice(idx, 1);
                    this.localops.splice(i, 1);
                    --i;
                }
            }
        } else {
            for (let i = 0; i < this.localops.length; i++) {
                const op = this.localops[i];
                (op.op as TreeMoveOpRecord).target = undefined; // 不可以再undo
            }
        }
    }
    receiveLocal(ops: OpItem[]) {
        if (ops.length === 0) throw new Error();
        if (ops.length > this.localops.length) throw new Error();
        const target = this.document.pagesMgr.getSync(ops[0].op.path[0]);
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

    undo(ops: OpItem[], receiver?: Cmd) {
        // check
        if (ops.length === 0) throw new Error();
        // const target = this.document.pagesMgr.getSync(ops[0].op.path[0]);;
        const saveops: Op[] | undefined = (!receiver) ? ops.map(op => op.op) : undefined;
        for (let i = ops.length - 1; i >= 0; i--) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
            const record = unapply(this.document, ops[i].op as TreeMoveOpRecord);
            if (record) ops[i].op = record;
            else ops[i].op = stringifyData(revert(ops[i].op as TreeMoveOpRecord));
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

    redo(ops: OpItem[], receiver?: Cmd) {
        // check
        if (ops.length === 0) throw new Error();
        ops.reverse();
        const target = this.document.pagesMgr.getSync(ops[0].op.path[0]);
        const saveops: Op[] | undefined = (!receiver) ? ops.map(op => op.op) : undefined;
        for (let i = ops.length - 1; i >= 0; i--) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
            const rop = revert(ops[i].op as TreeMoveOpRecord);
            const record = target && apply(this.document, target, rop);
            if (record) ops[i].op = record;
            else ops[i].op = stringifyData(rop);
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
    roll2Version(baseVer: string, version: string) {
        if (SNumber.comp(baseVer, version) > 0) throw new Error();
        // search and apply
        const ops = this.ops.concat(...this.localops);
        if (ops.length === 0) return;

        const baseIdx = ops.findIndex((op) => SNumber.comp(op.cmd.version, baseVer) > 0);
        if (baseIdx < 0) return; // 都比它小

        const target = this.document.pagesMgr.getSync(ops[0].op.path[0]);
        if (!target) return;
        let verIdx = ops.findIndex((op) => SNumber.comp(op.cmd.version, version) > 0);

        if (verIdx < 0) verIdx = ops.length;
        for (let i = baseIdx; i < verIdx; i++) {
            const op = ops[i];
            const record = apply(this.document, target, op.op as TreeMoveOp);
            if (record) {
                // replace op
                const idx = op.cmd.ops.indexOf(op.op);
                op.op = record;
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, record);
            }
        }
    }
}