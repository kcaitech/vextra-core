import { OpItem } from "coop/common/repo";
import { RepoNode } from "./reponode";
import { OpType } from "../../coop/common/op";
import { Text } from "../../data/text";
import { transform } from "../../coop/common/arrayoptransform";
import { Page } from "../../data/page";
import { ArrayOp, ArrayOpType } from "../../coop/common/arrayop";
import { ParaAttrSetter, SpanAttrSetter } from "../../data/text";
import { TextOpAttr, TextOpInsert } from "../../coop/client/textop";
import { Shape } from "../../data/shape";

// todo 考虑variable的text是string的情况
function apply(text: Text, item: OpItem) {
    // todo text 需要import
    if (item.op.type !== OpType.Array) {
        throw new Error("not array op");
    }
    const op = item.op as ArrayOp;
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
            break;
        case ArrayOpType.Remove:
            text.deleteText(op.start, op.length);
            break;
        case ArrayOpType.Attr:
            if (!(op instanceof TextOpAttr)) throw new Error("not text attr op");
            const key = op.props.key;
            const value = op.props.value;
            const index = op.start;
            const length = op.length;
            if (op.props.target === "span") {
                text.formatText(index, length, key, value);
            }
            // para
            else if (key === "bulletNumbersType") {
                text.setBulletNumbersType(value, index, length);
            }
            else if (key === "bulletNumbersStart") {
                text.setBulletNumbersStart(value, index, length);
            }
            else if (key === "bulletNumbersBehavior") {
                text.setBulletNumbersBehavior(value, index, length);
            }
            else if (key === "indent") {
                text.setParaIndent(value, index, length);
            }
            else {
                text.formatPara(index, length, key, value);
            }
            break;
        case ArrayOpType.Selection:
            break; // todo
    }
}

export class TextRepoNode extends RepoNode {

    private page: Page;

    constructor(page: Page) {
        super(OpType.Array);
        this.page = page;
    }

    processRemote(ops: OpItem[], needUpdateFrame: Shape[]): void {
        if (ops.length === 0) return;
        this.ops.push(...ops);
        const text: Text = this.page.getOpTarget(ops[0].op.path); // todo text 是string的情况？

        if (this.localops.length === 0) {
            if (text) for (let i = 0; i < ops.length; i++) {
                apply(text, ops[i]);
            }
            return;
        }
        // 需要变换
        const remote = ops.map(op => op.op as ArrayOp);
        const local = this.localops.map(op => op.op as ArrayOp);
        const { lhs, rhs } = transform(remote, local);

        // apply remote(lhs)
        if (text) for (let i = 0; i < ops.length; i++) {
            apply(text, { cmd: ops[i].cmd, op: lhs[i] });
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
}