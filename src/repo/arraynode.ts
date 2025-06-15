/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Op, OpType } from "../operator";
import { ArrayMoveOp, ArrayMoveOpRecord, CrdtItem, crdtArrayMove } from "../operator";
import { RepoNode, RepoNodePath } from "./base";
import { Cmd, OpItem } from "./types";
import { Document } from "../data/document";
import {
    IImportContext,
    importBorder,
    importContactRole,
    importCrdtNumber,
    importCurvePoint,
    importExportFormat,
    importFill, importGuide,
    importPageListItem,
    importPathSegment,
    importShadow,
    importStop,
    importPrototypeInteraction,
    importFillMask,
    importShadowMask,
    importBlurMask,
    importBorderMask,
    importBorderMaskType,
    importRadiusMask,
    importTextMask
} from "../data/baseimport";
import { FMT_VER_latest } from "../data/fmtver";

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
importh['guide'] = importGuide;
importh['prototype-interaction'] = importPrototypeInteraction;
importh['fill-mask'] = importFillMask
importh['shadow-mask'] = importShadowMask
importh['blur-mask'] = importBlurMask
importh['prototype-interaction'] = importPrototypeInteraction;
importh['stroke-paint'] = importFill;
importh['border-mask-living'] = importBorderMask;
importh['border-mask-type'] = importBorderMaskType
importh['radius-mask-living'] = importRadiusMask
importh['text-mask-living'] = importTextMask
importh['border-mask'] = importBorderMask;
importh['border-mask-type']= importBorderMaskType
importh['radius-mask'] = importRadiusMask

function _apply(document: Document, target: Array<CrdtItem>, op: ArrayMoveOp): ArrayMoveOpRecord | undefined {
    // import op.data
    let data = op.data;
    if (typeof data === 'string') {
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = document;
            curPage: string = ""; // 这个用于判断symbol 可以不设置
            fmtVer: string = FMT_VER_latest
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

function simpleApply(target: Array<CrdtItem>, op: ArrayMoveOp, data: any): ArrayMoveOpRecord | undefined {
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

    constructor(parent: RepoNodePath, document: Document) {
        super(OpType.CrdtArr, parent);
        this.document = document;
    }

    getOpTarget(path: string[]) {
        if (path[0] === this.document.id) return this.document.getOpTarget(path);
        const page = this.document.pagesMgr.getSync(path[0]);
        if (page) return page.getOpTarget(path);
    }

    undoLocals(): void {
        for (let i = this.localops.length - 1; i >= 0; i--) {
            const op = this.localops[i].op as ArrayMoveOpRecord;
            const target = op.target;
            const rop = revert(op);
            target && simpleApply(target, rop, op.origin);
        }
    }

    redoLocals(): void {
        if (this.localops.length === 0) return;
        for (let i = 0; i < this.localops.length; i++) {
            const op = this.localops[i].op as ArrayMoveOpRecord;
            const target = op.target;
            target && simpleApply(target, op, op.data2);
        }
    }

    receive(ops: OpItem[]) {
        if (ops.length === 0) throw new Error();

        // undo-do-redo
        // undo
        for (let i = this.localops.length - 1; i >= 0; i--) {
            const op = this.localops[i];
            unapply2(this.document, op.op as ArrayMoveOpRecord);
        }

        // do
        const target = this.getOpTarget(ops[0].op.path);
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const record = target && apply(this.document, target, op.op as ArrayMoveOp);
            if (record) {
                // replace op
                const idx = op.cmd.ops.indexOf(op.op);
                op.op = record;
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, record);
            }
            // if (op.cmd.isRecovery) {
            //     this.baseVer = op.cmd.baseVer;
            // }
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

    undo(ops: OpItem[], receiver?: Cmd) {
        // check
        if (ops.length === 0) throw new Error();
        const saveops: OpItem[] | undefined = receiver ? undefined : ops.map((item) => ({ cmd: item.cmd, op: item.op }));
        ops.reverse();
        for (let i = 0; i < ops.length; ++i) { // reverse
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
            this.popLocal(saveops!);
            // replace op
            for (let i = 0; i < ops.length; i++) {
                const op = ops[i];
                const saveop = saveops![i];
                const idx = op.cmd.ops.indexOf(saveop.op);
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1);
            }
            ops[0].cmd.ops.push(...(ops.map(item => item.op)));
        }
    }

    redo(ops: OpItem[], receiver?: Cmd) {
        // check
        if (ops.length === 0) throw new Error();
        ops.reverse();

        const target = this.getOpTarget(ops[0].op.path);
        const saveops: Op[] | undefined = (!receiver) ? ops.map(op => op.op) : undefined;
        for (let i = 0; i < ops.length; ++i) {
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
                op.cmd.ops.splice(idx, 1);
            }
            ops[0].cmd.ops.push(...(ops.map(item => item.op)));
            this.commit(ops);
        }
    }

    roll2Version(baseVer: number, version: number): Map<string, { ver: number, isRecovery: boolean }> | undefined {
        if ((baseVer - version) > 0) throw new Error();
        // search and apply
        const ops = this.ops.concat(...this.localops);
        if (ops.length === 0) return;

        const baseIdx = ops.findIndex((op) => (op.cmd.version - baseVer) > 0);
        if (baseIdx < 0) return; // 都比它小

        const target = this.getOpTarget(ops[0].op.path);
        if (!target) return;

        let verIdx = ops.findIndex((op) => (op.cmd.version - version) > 0);

        if (verIdx < 0) verIdx = ops.length;
        const updateVers = new Map<string, { ver: number, isRecovery: boolean }>();
        for (let i = baseIdx; i < verIdx; i++) {
            const op = ops[i];
            let record: ArrayMoveOpRecord | undefined;
            try {
                record = apply(this.document, target, op.op as ArrayMoveOp);
                if (record?.data2 && (record.data2).id) {
                    const ver = op.cmd.isRecovery ? op.cmd.baseVer : (op.cmd.version - 1)
                    updateVers.set((record.data2).id, { ver, isRecovery: op.cmd.isRecovery })
                }
            } catch (e) {
                console.error(e)
            }
            if (record) {
                // replace op
                const idx = op.cmd.ops.indexOf(op.op);
                op.op = record;
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, record);
            }
        }
        return updateVers;
    }
}