import { Shape } from "../../data/shape";
import { Op, OpType } from "../../coop/common/op";
import { Cmd, OpItem } from "../../coop/common/repo";


export abstract class RepoNode {

    type: OpType; // 一个节点仅可能接收一种类型的op
    ops: OpItem[] = []; // 与服务端保持一致的op
    localops: OpItem[] = []; // 本地op, 本地op的order一定是在ops之后的

    constructor(type: OpType) {
        this.type = type;
    }

    abstract receive(ops: OpItem[], needUpdateFrame: Shape[]): void;
    abstract receiveLocal(ops: OpItem[]): void;
    abstract commit(ops: OpItem[]): void;

    abstract undo(ops: OpItem[], needUpdateFrame: Shape[], receiver?: Cmd): void;
    abstract redo(ops: OpItem[], needUpdateFrame: Shape[], receiver?: Cmd): void;
    abstract dropOps(ops: OpItem[]): void;

    abstract roll2Version(baseVer: number, version: number, needUpdateFrame: Shape[]): void;

    abstract undoLocals(): void;
    abstract redoLocals(): void;
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

    get(path: string[]): RepoNode | undefined {
        if (path.length === 0) return this.node;
        const child = this.childs.get(path[0]);
        return child && child.get(path.slice(1));
    }

    get2(path: string[]): RepoNodePath | undefined {
        if (path.length === 0) return this;
        const child = this.childs.get(path[0]);
        return child && child.get2(path.slice(1));
    }

    undoLocals() {
        const roll = (node: RepoNodePath) => {
            node.node?.undoLocals();
            node.childs.forEach(roll);
        }
        roll(this);
    }
    redoLocals() {
        const roll = (node: RepoNodePath) => {
            node.node?.redoLocals();
            node.childs.forEach(roll);
        }
        roll(this);
    }

    // 将数据回退或者前进到特定版本
    roll2Version(path: string[], baseVer: number, version: number, needUpdateFrame: Shape[]) {
        // get
        let node: RepoNodePath = this;
        while (path.length > 0) {
            const n = node.childs.get(path[0]);
            if (!n) return; // throw new Error("path not exist");
            node = n;
            path = path.slice(1);
        }
        const roll = (node: RepoNodePath) => {
            node.node?.roll2Version(baseVer, version, needUpdateFrame);
            node.childs.forEach(roll);
        }
        roll(node);
    }
}