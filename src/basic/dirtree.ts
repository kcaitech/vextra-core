/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


export class Node<T> {
    __parent: Node<T> | undefined;
    __childs: Node<T>[] | undefined;
    __data: T;
    __count: number = 1;
    constructor(data: T) {
        this.__data = data;
    }
}

// 前序
function __next<T>(pre: Node<T>): Node<T> | undefined {
    if (pre.__childs && pre.__childs.length > 0) {
        return pre.__childs[0];
    }

    let p = pre.__parent;
    let n = pre;
    let nex: Node<T> | undefined;
    while (p) {
        const childs = p.__childs as Node<T>[];
        const i = childs.indexOf(n);
        if (i < childs.length - 1) {
            nex = childs[i + 1];
            break;
        }
        n = p;
        p = n.__parent;
    }
    return nex;
}

/**
 * 用于更高效的顺序获取元素, 前序遍历
 */
export class Iter<T> {
    private __node: Node<T> | undefined;
    constructor(node: Node<T> | undefined) {
        this.__node = node;
    }
    hasNext(): boolean {
        return this.__node !== undefined;
    }
    next(): T {
        const node = this.__node;
        if (!node) {
            throw new Error("call hasNext first")
        }
        this.__node = __next<T>(node);
        return node.__data;
    }
}

/**
 * 目录树
 */
export class DirTree<T> {

    private __root?: Node<T>;

    constructor(root?: Node<T>) {
        this.__root = root;
    }

    get length(): number {
        return this.__root ? this.__root.__count : 0;
    }

    get root() {
        return this.__root;
    }

    private __nodeAt(index: number, node: Node<T>): Node<T> {
        if (index === 0) return node;
        --index;
        const childs = node.__childs;
        if (!childs) {
            throw new Error("iter at wrong data 1")
        }
        for (let i = 0, len = childs.length; i < len; i++) {
            const n = childs[i];
            if (index < n.__count) {
                return this.__nodeAt(index, n)
            }
            index -= n.__count;
        }
        throw new Error("iter at wrong data 2")
    }

    nodeAt(index: number): Node<T> | undefined {
        if (index < 0 || index >= this.length) {
            return undefined;
        }
        return this.__nodeAt(index, this.__root as Node<T>);
    }

    iterAt(index: number): Iter<T> {
        return new Iter<T>(this.nodeAt(index))
    }

    indexOf(node: Node<T>) {
        let n = node;
        let p = n.__parent;
        let index = 0;
        while (p) {
            const childs = p.__childs as Node<T>[];
            for (let i = 0, len = childs.length; i < len; i++) {
                const c = childs[i];
                if (c === n) {
                    break;
                }
                index += c.__count;
            }
            index++; // 当前parent
            n = p;
            p = n.__parent;
        }
        return index;
    }

    del(node: Node<T>): boolean {
        let p = node.__parent;
        if (!p) {
            if (p === this.__root) {
                this.__root = undefined;
                return true;
            }
            return false;
        }

        const childs = p.__childs as Node<T>[];
        childs.splice(childs.indexOf(node), 1);
        node.__parent = undefined;

        const count = node.__count;
        while (p) {
            p.__count -= count;
            p = p.__parent;
        }
        return true;
    }

    private __insert(parent: Node<T>, index: number, node: Node<T>) {
        node.__parent = parent;
        if (!parent.__childs) parent.__childs = [node]
        else (parent.__childs as Node<T>[]).splice(index, 0, node);
        let p: Node<T> | undefined = parent;
        const count = node.__count;
        while (p) {
            p.__count += count;
            p = p.__parent;
        }
    }

    swap(pre: Node<T>, nex: Node<T>): boolean {
        if (nex.__parent) return false;

        const pp = pre.__parent;
        if (!pp) {
            if (pre !== this.__root) throw new Error("wrong data");
            this.__root = nex;
            return true;
        }

        const ppc = pp.__childs;
        if (!ppc) return false;

        const pIdx = ppc.indexOf(pre);
        if (pIdx < 0) return false;

        ppc[pIdx] = nex;
        nex.__parent = pp;

        let p: Node<T> | undefined = pp;
        const count = nex.__count - pre.__count;
        while (p) {
            p.__count += count;
            p = p.__parent;
        }
        pre.__parent = undefined;
        return true;
    }

    insertArr(parent: Node<T> | undefined, index: number, data: T[]): Node<T>[] {
        if (parent == undefined) {
            if (this.length !== 0 || data.length > 1) {
                throw Error("must have parent")
            }
            const node = new Node<T>(data[0]);
            const c = this.__root;
            this.__root = node;
            if (c) {
                c.__parent = node;
                node.__childs = [c]
                node.__count += c.__count;
            }
            return [node];
        }
        if (index < 0) {
            index = 0;
        }
        else if (index > (parent.__childs?.length || 0)) {
            index = parent.__childs?.length || 0;
        }
        const ret: Node<T>[] = [];
        for (let i = 0, len = data.length; i < len; i++)  {
            let item = data[i];
            const node = new Node<T>(item);
            node.__parent = parent;
            if (!parent.__childs) parent.__childs = [node]
            else (parent.__childs as Node<T>[]).splice(index, 0, node);
            index++;
            ret.push(node);
        }
        const count = data.length;
        let p: Node<T> | undefined = parent;
        while (p) {
            p.__count += count;
            p = p.__parent;
        }
        return ret;
    }

    insert(parent: Node<T> | undefined, index: number, data: T): Node<T> {
        if (parent == undefined) {
            if (this.length !== 0) {
                throw Error("must have parent")
            }
            const node = new Node<T>(data);
            const c = this.__root;
            this.__root = node;
            if (c) {
                c.__parent = node;
                node.__childs = [c]
                node.__count += c.__count;
            }
            return node;
        }
        if (index < 0) {
            index = 0;
        }
        else if (index > (parent.__childs?.length || 0)) {
            index = parent.__childs?.length || 0;
        }
        const node = new Node<T>(data);
        this.__insert(parent, index, node);
        return node;
    }

    next(node: Node<T>): Node<T> | undefined {
        return __next(node);
    }
}