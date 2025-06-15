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
import { Cmd, OpItem } from "./types";


export abstract class RepoNode {


    type: OpType; // 一个节点仅可能接收一种类型的op
    ops: OpItem[] = []; // 与服务端保持一致的op
    localops: OpItem[] = []; // 本地op, 本地op的order一定是在ops之后的
    parent: RepoNodePath;

    constructor(type: OpType, parent: RepoNodePath) {
        this.type = type;
        this.parent = parent;
    }

    unshift(ops: OpItem[]): void {
        this.ops.unshift(...ops);
    }
    abstract receive(ops: OpItem[]): void;
    abstract receiveLocal(ops: OpItem[]): void;
    abstract commit(ops: OpItem[]): void;

    abstract undo(ops: OpItem[], receiver?: Cmd): void;
    abstract redo(ops: OpItem[], receiver?: Cmd): void;
    abstract dropOps(ops: OpItem[]): void;

    /**
     *
     * @return Map<nodeid, baseversion>
     */
    abstract roll2Version(baseVer: number, version: number): Map<string, {ver: number, isRecovery: boolean}> | undefined;

    abstract undoLocals(): void;
    abstract redoLocals(): void;
}

export class RepoNodePath {
    id: string;
    baseVer: number = 0; // 些节点创建时的version: 主要是insert？
    node: RepoNode | undefined;
    childs: Map<string, RepoNodePath> = new Map();
    parent: RepoNodePath | undefined;

    setTreeBaseVer(ver: number) {
        this.baseVer = ver;
        this.childs.forEach((child) => {
            child.setTreeBaseVer(ver);
        });
    }

    constructor(parent: RepoNodePath | undefined, id: string) {
        this.parent = parent;
        this.id = id;
    }

    buildAndGet(op: Op, path: string[], creator: (parent: RepoNodePath, op: Op) => RepoNode): RepoNode {
        if (path.length === 0) {
            if (!this.node) this.node = creator(this, op);
            // check
            if (this.node.type !== op.type) {
                throw new Error("wrong node, expect node type: " + op.type + ", but get: " + this.node.type);
            }
            return this.node;
        }
        let child = this.childs.get(path[0]);
        if (!child) {
            // bulid
            child = new RepoNodePath(this, path[0]);
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

    get3(path: string[]): RepoNodePath {
        if (path.length === 0) return this;
        let child = this.childs.get(path[0]);
        if (!child) {
            child = new RepoNodePath(this, path[0]);
            this.childs.set(path[0], child);
        }
        return child.get3(path.slice(1));
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

    // 将数据前进到特定版本
    roll2Version(baseVer: number, version: number) {
        const roll = (node: RepoNodePath, baseVer: number) => {
            baseVer = (baseVer - node.baseVer) < 0 ? node.baseVer : baseVer;
            let updateVers: Map<string, {ver: number, isRecovery: boolean}> | undefined
            if (node.node) {
                try {
                    updateVers = node.node.roll2Version(baseVer, version);
                } catch (e) {
                    console.error(e);
                }
            }
            node.childs.forEach((n) => {
                if (updateVers && updateVers.has(n.id)) {
                    const v = updateVers.get(n.id)!;
                    n.setTreeBaseVer(v.ver);
                    // if (v.isRecovery) n.setTreeBaseVer(v.ver);
                    // else n.baseVer = v.ver;
                }
                roll(n, baseVer)
            });
        }
        roll(this, baseVer);
    }
}