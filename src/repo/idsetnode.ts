/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { OpType } from "../operator";
import { BasicArray, ResourceMgr, isDataBasicType } from "../data/basic";
import { IdOp, IdOpRecord } from "../operator";
import { RepoNode, RepoNodePath } from "./base";
import { Cmd, OpItem } from "./types";
import { Document } from "../data/document";
import {
    IImportContext,
    importAutoLayout,
    importBlur,
    importBorderSideSetting,
    importBorderStyle,
    importColor,
    importContactForm,
    importGradient,
    importPage,
    importPrototypeStartingPoint,
    importPaintFilter,
    importSymbolShape,
    importSymbolUnionShape,
    importTableCell,
    importVariable,
    importOverlayBackgroundAppearance,
    importPrototypeEasingBezier,
    importPoint2D,
    importPrototypeActions,
    importOverlayPosition,
    importBorder,
    importTransform, importStyleSheet,
} from "../data/baseimport";
import { FMT_VER_latest } from "../data/fmtver";

const importh: { [key: string]: (data: any, ctx: IImportContext) => any } = {};
importh['table-cell'] = importTableCell;
importh['variable'] = importVariable;
importh['page'] = importPage;
importh['color'] = importColor;
importh['contact-form'] = importContactForm;
importh['border-style'] = importBorderStyle;
importh['gradient'] = importGradient;
importh['border-side-setting'] = importBorderSideSetting;
importh['blur'] = importBlur;
importh['symbol-shape'] = importSymbolShape;
importh['symbol-union-shape'] = importSymbolUnionShape;
importh['prototype-starting-point'] = importPrototypeStartingPoint;
importh['overlay-background-appearance'] = importOverlayBackgroundAppearance;
importh['point-2d'] = importPoint2D;
importh['prototype-actions'] = importPrototypeActions;
importh['paint-filter'] = importPaintFilter;
importh['auto-layout'] = importAutoLayout;
importh['overlay-position']=importOverlayPosition
importh['prototype-easing-bezier']=importPrototypeEasingBezier;
importh['border'] = importBorder;
importh['transform'] = importTransform;
importh['style-sheet'] = importStyleSheet

function apply(document: Document, target: Object, op: IdOp, fmtVer: string): IdOpRecord {
    let value = op.data;
    if (typeof op.data === 'string' && (op.data[0] === '{' || op.data[0] === '[')) {
        // import data
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = document;
            curPage: string = ""; // 这个用于判断symbol 可以不设置
            fmtVer: string = fmtVer ?? 0
        };
        const data = JSON.parse(op.data);
        const typeId = data.typeId;
        const h = importh[typeId];
        if (Array.isArray(data)) {
            data.forEach(v => {
                if (typeof v !== "number") throw new Error();
            })
            value = new BasicArray(...data);
        } else if (h) {
            value = h(data, ctx);
        } else {
            throw new Error('need import ' + typeId)
        }
    }

    if (typeof value === 'object' && (!(isDataBasicType(value)))) throw new Error("need import: " + value?.typeId);
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
        origin: origin,
        target,
        data2: value
    }
}

function simpleApply(target: Object, op: IdOp, value: any) {
    if (typeof value === 'object' && (!(isDataBasicType(value)))) throw new Error("need import: " + value?.typeId);
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
}

function revert(op: IdOpRecord): IdOpRecord {
    return {
        data: op.origin,
        id: op.id,
        type: op.type,
        path: op.path,
        origin: op.data,
        target: undefined,
        data2: undefined
    }
}

function stringifyData(op: IdOpRecord) {
    if (typeof op.data === 'object') op.data = JSON.stringify(op.data, (k, v) => k.startsWith('__'));
    return op;
}

// todo import, updateframe

export class CrdtIdRepoNode extends RepoNode {
    private document: Document;
    private savedOrigin: boolean = false;
    private origin: any; // baseVer的状态
    constructor(parent: RepoNodePath, document: Document) {
        super(OpType.Idset, parent);
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
        target && simpleApply(target, rop, op0.origin);
    }
    redoLocals(): void {
        if (this.localops.length === 0) return;
        // 找到最后个有target的
        for (let i = this.localops.length - 1; i >= 0; --i) {
            const op = this.localops[i].op as IdOpRecord;
            const target = op.target; // this.getOpTarget(op.path.slice(0, op.path.length - 1)); // 有可能在上一级的node中，对象被替换掉了，需要重新获取
            if (target) {
                simpleApply(target, op, op.data2); // 还原数据
                break;
            }
        }
    }

    receive(ops: OpItem[]) {
        if (ops.length === 0) throw new Error();

        const op0 = ops[0].op;
        const target = this.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        // save origin
        this.saveOrigin(target, ops);
        this.ops.push(...ops);

        // for (let i = 0; i < ops.length; ++i) {
        //     const op = ops[i];
        //     if (op.cmd.isRecovery) {
        //         this.baseVer = op.cmd.baseVer;
        //     }
        // }

        if (!target) {
            this.undoLocals();
            this.localops.forEach(item => (item.op as IdOpRecord).target = undefined) // 不可再undo
        } else {
            if (this.localops.length === 0) {
                const item = this.ops[this.ops.length - 1]
                apply(this.document, target, item.op as IdOp, item.cmd.dataFmtVer)
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
    undo(ops: OpItem[], receiver?: Cmd) {
        if (ops.length !== 1) throw new Error(JSON.stringify(ops, (k, v) => k.startsWith('__')));
        const op0 = ops[0].op as IdOpRecord;
        const target = op0.target; // this.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        const rop = revert(op0);
        const record = target && apply(this.document, target, rop, FMT_VER_latest) || stringifyData(rop)
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
    redo(ops: OpItem[], receiver?: Cmd) {
        if (ops.length !== 1) throw new Error(JSON.stringify(ops, (k, v) => k.startsWith('__')));
        const op0 = ops[0].op;
        // 没有target也要保证op正确
        const target = this.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        const op = ops[ops.length - 1].op as IdOpRecord;
        const rop = revert(op);
        const record = target && apply(this.document, target, rop, FMT_VER_latest) || stringifyData(rop);
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
    roll2Version(baseVer: number, version: number): Map<string, { ver: number, isRecovery: boolean }> | undefined {
        if ((baseVer - version) > 0) throw new Error();
        // search and apply
        const ops = this.ops.concat(...this.localops);
        if (ops.length === 0) return;

        const baseIdx = ops.findIndex((op) => (op.cmd.version - baseVer) > 0);
        if (baseIdx < 0) return; // 都比它小

        const op0 = ops[0].op;
        const target = this.getOpTarget(op0.path.slice(0, op0.path.length - 1));
        if (!target) return;

        // let baseIdx = ops.findIndex((op) => op.cmd.version > baseVer);
        let verIdx = ops.findIndex((op) => (op.cmd.version - version) > 0);

        // if (baseIdx < 0) baseIdx = 0;
        if (verIdx < 0) verIdx = ops.length;

        let _version: number | undefined;
        let _isRecovery: boolean = false;
        let ret;
        if (verIdx === 0) {
            const item = ops[verIdx];
            _version = item.cmd.isRecovery ? item.cmd.baseVer : (item.cmd.version - 1);
            _isRecovery = item.cmd.isRecovery;
            const op = item.op as IdOpRecord;
            let origin;
            if (this.savedOrigin) {
                origin = this.origin;
            } else {
                origin = op.origin; // 没有save的话，那么op只能是本地op
            }
            ret = apply(this.document,
                target, {
                data: origin,
                id: op.id,
                type: op.type,
                path: op.path,
            }, item.cmd.dataFmtVer);
        } else {
            const op = ops[verIdx - 1];
            if (!op) throw new Error("not found");
            _version = op.cmd.isRecovery ? op.cmd.baseVer : (op.cmd.version - 1);
            _isRecovery = op.cmd.isRecovery;
            ret = apply(this.document, target, op.op as IdOp, op.cmd.dataFmtVer);
        }
        if (_version && ret && (typeof ret.data2 === 'object') && ret.data2.id) {
            const updateVers = new Map<string, { ver: number, isRecovery: boolean }>();
            updateVers.set(ret.data2.id, { ver: _version, isRecovery: _isRecovery })
            return updateVers;
        }
    }

}