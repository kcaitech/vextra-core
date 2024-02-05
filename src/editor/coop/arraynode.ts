import { Op, OpType } from "../../coop/common/op";
import { ArrayMoveOp, ArrayMoveOpRecord, CrdtItem, arrLowerIndex, crdtArrayMove } from "../../coop/client/crdt";
import { Shape } from "../../data/shape";
import { RepoNode } from "./base";
import { Cmd, OpItem } from "../../coop/common/repo";
import { Document } from "../../data/document";
import {
    IImportContext,
    importBorder,
    importContactRole,
    importCrdtNumber,
    importCurvePoint,
    importExportFormat,
    importFill,
    importPageListItem,
    importPathSegment,
    importShadow,
    importStop
} from "../../data/baseimport";
import { SNumber } from "../../coop/client/snumber";

const importh: { [key: string]: (data: any, ctx: IImportContext) => any } = {};
importh['fill'] = importFill;
importh['border'] = importBorder;
importh['shadow'] = importShadow;
importh['export-format'] = importExportFormat;
importh['curve-point'] = importCurvePoint;
importh['stop'] = importStop;
importh['contact-role'] = importContactRole;
importh['crdt-number'] = importCrdtNumber;
importh['path-segment'] = importPathSegment;
importh['page-list-item'] = importPageListItem;

function _apply(document: Document, target: Array<CrdtItem>, op: ArrayMoveOp): ArrayMoveOpRecord | undefined {
    // import op.data
    let data = op.data;
    if (typeof data === 'string') {
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = document;
            curPage: string = "" // 这个用于判断symbol 可以不设置
        };

        const _data = JSON.parse(data);
        const typeId = _data.typeId;
        const h = importh[typeId];
        if (h) {
            data = h(_data, ctx);
        } else {
            throw new Error('need import ' + typeId)
        }
    }
    return crdtArrayMove(target, op, data as CrdtItem);
}

function apply(document: Document, target: Array<CrdtItem>, op: ArrayMoveOp): ArrayMoveOpRecord | undefined {
    const retop = _apply(document, target, op);
    // 序列化
    if (retop?.data) {
        const value = retop.data;
        retop.data = typeof value === 'object' ? JSON.stringify(value, (k, v) => k.startsWith('__') ? undefined : v) : value;
    }
    return retop;
}

function unapply(document: Document, op: ArrayMoveOpRecord): ArrayMoveOpRecord | undefined {
    return op.target && apply(document, op.target, revert(op));
}

// 不序列化化op
function unapply2(document: Document, op: ArrayMoveOpRecord): ArrayMoveOpRecord | undefined {
    return op.target && _apply(document, op.target, revert(op));
}

function revert(op: ArrayMoveOpRecord): ArrayMoveOpRecord {
    return {
        from: op.to,
        to: op.from,
        type: op.type,
        data: op.origin,
        order: SNumber.MAX_SAFE_INTEGER,
        id: op.id,
        path: op.path,
        origin: op.data,
        target: undefined,
        data2: undefined
    }
}

function stringifyData(op: ArrayMoveOpRecord) {
    if (typeof op.data === 'object') op.data = JSON.stringify(op.data, (k, v) => k.startsWith('__'));
    return op;
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

    undoLocals(): void {
        for (let i = this.localops.length - 1; i >= 0; i--) {
            const op = this.localops[i];
            unapply2(this.document, op.op as ArrayMoveOpRecord);
        }
    }

    redoLocals(): void {
        if (this.localops.length === 0) return;
        const target = this.getOpTarget(this.localops[0].op.path);
        if (target) for (let i = 0; i < this.localops.length; i++) {
            const op = this.localops[i];
            _apply(this.document, target, op.op as ArrayMoveOpRecord);
            // if (record) {
            //     // replace op
            //     op.op = record;
            //     const idx = op.cmd.ops.indexOf(op.op);
            //     if (idx < 0) throw new Error();
            //     op.cmd.ops.splice(idx, 1, record);
            // }
        }
    }

    receive(ops: OpItem[], needUpdateFrame: Shape[]) {
        if (ops.length === 0) throw new Error();

        // undo-do-redo
        // undo
        for (let i = this.localops.length - 1; i >= 0; i--) {
            const op = this.localops[i];
            unapply2(this.document, op.op as ArrayMoveOpRecord);
        }

        // do
        const target = this.getOpTarget(ops[0].op.path);
        if (target) for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const record = apply(this.document, target, op.op as ArrayMoveOp);
            if (record) {
                // replace op
                const idx = op.cmd.ops.indexOf(op.op);
                op.op = record;
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, record);
            }
        }
        this.ops.push(...ops);

        // redo
        if (target) {
            for (let i = 0; i < this.localops.length; i++) {
                const op = this.localops[i];
                const record = apply(this.document, target, op.op as ArrayMoveOpRecord);
                if (record) {
                    // replace op
                    const idx = op.cmd.ops.indexOf(op.op);
                    op.op = record;
                    if (idx < 0) throw new Error();
                    op.cmd.ops.splice(idx, 1, record);
                } else {
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
                (op.op as ArrayMoveOpRecord).target = undefined; // 不可以再undo
            }
        }
    }

    receiveLocal(ops: OpItem[]): void {
        // check
        if (ops.length === 0) throw new Error();
        if (ops.length > this.localops.length) throw new Error();
        const target = this.getOpTarget(ops[0].op.path);
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
        const saveops: Op[] | undefined = (!receiver) ? ops.map(op => op.op) : undefined;
        for (let i = ops.length - 1; i >= 0; i--) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
            const record: ArrayMoveOpRecord | undefined = unapply(this.document, ops[i].op as ArrayMoveOpRecord);
            if (record) ops[i].op = record;
            else ops[i].op = stringifyData(revert(ops[i].op as ArrayMoveOpRecord));
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
            const rop = revert(ops[i].op as ArrayMoveOpRecord);
            const record: ArrayMoveOpRecord | undefined = target && apply(this.document, target, rop);
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

    roll2Version(baseVer: string, version: string, needUpdateFrame: Shape[]): void {
        if (SNumber.comp(baseVer, version) > 0) throw new Error();
        // search and apply
        const ops = this.ops.concat(...this.localops);
        if (ops.length === 0) return;

        const target = this.getOpTarget(ops[0].op.path);
        if (!target) return;

        let baseIdx = ops.findIndex((op) => SNumber.comp(op.cmd.version, baseVer) > 0);
        let verIdx = ops.findIndex((op) => SNumber.comp(op.cmd.version, version) > 0);

        if (baseIdx < 0) baseIdx = 0;
        if (verIdx < 0) verIdx = ops.length;
        for (let i = baseIdx; i < verIdx; i++) {
            const op = ops[i];
            const record = apply(this.document, target, op.op as ArrayMoveOp);
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