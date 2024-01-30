import { RepoNode } from "./base";
import { Op, OpType } from "../../coop/common/op";
import { Text } from "../../data/text";
import { transform } from "../../coop/client/arrayoptransform";
import { ArrayOp, ArrayOpType } from "../../coop/client/arrayop";
import { TextOpAttr, TextOpAttrRecord, TextOpInsert, TextOpInsertRecord, TextOpRemove, TextOpRemoveRecord } from "../../coop/client/textop";
import { Shape } from "../../data/shape";
import { Cmd, OpItem } from "../../coop/common/repo";
import { Document } from "../../data/document";

// todo 考虑text是string?
function apply(text: Text, op: ArrayOp) {
    // todo text 需要import
    if (op.type !== OpType.Array) {
        throw new Error("not array op");
    }
    // const op = _op as ArrayOp;
    switch (op.type1) {
        case ArrayOpType.None: break;
        case ArrayOpType.Insert:
            if (!(op instanceof TextOpInsert)) throw new Error("not text insert op");
            if (op.text.type === "simple") {
                text.insertText(op.text.text, op.start, { attr: op.text.props?.attr, paraAttr: op.text.props?.paraAttr });
            } else if (op.text.type === "complex") {
                text.insertFormatText(op.text.text, op.start);
            } else {
                throw new Error("not valid text insert op");
            }
            return new TextOpInsertRecord(op.id, op.path, op.order, op.start, op.length, op.text);
        case ArrayOpType.Remove:
            const del = text.deleteText(op.start, op.length);
            if (del) return new TextOpRemoveRecord(op.id, op.path, op.order, op.start, op.length, del);
            break;
        case ArrayOpType.Attr:
            if (!(op instanceof TextOpAttr)) throw new Error("not text attr op");
            const key = op.props.key;
            const value = op.props.value;
            const index = op.start;
            const length = op.length;
            if (op.props.target === "span") {
                const ret = text.formatText(index, length, key, value);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret);
            }
            // para
            else if (key === "bulletNumbersType") {
                const ret = text.setBulletNumbersType(value, index, length);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret);
            }
            else if (key === "bulletNumbersStart") {
                const ret = text.setBulletNumbersStart(value, index, length);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret);
            }
            else if (key === "bulletNumbersBehavior") {
                const ret = text.setBulletNumbersBehavior(value, index, length);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret);
            }
            else if (key === "indent") {
                const ret = text.setParaIndent(value, index, length);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret);
            }
            else {
                const ret = text.formatPara(index, length, key, value);
                if (ret.length > 0) return new TextOpAttrRecord(op.id, op.path, op.order, op.start, op.length, op.props, ret);
            }
            break;
        case ArrayOpType.Selection:
            break; // todo
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
    // todo text 需要import
    // if (item.op.type !== OpType.Array) {
    //     throw new Error("not array op");
    // }
    // const op = item.op as ArrayOp;
    switch (op.type1) {
        case ArrayOpType.None: return op;
        case ArrayOpType.Insert:
            if (!(op instanceof TextOpInsert)) throw new Error("not text insert op");
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
            return op;
    }
}

function unapply(text: Text, op: ArrayOp) {
    const ret = [];
    const rop = revertOp(op);
    if (Array.isArray(rop)) {
        for (let i = 0; i < rop.length; ++i) {
            const op = rop[i];
            const r = apply(text, op);
            if (!r) throw new Error();
            ret.push(r);
        }
    } else if (rop) {
        const r = apply(text, rop);
        if (!r) throw new Error();
        ret.push(r);
    }
    return ret;
}
// 也是走undo-do-redo，与服务端数据对齐（目前完备的可以前进后退版本的方式）
export class TextRepoNode extends RepoNode {

    private document: Document;

    // undo时缓存的本地未上传的op
    popedOps: { cmd: Cmd, ops: ArrayOp[], otpath: OpItem[], refIdx: number }[] = [];

    constructor(document: Document) {
        super(OpType.Array);
        this.document = document;
    }

    getOpTarget(path: string[]) {
        const page = this.document.pagesMgr.getSync(path[0]);
        if (page) return page.getOpTarget(path);
    }

    // 与ops变换
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
            const index = this.ops.findIndex((item) => item.cmd.version > baseVer);
            if (index < 0) continue;
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
                this.ops.push({ cmd, op });
                const idx = cmd.ops.indexOf(originop);
                if (idx < 0) throw new Error();
                cmd.ops.splice(idx, 1, op);
            }
        }
    }

    // todo 上级要判断baseVer是存在的
    receive(ops: OpItem[], needUpdateFrame: Shape[]) {
        if (ops.length === 0) return;

        // 服务端过来的先进行本地变换
        this._otreceive(ops);

        const target = this.getOpTarget(ops[0].op.path);
        // undo-do-redo
        // undo
        if (target) for (let i = this.localops.length - 1; i >= 0; i--) {
            const op = this.localops[i];
            unapply(target, op.op as ArrayOp);
        }

        // do
        if (target) for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const record = apply(target, op.op as ArrayOp);
            if (record) {
                // replace op
                op.op = record;
                const idx = op.cmd.ops.indexOf(op.op);
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1, record);
            }
        }

        // transform local
        const remote = ops.map(op => op.op as ArrayOp);
        const local = this.localops.map(op => op.op as ArrayOp);
        const { lhs, rhs } = transform(remote, local);
        // replace local
        for (let i = 0; i < this.localops.length; i++) {
            const item = this.localops[i];
            const cmd = item.cmd;
            const origin = item.op;
            item.op = rhs[i];
            const index = cmd.ops.indexOf(origin);
            cmd.ops.splice(index, 1, item.op); // replace
        }

        // redo
        for (let i = 0; i < this.localops.length; i++) {
            const op = this.localops[i];
            const record = apply(target, op.op as ArrayOp);
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
    commit(ops: OpItem[]) {
        this.localops.push(...ops);
    }
    _popLocal(ops: OpItem[]) { // todo 这些也是要参与变换的，在redo的时候才不会错
        // check
        if (this.localops.length < ops.length) throw new Error();
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
    }
    dropOps(ops: OpItem[]): void {
        // 这里的ops也有可能是新的需要上传的ops
        // 将undoops丢掉
        this.popedOps.length = 0;
    }

    undo(ops: OpItem[], needUpdateFrame: Shape[], receiver?: Cmd) { // 自己popLocal & 自己commit ?
        if (ops.length === 0) throw new Error();
        // check 一次只有一个cmd
        for (let i = 1; i < ops.length; i++) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
        }
        const saveops: Op[] | undefined = (!receiver) ? ops.map(op => op.op) : undefined;

        const curops: OpItem[] = this.ops.concat(...this.localops);
        if (curops.length === 0) throw new Error();
        if (curops.length < ops.length) throw new Error();

        const text: Text = this.getOpTarget(ops[0].op.path); // todo text 是string的情况？
        // 如果在最后，直接undo

        // 需要变换
        const index = ((curops as any/* 这里神奇的编译报错 */).findLastIndex((v: OpItem) => (v.cmd.id === ops[0].cmd.id))) - ops.length + 1;
        if (index < 0) throw new Error("not find ops");
        // check
        for (let i = 0; i < ops.length; i++) {
            if (curops[index + i].cmd.id !== ops[0].cmd.id) throw new Error("cmd");
        }
        // revert
        let revertops = ops.map(revert).reverse().reduce((res, op) => {
            if (Array.isArray(op)) res.push(...op.slice(0).reverse());
            else res.push(op);
            return res;
        }, [] as ArrayOp[]);
        const cur = curops.slice(index + ops.length).map(op => op.op) as ArrayOp[];
        if (cur.length > 0) {
            const { lhs, rhs } = transform(cur, revertops);
            revertops = rhs;
        }
        const record = text ? revertops.map((op) => apply(text, op) || op) : revertops;
        // update to ops
        if (receiver) {
            // todo transform popedops
            receiver.ops.push(...record);
            this.commit(record.map(op => ({ cmd: receiver, op })))
        } else {
            // todo 需要记录ot path
            this._popLocal(ops);
            // replace op
            // for (let i = 0; i < ops.length; i++) {
            //     const op = ops[i];
            //     const saveop = saveops![i];
            //     const idx = op.cmd.ops.indexOf(saveop);
            //     if (idx < 0) throw new Error();
            //     op.cmd.ops.splice(idx, 1);
            // }
            // ops[0].cmd.ops.push(...record);
        }
    }
    redo(ops: OpItem[], needUpdateFrame: Shape[], receiver?: Cmd) {

        // 两种情况
        // 1. undo时新提交的ops，则直接变换后undo，
        // 2. undo时pop出去的ops，根据otpath进行变换后应用

        // 情况1 ops在localops中 或者 cmd 已经提交
        if (receiver || this.localops.length > 0 && ops[0].cmd === this.localops[this.localops.length - 1].cmd) {
            return this.undo(ops, needUpdateFrame, receiver);
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

        // ops.reverse();
        const saveops = ops.map(op => op.op as ArrayOp);

        // let revertops = ops.map(revert).reduce((res, op) => {
        //     if (Array.isArray(op)) res.push(...op.slice(0).reverse());
        //     else res.push(op);
        //     return res;
        // }, [] as ArrayOp[]);

        // 开始变换
        const curops: OpItem[] = this.ops.slice(item.refIdx + 1).concat(...this.localops);
        const otpath = item.otpath;
        let lhs = otpath.map(item => item.op as ArrayOp).concat(...saveops);
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

        if (lhs.length !== ops.length) throw new Error();
        const text: Text = this.getOpTarget(ops[0].op.path); // todo text 是string的情况？
        const record = text ? lhs.map((op) => apply(text, op) || op) : lhs;
        // update to ops

        // replace op
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const saveop = saveops![i];
            const idx = op.cmd.ops.indexOf(saveop);
            if (idx < 0) throw new Error();
            op.cmd.ops.splice(idx, 1);
        }
        ops[0].cmd.ops.push(...record);
        this.commit(record.map(op => ({ cmd: ops[0].cmd, op })))
    }
    roll2Version(baseVer: number, version: number, needUpdateFrame: Shape[]) {
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
            const record = apply(target, op.op as ArrayOp);
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