import { RepoNode } from "./base";
import { Op, OpType } from "../../coop/common/op";
import { Text } from "../../data/text";
import { transform } from "../../coop/common/arrayoptransform";
import { Page } from "../../data/page";
import { ArrayOp, ArrayOpType } from "../../coop/common/arrayop";
import { TextOpAttr, TextOpAttrRecord, TextOpInsert, TextOpInsertRecord, TextOpRemove, TextOpRemoveRecord } from "../../coop/client/textop";
import { Shape } from "../../data/shape";
import { Cmd, OpItem } from "../../coop/common/repo";

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

    private page: Page;

    // 需要参与变换
    popedOps: OpItem[] = [];

    constructor(page: Page) {
        super(OpType.Array);
        this.page = page;
    }

    // 与ops变换
    private otReceive(ops: OpItem[]) {
        // 相同版本的进行分段
        const segs: OpItem[][] = [];
        for (let i = 0; i < ops.length;) {
            const s: OpItem[] = [];
            segs.push(s);
            const ver = ops[i].cmd.baseVer;
            s.push(ops[i]);
            ++i;
            for (; i < ops.length; ++i) {
                if (ops[i].cmd.baseVer !== ver) break;
                s.push(ops[i]);
            }
        }
        for (let i = 0; i < segs.length; ++i) {
            const s = segs[i];
            const baseVer = s[0].cmd.baseVer;
            const index = this.ops.findIndex((item) => item.cmd.version > baseVer);
            if (index < 0) continue;
            const lhs = this.ops.slice(index).map((item) => item.op as ArrayOp);
            const rhs = s.map(op => op.op as ArrayOp);
            const trans = transform(lhs, rhs);
            // replace op
            const _rhs = trans.rhs;
            for (let j = 0; j < _rhs.length; j++) {
                s[j].op = _rhs[j];
            }
        }
    }

    // todo 上级要判断baseVer是存在的
    receive(ops: OpItem[], needUpdateFrame: Shape[]) {
        if (ops.length === 0) return;

        // 服务端过来的先进行本地变换
        this.otReceive(ops);

        const target = this.page.getOpTarget(ops[0].op.path);
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
        this.ops.push(...ops);

        // transform local
        const remote = ops.map(op => op.op as ArrayOp);
        const local = this.localops.concat(this.popedOps).map(op => op.op as ArrayOp);
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
        // replace poped
        for (let i = 0; i < this.popedOps.length; i++) {
            const item = this.popedOps[i];
            const cmd = item.cmd;
            const origin = item.op;
            item.op = rhs[i + this.localops.length];
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
    popLocal(ops: OpItem[]) { // todo 这些也是要参与变换的，在redo的时候才不会错
        // check
        if (this.localops.length < ops.length) throw new Error();
        for (let i = ops.length - 1; i >= 0; i--) {
            const op = ops[i];
            const op2 = this.localops.pop();
            // check
            if (op.cmd !== op2?.cmd) throw new Error("op not match");
            this.popedOps.push(op2);
        }
    }
    dropOps(ops: OpItem[]): void {
        // 将undoops丢掉
        if (this.popedOps.length !== ops.length) throw new Error();
        for (let i = ops.length - 1; i >= 0; i--) {
            const op = ops[i];
            const op2 = this.popedOps.pop();
            // check
            if (op.cmd !== op2?.cmd) throw new Error("op not match");
        }
    }

    _undo(ops: OpItem[]) {
        if (ops.length === 0) throw new Error();
        // check 一次只有一个cmd
        for (let i = 1; i < ops.length; i++) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
        }

        const curops: OpItem[] = this.ops.concat(...this.localops);
        if (curops.length === 0) throw new Error();
        if (curops.length < ops.length) throw new Error();

        const text: Text = this.page.getOpTarget(ops[0].op.path); // todo text 是string的情况？
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
            if (Array.isArray(op)) res.push(...op);
            else res.push(op);
            return res;
        }, [] as ArrayOp[]);
        const cur = curops.slice(index + ops.length).map(op => op.op) as ArrayOp[];
        if (cur.length > 0) {
            const { lhs, rhs } = transform(cur, revertops);
            revertops = rhs;
        }
        const record = text ? revertops.map((op) => apply(text, op) || op) : revertops;
        return record;
    }

    undo(ops: OpItem[], needUpdateFrame: Shape[], receiver?: Cmd) { // 自己popLocal & 自己commit ?
        const saveops: Op[] | undefined = (!receiver) ? ops.map(op => op.op) : undefined;
        const record = this._undo(ops);
        // update to ops
        if (receiver) {
            receiver.ops.push(...record);
            this.commit(record.map(op => ({ cmd: receiver, op })))
        } else {
            this.popLocal(ops);
            // replace op
            for (let i = 0; i < ops.length; i++) {
                const op = ops[i];
                const saveop = saveops![i];
                const idx = op.cmd.ops.indexOf(saveop);
                if (idx < 0) throw new Error();
                op.cmd.ops.splice(idx, 1);
            }
            ops[0].cmd.ops.push(...record);
        }
    }
    redo(ops: OpItem[], needUpdateFrame: Shape[], receiver?: Cmd) {

        ops.reverse();
        const saveops: Op[] | undefined = (!receiver) ? ops.map(op => op.op) : undefined;

        const record = this._undo(ops);
        // update to ops
        if (receiver) {
            receiver.ops.push(...record);
            this.commit(record.map(op => ({ cmd: receiver, op })))
        } else {
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
    }
    roll2Version(baseVer: number, version: number, needUpdateFrame: Shape[]) {
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