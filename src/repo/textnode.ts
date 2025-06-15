/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { RepoNode, RepoNodePath } from "./base";
import { OpType } from "../operator";
import { Text } from "../data/text/text";
import { transform } from "./arrayoptransform";
import { ArrayOp, ArrayOpSelection, ArrayOpType } from "../operator";
import { TextOpAttr, TextOpAttrRecord, TextOpInsert, TextOpInsertRecord, TextOpRemove, TextOpRemoveRecord } from "../operator";
import { Cmd, OpItem } from "./types";
import { Document } from "../data/document";
import { ISave4Restore } from "./types";
import { IImportContext, importColor, importGradient, importParaAttr, importSpanAttr, importText } from "../data/baseimport";
import { FMT_VER_latest } from "../data/fmtver";

// todo 考虑text是string?
function apply(document: Document, text: Text, op: ArrayOp) {
    // todo text 需要import
    if (op.type !== OpType.Array) {
        throw new Error("not array op");
    }
    const ctx: IImportContext = new class implements IImportContext {
        document: Document = document;
        curPage: string = ""; // 这个用于判断symbol 可以不设置
        fmtVer: string = FMT_VER_latest
    };
    // const op = _op as ArrayOp;
    switch (op.type1) {
        case ArrayOpType.None: break;
        case ArrayOpType.Insert:
            if (!(op instanceof TextOpInsert)) throw new Error("not text insert op");
            if (op.text.type === "simple") {
                const attr = op.text.props?.attr ? importSpanAttr(op.text.props?.attr) : undefined;
                const paraAttr = op.text.props?.paraAttr ? importParaAttr(op.text.props?.paraAttr) : undefined;
                text.insertText(op.text.text, op.start, { attr, paraAttr });
            } else if (op.text.type === "complex") {
                const _text = importText(op.text.text, ctx)
                text.insertFormatText(_text, op.start);
            } else {
                throw new Error("not valid text insert op");
            }
            return new TextOpInsertRecord(op.id, op.path, op.order, op.start, op.length, op.text, text);
        case ArrayOpType.Remove:
            const del = text.deleteText(op.start, op.length);
            if (del) return new TextOpRemoveRecord(op.id, op.path, op.order, op.start, op.length, del, text);
            break;
        case ArrayOpType.Attr:
            if (!(op instanceof TextOpAttr)) throw new Error("not text attr op");
            const key = op.props.key;
            let value = op.props.value;
            const index = op.start;
            const length = op.length;
            // import value
            if (typeof value === 'object' && value.typeId) {
                if (value.typeId === 'color') {
                    value = importColor(value, ctx);
                } else if (value.typeId === "gradient") {
                    value = importGradient(value, ctx);
                } else {
                    throw new Error('need import ' + value.typeId)
                }
            }
            if (op.props.target === "span") {
                const ret = text.formatText(index, length, key, value);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret, text);
            }
            // para
            else if (key === "bulletNumbersType") {
                const ret = text.setBulletNumbersType(value, index, length);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret, text);
            }
            else if (key === "bulletNumbersStart") {
                const ret = text.setBulletNumbersStart(value, index, length);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret, text);
            }
            else if (key === "bulletNumbersBehavior") {
                const ret = text.setBulletNumbersBehavior(value, index, length);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret, text);
            }
            else if (key === "indent") {
                const ret = text.setParaIndent(value, index, length);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret, text);
            }
            else {
                const ret = text.formatPara(index, length, key, value);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret, text);
            }
            break;
        case ArrayOpType.Selection:
            break;
    }
}

function revert(item: OpItem) {
    if (item.op.type !== OpType.Array) {
        throw new Error("not array op");
    }
    const op = item.op as ArrayOp;
    return revertOp(op);
}
function revertOp(op: ArrayOp) {
    // if (item.op.type !== OpType.Array) {
    //     throw new Error("not array op");
    // }
    // const op = item.op as ArrayOp;
    switch (op.type1) {
        case ArrayOpType.None: return op;
        case ArrayOpType.Insert:
            if (!(op instanceof TextOpInsertRecord)) throw new Error("not text insert op");
            // 不用TextOpRemoveRecord，变换后不一定是原来的值
            return new TextOpRemove("", op.path, Number.MAX_SAFE_INTEGER, op.start, op.length);
        case ArrayOpType.Remove:
            if (!(op instanceof TextOpRemoveRecord)) throw new Error("not text remove op");
            return new TextOpInsert("", op.path, Number.MAX_SAFE_INTEGER, op.start, op.length, { type: "complex", text: op.text });
        case ArrayOpType.Attr:
            if (!(op instanceof TextOpAttrRecord)) throw new Error("not text attr op");
            const origin = op.origin;
            const key = op.props.key;
            const ops: TextOpAttr[] = [];
            origin.forEach((val) => {
                ops.push(new TextOpAttr("", op.path, Number.MAX_SAFE_INTEGER, val.index, val.len, { target: op.props.target, key, value: val.value }))
            })
            return ops;
        case ArrayOpType.Selection:
            return (op as ArrayOpSelection).clone(); // 这个id要保留
    }
}

function getOpTarget(op: ArrayOp) {
    switch (op.type1) {
        case ArrayOpType.None: return undefined;
        case ArrayOpType.Insert:
            if (!(op instanceof TextOpInsertRecord)) throw new Error("not text insert op");
            // 不用TextOpRemoveRecord，变换后不一定是原来的值
            return op.target;
        case ArrayOpType.Remove:
            if (!(op instanceof TextOpRemoveRecord)) throw new Error("not text remove op");
            return op.target;
        case ArrayOpType.Attr:
            if (!(op instanceof TextOpAttrRecord)) throw new Error("not text attr op");
            return op.target;
        case ArrayOpType.Selection:
            return undefined;
    }
}

function unapply(document: Document, op: ArrayOp) {
    const ret: ArrayOp[] = [];
    const rop = revertOp(op);
    if (rop instanceof ArrayOpSelection) {
        ret.push(rop);
    } else if (Array.isArray(rop)) {
        const text = getOpTarget(op);
        for (let i = 0; i < rop.length; ++i) {
            const op = rop[i];
            const r = text && apply(document, text, op);
            if (!r) throw new Error();
            ret.push(r);
        }
    } else if (rop) {
        const text = getOpTarget(op);
        const r = text && apply(document, text, rop);
        if (!r) throw new Error();
        ret.push(r);
    }
    return ret;
}
// 也是走undo-do-redo，与服务端数据对齐（目前完备的可以前进后退版本的方式）
export class TextRepoNode extends RepoNode {

    private document: Document;
    private selection: ISave4Restore | undefined;

    // undo时缓存的本地未上传的op
    popedOps: { cmd: Cmd, ops: ArrayOp[], otpath: OpItem[], refIdx: number }[] = [];

    constructor(parent: RepoNodePath, document: Document, selection: ISave4Restore | undefined) {
        super(OpType.Array, parent);
        this.document = document;
        this.selection = selection;
    }

    getOpTarget(path: string[]) {
        const page = this.document.pagesMgr.getSync(path[0]);
        if (page) return page.getOpTarget(path);
    }

    // 与ops变换
    // todo 异常情况，同一batch的cmd没有同时回来
    private _otreceive(ops: OpItem[]) {
        // 相同版本的进行分段
        const segs: OpItem[][] = []; // 一个批次一个批次的变换
        for (let i = 0; i < ops.length;) {
            const s: OpItem[] = [];
            segs.push(s);
            const ver = ops[i].cmd.batchId;
            s.push(ops[i]);
            ++i;
            for (; i < ops.length; ++i) {
                if (ops[i].cmd.batchId !== ver) break;
                s.push(ops[i]);
            }
        }

        for (let i = 0; i < segs.length; ++i) {
            const s = segs[i];
            const baseVer = s[0].cmd.baseVer; // 同一批次的baseVer是一样的
            const index = this.ops.findIndex((item) => (item.cmd.version - baseVer) > 0);
            if (index >= 0) {
                const lhs = this.ops.slice(index).map((item) => item.op as ArrayOp);
                const rhs = s.map(op => op.op as ArrayOp);
                const trans = transform(lhs, rhs);
                // replace op
                const _rhs = trans.rhs;
                for (let j = 0; j < _rhs.length; j++) {
                    const originop = s[j].op;
                    const cmd = s[j].cmd;
                    const op = _rhs[j];
                    s[j].op = op;
                    const idx = cmd.ops.indexOf(originop);
                    if (idx < 0) throw new Error();
                    cmd.ops.splice(idx, 1, op);
                }
            }
            this.ops.push(...s);
        }
    }

    undoLocals(): void {
        for (let i = this.localops.length - 1; i >= 0; i--) {
            const op = this.localops[i];
            unapply(this.document, op.op as ArrayOp);
        }
    }

    redoLocals(): void {
        for (let i = 0; i < this.localops.length; i++) {
            const op = this.localops[i];
            const target = getOpTarget(op.op as ArrayOp);
            target && apply(this.document, target, op.op as ArrayOp);
        }
    }

    // todo 上级要判断baseVer是存在的
    receive(ops: OpItem[]) {
        if (ops.length === 0) return;

        // 服务端过来的先进行本地变换
        this._otreceive(ops);

        // undo-do-redo
        // undo
        for (let i = this.localops.length - 1; i >= 0; i--) {
            const op = this.localops[i];
            unapply(this.document, op.op as ArrayOp);
        }

        const target = this.getOpTarget(ops[0].op.path);
        // do
        if (target) for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const record = apply(this.document, target, op.op as ArrayOp);
            if (record) {
                // replace op
                const idx = op.cmd.ops.indexOf(op.op);
                op.op = record;
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, record);
            }
        }
        // this.ops.push(...ops); // _otreceive已经push了

        let selectionOp = this.selection?.saveText(ops[0].op.path);
        // transform local
        const remote = ops.map(op => op.op as ArrayOp);
        const local = this.localops.map(op => op.op as ArrayOp);
        if (selectionOp) local.push(selectionOp);
        const { lhs, rhs } = transform(remote, local);
        if (selectionOp) selectionOp = rhs.pop() as ArrayOpSelection;
        // replace local
        for (let i = 0; i < this.localops.length; i++) {
            const item = this.localops[i];
            const cmd = item.cmd;
            const origin = item.op;
            if ((origin as ArrayOp).type1 === ArrayOpType.Selection) { // 原位替换
                const t0 = origin as ArrayOp;
                const t1 = rhs[i] as ArrayOp;
                t0.start = t1.start;
                t0.length = t1.length;
                continue;
            }
            item.op = rhs[i];
            const index = cmd.ops.indexOf(origin);
            cmd.ops.splice(index, 1, item.op); // replace
        }

        // redo
        // todo
        if (target) {
            for (let i = 0; i < this.localops.length; i++) {
                const op = this.localops[i];
                if ((op.op as ArrayOp).type1 === ArrayOpType.Selection) continue;// 选区不用执行
                const record = apply(this.document, target, op.op as ArrayOp);
                if (record) {
                    // replace op
                    const idx = op.cmd.ops.indexOf(op.op);
                    op.op = record;
                    if (idx < 0) throw new Error();
                    op.cmd.ops.splice(idx, 1, record);
                } else {
                    const idx = op.cmd.ops.indexOf(op.op);
                    if (idx < 0) throw new Error();
                    op.cmd.ops.splice(idx, 1); // 选区过滤掉了
                    this.localops.splice(i, 1);
                    --i;
                }
            }
        } else {
            for (let i = 0; i < this.localops.length; i++) {
                const op = this.localops[i];
                (op.op as any).target = undefined; // 不可再undo
            }
        }

        if (selectionOp) this.selection?.restoreText(selectionOp);

        // console.log("receive", this.localops.slice(0))
    }
    receiveLocal(ops: OpItem[]) {
        // check
        if (ops.length === 0) throw new Error();
        if (ops.length > this.localops.length) throw new Error();
        // const savelocals = this.localops.slice(0);
        for (let i = 0; i < ops.length;) {
            const op = ops[i]; // 可能有selectionop

            let opcount = 1;
            let localcount = 0;
            for (let j = i + 1; j < ops.length; ++j) {
                const opj = ops[j];
                if (opj.cmd.id !== op.cmd.id) break;
                ++opcount;
            }

            while (this.localops.length > 0 && this.localops[0].cmd.id === op.cmd.id) {
                const op2 = this.localops.shift()!;
                ++localcount;
                if ((op2.op as ArrayOp).type1 !== ArrayOpType.Selection) {
                    this.ops.push(op2);
                }
            }

            if (opcount !== localcount) throw new Error("op not match")

            i += opcount;
        }
        // console.log("receiveLocal", ops)
    }
    commit(ops: OpItem[]) {
        // // check
        // ops.forEach((op) => revertOp(op.op as ArrayOp));
        // if (ops.length === 1 && (ops[0].op as ArrayOp).type1 === ArrayOpType.Selection) throw new Error();

        this.localops.push(...ops);
        // console.log("commit", this.localops.slice(0))
    }

    // todo
    // undo时由外面cmds自行记录前置cmds，在redo时进行变换

    _popLocal(ops: OpItem[]) { // todo 这些也是要参与变换的，在redo的时候才不会错
        // check
        if (this.localops.length < ops.length) {
            console.log(this.localops, ops);
            throw new Error();
        }
        const cmd = ops[0].cmd;
        const item: { cmd: Cmd, ops: ArrayOp[], otpath: OpItem[], refIdx: number } = { cmd, ops: [], otpath: [], refIdx: this.ops.length - 1 }
        for (let i = ops.length - 1; i >= 0; i--) {
            const op = ops[i];
            const op2 = this.localops.pop();
            // check
            if (op.cmd !== op2?.cmd) throw new Error("op not match");
            item.ops.unshift(op2.op as ArrayOp);
        }
        item.otpath = this.localops.slice(0);
        this.popedOps.push(item);
        // console.log("_popLocal", this.localops.slice(0))
    }
    dropOps(ops: OpItem[]): void {
        // 这里的ops也有可能是新的需要上传的ops
        // 将undoops丢掉
        this.popedOps.length = 0;
    }

    undo(ops: OpItem[], receiver?: Cmd) { // 自己popLocal & 自己commit ?
        if (ops.length === 0) throw new Error();
        // check 一次只有一个cmd
        let realOpCount = 0;
        for (let i = 0; i < ops.length; i++) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
            const type = (ops[i].op as ArrayOp).type1;
            if (type !== ArrayOpType.Selection) ++realOpCount;
        }

        const curops: OpItem[] = this.ops.concat(...this.localops.filter((op) => ((op.op as ArrayOp).type1 !== ArrayOpType.Selection)));
        if (curops.length === 0) {
             // 是可能的。在组件的变量编辑时，记录的是override前的变量的selection位置，当前节点可能只有一个selectionop。但这会出问题
             // 另外是空文本框，被自动删除，此时也仅有一个selectionop
             // 现在外面cmd commit时过滤掉仅一个selection的op。
            throw new Error();
        }
        if (curops.length < realOpCount) throw new Error();

        // 需要变换
        const index = ((curops as any).findLastIndex((v: OpItem) => (v.cmd.id === ops[0].cmd.id))) - realOpCount + 1;
        if (index < 0) throw new Error("not find ops");
        // check
        for (let i = 0; i < realOpCount; i++) {
            if (curops[index + i].cmd.id !== ops[0].cmd.id) {
                throw new Error("cmd");
            }
        }
        // revert
        let revertops = ops.map((item) => {
            const rop = revert(item);
            if (Array.isArray(rop)) rop.forEach(op => (op as any).target = (item.op as any).target)
            else (rop as any).target = (item.op as any).target;
            return rop;
        }).reverse().reduce((res, op) => {
            if (Array.isArray(op)) res.push(...op.slice(0).reverse());
            else res.push(op);
            return res;
        }, [] as ArrayOp[]);
        const cur = curops.slice(index + realOpCount).map(op => op.op) as ArrayOp[];
        if (cur.length > 0) {
            // 先调整cur中"ZZZZZZZZZZZ"order的op
            let count = 0;
            for (let i = cur.length - 1; i >= 0; --i) {
                if (cur[i].order !== Number.MAX_SAFE_INTEGER) break;
                ++count;
                cur[i].order = (Number.MAX_SAFE_INTEGER - cur.length - i);
            }
            const { lhs, rhs } = transform(cur, revertops);
            rhs.forEach((v, i) => (v as any).target = (revertops[i] as any).target);

            revertops = rhs;

            // 还原cur order
            for (let i = cur.length - count; i < cur.length; ++i) {
                cur[i].order = Number.MAX_SAFE_INTEGER;
            }
        }
        const record = revertops.map((op: ArrayOp) => (op as any).target ? (apply(this.document, (op as any).target, op) || op) : op);
        // update to ops
        if (receiver) {
            // todo transform popedops
            receiver.ops.push(...record); // todo 这里op是reverse的,而原cmd不是
            this.commit(record.map(op => ({ cmd: receiver, op })))
        } else {
            // todo 需要记录ot path
            this._popLocal(ops);
            // replace op // 不替换，在redo时可以直接应用 // 不替换选区不对
            for (let i = 0; i < ops.length; i++) {
                const op = ops[i];
                const idx = op.cmd.ops.indexOf(op.op);
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1);
            }
            ops[0].cmd.ops.push(...record);
        }
    }
    redo(ops: OpItem[], receiver?: Cmd) {

        // 两种情况
        // 1. undo时新提交的ops，则直接变换后undo，
        // 2. undo时pop出去的ops，根据otpath进行变换后应用

        // 情况1 ops在localops中 或者 cmd 已经提交
        if (receiver /*|| this.localops.length > 0 && ops[0].cmd === this.localops[this.localops.length - 1].cmd*/) {
            // console.log("redo - undo")
            return this.undo(ops, receiver);
        }

        if (ops.length === 0) throw new Error();
        // check 一次只有一个cmd
        for (let i = 1; i < ops.length; i++) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
        }

        // 情况2 ops在popedOps中
        // 需要根据otpath进行变换
        if (this.popedOps.length === 0) throw new Error();
        const cmd = ops[0].cmd;
        const itemIdx = this.popedOps.findIndex((v) => v.cmd === cmd);
        if (itemIdx < 0) throw new Error("not find ops");
        const item = this.popedOps.splice(itemIdx, 1)[0];
        if (!item) throw new Error("not find ops");

        const revertops = ops.map(revert).reduce((res, op) => {
            if (Array.isArray(op)) res.push(...op.slice(0).reverse());
            else res.push(op);
            return res;
        }, [] as ArrayOp[]).reverse();

        // 开始变换
        const curops: OpItem[] = this.ops.slice(item.refIdx + 1).concat(...this.localops);
        const otpath = item.otpath;
        let lhs = otpath.map(item => item.op as ArrayOp).concat(...revertops);
        for (let i = 0; i < otpath.length; i++) {
            const c = otpath[i].cmd;
            const idx = curops.findIndex((v) => v.cmd === c);
            if (idx < 0) throw new Error();

            const rhs = curops.slice(0, idx).map((v) => v.op as ArrayOp);
            const t = transform(lhs, rhs);

            let count = 1;
            for (; i < otpath.length - 1 && otpath[i + 1].cmd === c;) {
                if (curops[idx + count].cmd !== c) throw new Error();
                ++count;
                ++i;
            }

            curops.splice(0, idx + count);

            lhs = t.lhs;
            lhs.splice(0, count);
        }
        // 还要变换一次
        if (curops.length > 0) {
            const t = transform(lhs, curops.map((v) => v.op as ArrayOp));
            lhs = t.lhs;
        }

        if (lhs.length !== revertops.length) throw new Error();
        const text: Text = this.getOpTarget(ops[0].op.path); // todo text 是string的情况？
        const record = text ? lhs.map((op) => apply(this.document, text, op) || op) : lhs;
        // update to ops

        // replace op
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const idx = op.cmd.ops.indexOf(op.op);
            if (idx < 0) throw new Error();
            op.cmd.ops.splice(idx, 1);
        }
        ops[0].cmd.ops.push(...record);
        this.commit(record.map(op => ({ cmd: ops[0].cmd, op })))
    }
    roll2Version(baseVer: number, version: number): Map<string, {ver: number, isRecovery: boolean}> | undefined {
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
        for (let i = baseIdx; i < verIdx; i++) {
            const op = ops[i];
            let record;
            try {
                record = apply(this.document, target, op.op as ArrayOp);
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
    }
}