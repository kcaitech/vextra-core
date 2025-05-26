/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { DirTree, Iter, Node } from "./dirtree";

export interface DirItem {
    id: string,
    naviChilds?: DirItem[]
}

class NodeData<T extends DirItem> {
    data: T;
    fold: boolean;
    constructor(data: T, fold: boolean = true) {
        this.data = data;
        this.fold = fold;
    }
}

class NodeType<T extends DirItem> extends Node<NodeData<T>> {
    constructor(data: T, fold: boolean = true) {
        super(new NodeData(data, fold));
    }
}

export class FoldDirIter<T extends DirItem> {
    private __iter: Iter<NodeData<T>>;
    constructor(iter: Iter<NodeData<T>>) {
        this.__iter = iter;
    }
    hasNext(): boolean {
        return this.__iter.hasNext();
    }
    next(): { data: T, fold: boolean } {
        const d = this.__iter.next();
        return { data: d.data, fold: d.fold }
    }
}

export class FoldDirTree<T extends DirItem> {

    private __dirtree: DirTree<NodeData<T>>;
    private __id2node: Map<string, NodeType<T>> = new Map();
    private __saveFoldedDirState: boolean;
    private __saveUnfolds: Set<string> = new Set();
    private __revertChilds: boolean = true;

    private __afterFold?: (it: FoldDirIter<T>) => void;
    private __afterUnfold?: (data: T) => void;

    constructor(props: {
        saveFoldedDirState?: boolean, data?: T, fold?: boolean, revertChilds?: boolean
    }) {
        this.__saveFoldedDirState = props.saveFoldedDirState ?? true;
        const node = props.data && new NodeType(props.data, props.fold ?? true);
        this.__dirtree = new DirTree(node);
        if (node) this.__id2node.set(node.__data.data.id, node);
    }

    onAfterFold(l: (it: FoldDirIter<T>) => void) {
        this.__afterFold = l;
    }

    onAfterUnfold(l: (data: T) => void) {
        this.__afterUnfold = l;
    }

    get length(): number {
        return this.__dirtree.length;
    }

    iterAt(index: number): FoldDirIter<T> {
        return new FoldDirIter<T>(this.__dirtree.iterAt(index));
    }

    at(index: number): { data: T, fold: boolean } | undefined {
        const n = this.__dirtree.nodeAt(index);
        if (n) return { data: n.__data.data, fold: n.__data.fold }
        return undefined;
    }

    indexOf(data: string | T): number {
        const dataId = typeof data ==='string'? data : data.id;
        const node = this.__id2node.get(dataId);
        if (node) return this.__dirtree.indexOf(node)
        return -1;
    }

    isFold(data: string | T): boolean {
        const dataId = typeof data ==='string'? data : data.id;
        const node = this.__id2node.get(dataId);
        return (node && node.__data.fold) ?? true; // 默认是折叠的
    }

    // private __addIdMap(p: NodeType<T>) {
    //     if (p && p.__count > 1) {
    //         const childs = p.__childs as NodeType<T>[]
    //         childs.forEach((c) => {
    //             this.__id2node.set(c.__data.data.id, c);
    //             this.__addIdMap(c);
    //         })
    //     }
    // }

    private __fold(node: NodeType<T>, data: T): boolean {
        const n = new NodeType(data, true);
        if (!this.__dirtree.swap(node, n)) return false;
        this.__id2node.set(data.id, n)
        this.__removeIdMap(node);
        if (this.__saveFoldedDirState) {
            this.__saveUnfolds.delete(data.id)
        }
        if (this.__afterFold) {
            const tree = new DirTree(node);
            const it = new FoldDirIter<T>(tree.iterAt(0));
            this.__afterFold(it);
        }
        return true;
    }

    fold(data: string | T): boolean {
        const dataId = typeof data ==='string'? data : data.id;
        const node = this.__id2node.get(dataId);
        if (!node) return false;
        if (node.__data.fold) return false;
        return this.__fold(node, node.__data.data);
    }

    private __removeIdMap(p: NodeType<T>) {
        if (p && p.__count > 1) {
            const childs = p.__childs as NodeType<T>[]
            childs.forEach((c) => {
                this.__id2node.delete(c.__data.data.id);
                this.__removeIdMap(c);
            })
        }
    }

    private __unfold(node: NodeType<T>, data: T): boolean {
        const childs = node.__data.data.naviChilds as T[] | undefined;
        if (!childs) return false;
        const arr = childs.map((c) => new NodeData(c))
        if (this.__revertChilds) arr.reverse()
        const ret = this.__dirtree.insertArr(node, 0, arr);
        ret.forEach((n) => {
            const old = this.__id2node.get(n.__data.data.id);
            if (old) this.__dirtree.del(old);
            this.__id2node.set(n.__data.data.id, n)
        })
        node.__data.fold = false;
        if (this.__saveFoldedDirState) {
            this.__saveUnfolds.add(data.id)
            ret.forEach((n) => {
                if (this.__saveUnfolds.has(n.__data.data.id)) {
                    this.__unfold(n, n.__data.data)
                }
            })
        }
        if (this.__afterUnfold) {
            this.__afterUnfold(data)
        }
        return true;
    }

    unfold(data: string | T): boolean {
        const dataId = typeof data ==='string'? data : data.id;
        const node = this.__id2node.get(dataId);
        if (!node) return false;
        if (!node.__data.fold) return false;
        return this.__unfold(node, node.__data.data);
    }

    toggleFold(data: T): boolean {
        const node = this.__id2node.get(data.id);
        if (!node) return false;
        if (node.__data.fold) return this.__unfold(node, data);
        else return this.__fold(node, data);
    }

    has(d: string | T): boolean {
        if (typeof d === 'string') return this.__id2node.get(d) !== undefined;
        return this.__id2node.get(d.id) !== undefined;
    }

    insert(parent: T | undefined, index: number, data: T): boolean {
        const pnode = parent && this.__id2node.get(parent.id)
        if (!pnode || pnode.__data.fold) return false;
        const node = new NodeData(data);
        const n = this.__dirtree.insert(pnode, index, node);
        if (n) {
            const old = this.__id2node.get(data.id);
            if (old) this.__dirtree.del(old);
            this.__id2node.set(data.id, n);
            if (this.__saveFoldedDirState && this.__saveUnfolds.has(data.id)) {
                this.__unfold(n, data);
            }
        }
        return !!n;
    }

    delete(data: T): boolean {
        // if (this.__saveFoldedDirState) { // 不删除
        //     this.__saveUnfolds.delete(data.id)
        // }
        const node = this.__id2node.get(data.id);
        if (node) {
            this.__id2node.delete(data.id);
            return this.__dirtree.del(node);
        }
        return false;
    }

    childsOf(data: T): { data: T, fold: boolean }[] {
        const n = this.__id2node.get(data.id);
        if (n && n.__childs) {
            return n.__childs.map((v) => {
                return { data: v.__data.data, fold: v.__data.fold }
            })
        }
        return [];
    }

    updateChilds(data: T) {
        if (!data.naviChilds) return;

        const node = this.__id2node.get(data.id);
        if (!node || node.__data.fold) return; // 折叠的

        const shapechilds = this.__revertChilds ? data.naviChilds.slice(0).reverse() : data.naviChilds; // reverse
        const childs = node.__childs || [];

        // compare
        let i = 0;
        const slen = shapechilds.length;

        for (; i < slen && i < childs.length; i++) {
            const shapechild = shapechilds[i]
            const nodechild = childs[i]
            if (shapechild.id !== nodechild.__data.data.id) {
                this.delete(shapechild as T)
                this.insert(data, i, shapechild as T);
            }
        }
        for (; childs.length > i;) {
            const nodechild = childs[i];
            const old = this.__id2node.get(nodechild.__data.data.id);
            if (old !== nodechild) throw new Error("shape list wrong");
            this.__id2node.delete(nodechild.__data.data.id);
            this.__dirtree.del(nodechild)
        }
        for (let j = i; j < slen; j++) {
            const shapechild = shapechilds[j]
            this.delete(shapechild as T)
            this.insert(data, j, shapechild as T);
        }
    }
}