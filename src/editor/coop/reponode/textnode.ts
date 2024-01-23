import { RepoNode } from "./reponode";
import { Op, OpType } from "../../../coop/common/op";
import { Text } from "../../../data/text";
import { transform } from "../../../coop/common/arrayoptransform";
import { Page } from "../../../data/page";
import { ArrayOp, ArrayOpType } from "../../../coop/common/arrayop";
import { TextOpAttr, TextOpAttrRecord, TextOpInsert, TextOpInsertRecord, TextOpRemove, TextOpRemoveRecord } from "../../../coop/client/textop";
import { Shape } from "../../../data/shape";
import { LocalOpItem as OpItem } from "../localcmd";

function recordapply(text: Text, _op: Op) {
    // todo text 需要import
    if (_op.type !== OpType.Array) {
        throw new Error("not array op");
    }
    const op = _op as ArrayOp;
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
    // todo text 需要import
    if (item.op.type !== OpType.Array) {
        throw new Error("not array op");
    }
    const op = item.op as ArrayOp;
    switch (op.type1) {
        case ArrayOpType.None: break;
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
            break; // todo
    }
}

function unapply(text: Text, item: OpItem) {
    // todo text 需要import
    if (item.op.type !== OpType.Array) {
        throw new Error("not array op");
    }
    const op = item.op as ArrayOp;
    switch (op.type1) {
        case ArrayOpType.None: break;
        case ArrayOpType.Insert:
            if (!(op instanceof TextOpInsert)) throw new Error("not text insert op");
            text.deleteText(op.start, op.length);
            break;
        case ArrayOpType.Remove:
            if (!(op instanceof TextOpRemoveRecord)) throw new Error("not text remove op");
            text.insertFormatText(op.text, op.start);
            break;
        case ArrayOpType.Attr:
            if (!(op instanceof TextOpAttrRecord)) throw new Error("not text attr op");
            const origin = op.origin;
            const key = op.props.key;
            if (op.props.target === "span") {
                origin.forEach((val) => {
                    text.formatText(val.index, val.len, key, val.value);
                })
            }
            // para
            else if (key === "bulletNumbersType") {
                origin.forEach((val) => {
                    text.setBulletNumbersType(val.value, val.index, val.len);
                })
            }
            else if (key === "bulletNumbersStart") {
                origin.forEach((val) => {
                    text.setBulletNumbersStart(val.value, val.index, val.len);
                })
            }
            else if (key === "bulletNumbersBehavior") {
                origin.forEach((val) => {
                    text.setBulletNumbersBehavior(val.value, val.index, val.len);
                })
            }
            else if (key === "indent") {
                origin.forEach((val) => {
                    text.setParaIndent(val.value, val.index, val.len);
                })
            }
            else {
                origin.forEach((val) => {
                    text.formatPara(val.index, val.len, key, val.value);
                })
            }
            break;
        case ArrayOpType.Selection:
            break; // todo
    }
}
// 也是走undo-do-redo，与服务端数据对齐（目前完备的可以前进后退版本的方式）
export class TextRepoNode extends RepoNode {

    private page: Page;

    constructor(page: Page) {
        super(OpType.Array);
        this.page = page;
    }

    // 将数据回退或者前进到特定版本
    roll2Version(version: number) {

    }

    processRemote(ops: OpItem[], needUpdateFrame: Shape[]): void {
        if (ops.length === 0) return;
        // todo 服务端不再进行变换，所以服务端过来的也要变换
        // todo 需要push record
        this.ops.push(...ops);
        // 如果text已经被删除？applyed=false, undo时不需要apply？
        const text: Text = this.page.getOpTarget(ops[0].op.path); // todo text 是string的情况？

        if (this.localops.length === 0) {
            if (text) for (let i = 0; i < ops.length; i++) {
                const record = recordapply(text, ops[i].op);
                if (record) ops[i] = { cmd: ops[i].cmd, op: record, applyed: true };
            }
            return;
        }
        // 需要变换 // todo 服务端不作变换
        const remote = ops.map(op => op.op as ArrayOp);
        const local = this.localops.map(op => op.op as ArrayOp);
        const { lhs, rhs } = transform(remote, local);

        // apply remote(lhs)
        if (text) for (let i = 0; i < lhs.length; i++) { // todo 乱了！
            const record = recordapply(text, lhs[i]);
            if (record) ops[i] = { cmd: ops[i].cmd, op: record, applyed: true };
        }

        // update local(rhs)
        for (let i = 0; i < this.localops.length; i++) {
            const item = this.localops[i];
            const cmd = item.cmd;
            const origin = item.op;
            item.op = rhs[i];
            const index = cmd.ops.indexOf(origin);
            cmd.ops.splice(index, 1, rhs[i]); // replace
        }
    }
    undo(ops: OpItem[], needUpdateFrame: Shape[]) {
        if (ops.length === 0) return;
        // check 一次只有一个cmd
        for (let i = 1; i < ops.length; i++) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
        }
        const text: Text = this.page.getOpTarget(ops[0].op.path); // todo text 是string的情况？
        // if ops in localcmds
        if (this.localops.length > 0) {
            if (this.localops[this.localops.length - 1].cmd !== ops[0].cmd) throw new Error("not last local cmd");
            if (this.localops.length < ops.length) throw new Error("");
            // check
            for (let i = 0; i < this.localops.length; i++) {
                if (this.localops[i].cmd !== ops[0].cmd) throw new Error("cmd");
            }
            if (this.localops.length > ops.length) {
                if (this.localops[this.localops.length - ops.length - 1].cmd === ops[0].cmd) throw new Error("");
            }
            if (text) for (let i = ops.length - 1; i >= 0; i--) { // todo 这里也有可能已经提交了
                unapply(text, ops[i]);
            }

            this.undolocalops.unshift(...ops.reverse());
            this.localops.splice(this.localops.length - ops.length, ops.length);
        } else { // else if ops in cmds
            // 需要做变换
            const index = this.ops.findLastIndex((v) => v.cmd.id === ops[0].cmd.id) - ops.length + 1;
            if (index < 0) throw new Error("not find ops");
            // check
            for (let i = 0; i < ops.length; i++) {
                if (this.ops[index + i].cmd.id !== ops[0].cmd.id) throw new Error("cmd");
            }

            // revert
            let revertops = ops.map(revert).filter((v) => v !== undefined).reverse() as ArrayOp[];
            // 当前已无本地ops，仅需要与已提交的ops进行变换

            const remote = this.ops.slice(index + ops.length).map(op => op.op) as ArrayOp[];
            if (remote.length > 0) {
                const { lhs, rhs } = transform(remote, revertops);
                revertops = rhs;
            }

            const record = revertops.map((op) => recordapply(text, op)).filter((v) => v !== undefined) as ArrayOp[];
            this.undoops.unshift(...record.map((op) => { return { cmd: ops[0].cmd, op: op } })); // 这是需要提交的op，在localops前

            return record;
        }
    }
    redo(ops: OpItem[], needUpdateFrame: Shape[]) {
        if (ops.length === 0) return;
        // check 一次只有一个cmd
        for (let i = 1; i < ops.length; i++) {
            if (ops[i].cmd !== ops[0].cmd) throw new Error("not single cmd");
        }
        const text: Text = this.page.getOpTarget(ops[0].op.path);
        // if ops in undocmds
        if (this.undoops.length > 0) {
            // check
            if (this.undoops.length < ops.length) throw new Error("cmd");
            for (let i = 0; i < ops.length; i++) {
                if (ops[0].cmd !== this.undoops[i].cmd) throw new Error("cmd");
            }
            if (this.undoops.length > ops.length) {
                if (this.undoops[ops.length].cmd === ops[0].cmd) throw new Error("cmd");
            }
            if (text) for (let i = ops.length - 1; i >= 0; i--) {
                unapply(text, ops[i]);
            }
            // todo
            // 不能。如果已经提交了呢？
            this.undoops.splice(0, ops.length);
            this.localops.push(...ops.reverse());

        }
        if (this.undolocalops.length > 0) {

        }
        // else 
    }
}