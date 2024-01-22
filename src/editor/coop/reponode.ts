import { Shape } from "../../data/shape";
import { Op, OpType } from "../../coop/common/op";
import { OpItem } from "../../coop/common/repo";

// 现有的op
// arrayop: textshape, tablecell, variable
// idop: shape, style, fill, border, shadow, text, variable...
// crdttreeop: shapetree
// crdtarrayop: pagelist, fills, borders, shadows, tablecellrowheights, tablecellcolwidths...

export class RepoNode {

    type: OpType; // 一个节点仅可能接收一种类型的op
    ops: OpItem[] = []; // 与服务端保持一致的op
    localops: OpItem[] = []; // 本地op, 本地op的order一定是在ops之后的
    localindex: number = 0; // node 也需要支持undo redo

    // 数据可能被替换？
    // _data: any; // op应用的对象
    // get data() {
    //     return this._data;
    // }
    constructor(type: OpType = OpType.None) {
        this.type = type;
    }

    // 处理远程op
    processRemote(ops: OpItem[], needUpdateFrame: Shape[]) {
        // this.ops.push(...ops);
        // apply
    }
    // 处理本地提交已返回的op
    processPosted(ops: OpItem[]) {
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const op2 = this.ops.shift();
            // check
            if (op.cmd.id !== op2?.cmd.id) throw new Error("op not match");
            this.ops.push(op);
        }
    }
    // 处理本地op
    processLocal(ops: OpItem[], needApply: boolean, needUpdateFrame: Shape[]) {
        this.localops.push(...ops);
    }
    // undo localops
    processUndoLocal(ops: OpItem[], needApply: boolean, needUpdateFrame: Shape[]) { // localops undo后还需要保留op，并持续进行变换，直到被新的op覆盖（用于redo，主要是textop）
        for (let i = ops.length - 1; i >= 0; i--) {
            const op = ops[i];
            const op2 = this.localops.pop();
            // check
            if (op.cmd.id !== op2?.cmd.id) throw new Error("op not match");
        }
    }
    // redo
    processRedoLocal(ops: OpItem[], needApply: boolean, needUpdateFrame: Shape[]) {
    }
}

export class RepoNodePath {

    node: RepoNode | undefined;
    childs: Map<string, RepoNodePath> = new Map();

    buildAndGet(op: Op, path: string[], creator: (op: Op) => RepoNode): RepoNode {
        if (path.length === 0) {
            if (!this.node) this.node = creator(op);
            // check
            if (this.node.type !== op.type) throw new Error("wrong node, expect node type: " + op.type + ", but get: " + this.node.type);
            return this.node;
        }
        let child = this.childs.get(path[0]);
        if (!child) {
            // bulid
            child = new RepoNodePath();
            this.childs.set(path[0], child);
        }
        return child.buildAndGet(op, path.slice(1), creator);
    }
}