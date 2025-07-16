/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// 定义树、数组的crdt数据及操作

import { Page } from "../../data/page";
import { Op, OpType } from "./op";
import { GroupShape, Shape } from "../../data/shape";
import { BasicArray } from "../../data/basic";

// 数组
// 定义数组的index为<[i1, i2, i3, ...], order>, uid.
export interface CrdtItem {
    id: string; // uuid
    crdtidx: Array<number>;
}

export interface CrdtArray extends Array<CrdtItem> { }

// 数组的操作仅处理move
export interface ArrayMoveOp extends Op {
    data: CrdtItem | string | undefined;
    to: Array<number> | undefined; // undefined表示不在列表里
}
export interface ArrayMoveOpRecord extends ArrayMoveOp {
    from: Array<number> | undefined;
    origin: CrdtItem | string | undefined;
    target?: CrdtItem[];
    data2: CrdtItem | undefined; // 新插入的data
}

export interface TreeIndex {
    id: string;
    index: Array<number>;
}

export interface TreeMoveOp extends Op {
    data: CrdtItem | string | undefined;
    to: TreeIndex | undefined;
}

export interface TreeMoveOpRecord extends TreeMoveOp {
    from: TreeIndex | undefined;
    origin: CrdtItem | string | undefined;
    target?: Page;
    data2: CrdtItem | undefined; // 新插入的data
}

export interface IdOp extends Op {
    data: any;
}
export interface IdOpRecord extends IdOp {
    origin: any;
    target?: Object;
    data2: CrdtItem | undefined;
}

// 改用整數
export const MAX_INT = Number.MAX_SAFE_INTEGER
const MIN_STEP = 1;
const MIN_DIFF = 2

function _round(num: number, step: number) {
    if (step < 0) {
        const _step = Math.min(step * Math.random(), -MIN_STEP)
        // 处理溢出
        if (num < 0 && num + MAX_INT <= -_step) {
            return -MAX_INT
        }
        return Math.round(num + _step)
    } else {
        const _step = Math.max(step * Math.random(), MIN_STEP)
        // 处理溢出
        if (num > 0 && num - MAX_INT >= -_step) {
            return MAX_INT
        }
        return Math.round(num + _step)
    }
}

function _genPreIndex(idx: number, nextIndex: number[], step: number) {
    if (nextIndex.length === 0) return; // 无法在前面加index
    const ret = nextIndex.slice(0, idx) as BasicArray<number>;
    for (let i = idx, len = nextIndex.length; i < len; ++i) {
        const v = nextIndex[i]
        if (v <= -MAX_INT) {
            ret.push(v)
            continue
        }
        const v2 = _round(v, -step)
        if (v2 <= -MAX_INT) {
            ret.push(-MAX_INT, 0)
        } else {
            ret.push(v2)
        }
        return ret
    }
    // 到这说明nextIndex的数值都<=-MAX_INT。正常不应该
    // const v = ret.pop()!
    // ret.push(v - 1, 0) // 再小就要溢出了！这里应该要return undefined
    // return ret
}

function _genNextIndex(idx: number, preIndex: number[], step: number) {
    const ret = preIndex.slice(0, idx) as BasicArray<number>;
    for (let i = idx, len = preIndex.length; i < len; ++i) {
        const v = preIndex[i]
        if (v >= MAX_INT) {
            ret.push(v)
            continue
        }
        const v2 = _round(v, step)
        if (v2 > MAX_INT) {
            ret.push(MAX_INT, 0)
        } else {
            ret.push(v2)
        }
        return ret
    }
    // 到这说明nextIndex的数值都>=MAX_INT,或者为空。
    ret.push(0)
    return ret
}

export function genArrIndex(preIndex: number[] | undefined, nextIndex: number[] | undefined, step = 1000): BasicArray<number> | undefined {
    if (preIndex === undefined && nextIndex === undefined) { // 空数组
        const ret = new BasicArray<number>();
        ret.push(0);
        return ret;
    }

    if (preIndex === undefined) { // 数组前追加
        if (nextIndex === undefined) throw new Error("nextIndex is undefined");
        return _genPreIndex(0, nextIndex, step)
    }

    if (nextIndex === undefined) { // 数组后追加
        if (preIndex === undefined) throw new Error('preIndex is undefined'); // 这个仅存在于op中，用于新建或者删除
        // 存在preIndex
        return _genNextIndex(0, preIndex, step)
    }

    // 存在preIndex和nextIndex
    const len = Math.min(preIndex.length, nextIndex.length);
    let idx = 0;
    while (idx < len && preIndex[idx] === nextIndex[idx]) ++idx;
    // 如果两个index一样,怎么生成新的index?? order也没用
    // 生成新op，将其中一个挪走
    if (idx === len && idx === nextIndex.length) { // 完全相同或者nextIndex更短
        return
    }

    if (idx === preIndex.length) {
        return _genPreIndex(idx, nextIndex, step)
    }

    const diff = nextIndex[idx] - preIndex[idx];
    if (diff < 0) { // 错了
        return
    }
    if (diff >= MIN_DIFF) { // 可以插入1
        const index = preIndex.slice(0, idx) as BasicArray<number>;
        index.push(_round((preIndex[idx]), diff - 1));
        return index;
    }

    return _genNextIndex(idx + 1, preIndex, step)
}

// 数组操作
export function crdtGetArrIndex(arr: Array<CrdtItem>, index: number): { valid: boolean, index: Array<number> } {
    if (index < 0 || index > arr.length) throw new Error("index out of range")
    const preIdx = index > 0 ? arr[index - 1].crdtidx : undefined;
    const nexIdx = index < arr.length ? arr[index].crdtidx : undefined;
    const i = genArrIndex(preIdx, nexIdx);
    return { valid: i !== undefined, index: i ?? new BasicArray() }
}

export function crdtArrayMove(arr: CrdtArray, op: ArrayMoveOp, data: CrdtItem | undefined): ArrayMoveOpRecord | undefined {
    if (typeof data === 'string') throw new Error("import data first!");
    // let data = op.data;
    const _id = op.id;
    const index = arr.findIndex((v) => v.id === _id);
    const origin = arr[index];

    if (!data) {
        if (index < 0) return; //throw new Error("not find data"); // 如果前面有人删除了，是有可能的！最终结果就是不显示，除非删除的人undo
        data = arr[index];
    }
    // 两个人同时移动同一个数据到不同位置，不同的执行顺序最终位置会不一样
    // 如果目标数据的order比op的order新，则不执行？（等同变换了，后来的优先）那么最终位置一致
    // if (SNumber.comp(data.crdtidx.order, op.order) > 0) {
    //     return;
    // }

    const from = index >= 0 ? data.crdtidx : undefined; // 是否需要clone
    if (from) arr.splice(index, 1); // 移除
    const to = op.to;
    if (!to) { // delete
        return {
            type: op.type,
            id: op.id,
            path: op.path,
            data: undefined,
            to: undefined,
            from,
            origin,
            target: arr,
            data2: undefined
        }
    }

    // find to index
    const toIdx = arrLowerIndex(arr, to);
    data.crdtidx = to; // todo
    arr.splice(toIdx, 0, data);
    data = arr[toIdx]; // 重新赋值下有proxy的数据
    return {
        type: op.type,
        id: op.id,
        path: op.path,
        data: from ? undefined : data,
        to,
        from,
        origin,
        target: arr,
        data2: from ? undefined : data
    }
}

// 树操作由于要防止出现循环引用，走undo-do-redo，强制保持client与server的执行顺序一致
export function crdtTreeMove(tree: Page, op: TreeMoveOp, data: Shape): TreeMoveOpRecord | undefined {
    if (typeof data === 'string') throw new Error("import data first!");
    // let data = op.data; // crdtdata
    // let fromParent: GroupShape | undefined;
    const opid = op.id;
    // if (!data) {
    //     const node = tree.getShape(opid); // treenode
    //     if (!node) return;
    //     data = node;
    // }
    const fromParent: GroupShape | undefined = data && (data as Shape).parent as GroupShape;
    const fromIndex = fromParent ? fromParent.childs.findIndex((c) => c.id === opid) : -1;

    const to = op.to;
    if (!to) { // delete
        if (fromIndex < 0) return;
        const index = fromIndex;
        fromParent.childs.splice(index, 1);
        const crdtindex = data.crdtidx;
        const from: TreeIndex = {
            id: fromParent.id,
            index: crdtindex
        }
        return {
            type: op.type,
            id: op.id,
            path: op.path,
            data: undefined,
            to: undefined,
            from,
            origin: data,
            target: tree,
            data2: undefined
        }
    }

    const toid = to.id;
    const toParent: GroupShape | undefined = tree.getShape(toid) as GroupShape; // treenode
    // 检查循环引用
    if (toParent) {
        let p: GroupShape | undefined = toParent;
        while (p) {
            if (p.id === opid) return; // 循环引用
            p = p.parent as GroupShape;
        }
    }

    let from: TreeIndex | undefined;
    if (fromIndex >= 0) { // remove first
        const index = fromIndex;
        fromParent.childs.splice(index, 1);
        const crdtindex = data.crdtidx;
        from = {
            id: fromParent.id,
            index: crdtindex
        }
    }

    // insert
    if (!toParent) {
        if (!from) return;
        return {
            type: op.type,
            id: op.id,
            path: op.path,
            data: undefined,
            to: undefined,
            from,
            origin: data,
            target: tree,
            data2: undefined
        }
    }

    // toParent要是group 或者 table
    if (!(toParent.childs)) throw new Error("toParent.childs is undefined");
    // arr move
    const result = crdtArrayMove(toParent.childs, {
        id: op.id,
        path: op.path,
        type: OpType.CrdtArr,
        data,
        to: to.index,
    }, data)

    if (!result) {
        if (!from) return;
        return {
            type: op.type,
            id: op.id,
            path: op.path,
            data: undefined,
            to: undefined,
            from,
            origin: data,
            target: tree,
            data2: undefined
        }
    }

    return {
        type: op.type,
        id: op.id,
        path: op.path,
        data: from ? undefined : result.data,
        to: result.to ? to : undefined,
        from,
        origin: result.origin,
        target: tree,
        data2: from ? undefined : result.data as CrdtItem
    }
}

export function isGoodIndex(a: number[]) {
    if (a.length === 0) return false
    for (let i = 0, len = a.length; i < len; ++i) {
        const c = a[i]
        if (c < 0 && c < -MAX_INT) return false
        if (c > 0 && c > MAX_INT) return false
    }
    return true
}

export function isGoodCrdtArr(arr: { crdtidx: number[] }[]) {
    for (let i = 0, len = arr.length; i < len; ++i) {
        if (!isGoodIndex(arr[i].crdtidx)) return false
        if (i > 0 && compArrIndex(arr[i - 1].crdtidx, arr[i].crdtidx) >= 0) return false
    }
    return true
}

export function isEqualsIndex(a: number[], b: number[]) {
    if (a.length !== b.length) return false
    for (let i = 0, len = a.length; i < len; ++i) {
        if (a[i] !== b[i]) return false
    }
    return true
}

export function compArrIndex(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) return a[i] - b[i];
    }
    // 長的在后面
    return a.length - b.length
}

export function arrLowerIndex(arr: CrdtArray, idx: Array<number>): number {
    // 二分查找
    let li = 0, ri = arr.length; // 左闭右开区间
    while (li < ri) {
        const mi = Math.floor((li + ri) / 2); // 不能等于li
        const item = arr[mi];
        const c = compArrIndex(item.crdtidx, idx);
        if (c >= 0) { // item大
            ri = mi;
        }
        else {
            li = mi + 1; // li最大到ri
        }
    }
    return li;
}
