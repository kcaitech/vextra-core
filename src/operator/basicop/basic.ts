/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Basic, BasicArray, BasicMap, ResourceMgr } from "../../data/basic";
import { ArrayMoveOpRecord, CrdtItem, IdOpRecord, TreeMoveOpRecord, compArrIndex, crdtGetArrIndex, genArrIndex, isEqualsIndex, isGoodIndex } from "../basic/crdt";
import { GroupShape, Shape, Variable } from "../../data/shape";
import { TextOpAttrRecord, TextOpInsertRecord, TextOpRemoveRecord } from "../basic/textop";
import { OpType } from "../basic/op";
import { Para, ParaAttr, Span, SpanAttr, Text } from "../../data/text/text";
import { Page } from "../../data/page";
import { ShapeView } from "../../dataview";

export function stringifyShape(shape: Shape) {
    return JSON.stringify(shape, (k, v) => {
        // k.startsWith('__') ? undefined : v;
        if (k.startsWith('__')) return undefined;
        if (k === 'childs' && Array.isArray(v) && v.length > 0 && v[0] instanceof Shape) return [];
        return v;
    });
}

// 对象树操作
export function crdtShapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number): TreeMoveOpRecord[] {
    const ops: TreeMoveOpRecord[] = [];
    let crdtidx = crdtGetArrIndex(parent.childs, index);
    if (!crdtidx.valid) { // index - 1跟index 重复， 将index的进行修改
        const _ops = _crdtFixShapeIndex(page, parent, index);
        if (Array.isArray(_ops)) ops.push(..._ops);
        else if (_ops) ops.push(_ops);
        crdtidx = crdtGetArrIndex(parent.childs, index);
        if (!crdtidx.valid) throw new Error();
    }
    shape.crdtidx = crdtidx.index;
    shape = parent.addChildAt(shape, index);
    ops.push({
        id: shape.id,
        type: OpType.CrdtTree,
        path: page.getCrdtPath(), // shape 操作统一到page
        data: stringifyShape(shape),
        from: undefined,
        to: { id: parent.id, index: shape.crdtidx },
        origin: undefined,
        target: page,
        data2: shape
    });
    return ops;
}

export function crdtShapeRemove(page: Page, parent: GroupShape, index: number): TreeMoveOpRecord | undefined {
    const shape = parent.removeChildAt(index);
    if (shape) return {
        id: shape.id,
        type: OpType.CrdtTree,
        path: page.getCrdtPath(), // shape 操作统一到page
        data: undefined,
        from: { id: parent.id, index: shape.crdtidx },
        to: undefined,
        origin: shape,
        target: page,
        data2: undefined
    };
}

/**
 *
 * @param page
 * @param parent
 * @param index
 * @param parent2
 * @param index2 移动后的index
 * @param needUpdateFrame
 * @returns
 */
export function crdtShapeMove(page: Page, parent: GroupShape, index: number, parent2: GroupShape, index2: number): TreeMoveOpRecord[] | undefined {
    if (parent.id === parent2.id && index === index2) return;
    const shape = parent.childs.splice(index, 1)[0]
    if (!shape) return;
    const ops: TreeMoveOpRecord[] = [];
    let newidx = crdtGetArrIndex(parent2.childs, index2);
    if (!newidx.valid) {
        const _ops = _crdtFixShapeIndex(page, parent2, index2);
        if (Array.isArray(_ops)) ops.push(..._ops);
        else if (_ops) ops.push(_ops);
        newidx = crdtGetArrIndex(parent2.childs, index2);
        if (!newidx.valid) throw new Error();
    }
    const oldidx = shape.crdtidx;
    shape.crdtidx = newidx.index;
    parent2.childs.splice(index2, 0, shape);
    ops.push({
        id: shape.id,
        type: OpType.CrdtTree,
        path: page.getCrdtPath(), // shape 操作统一到page
        data: undefined,
        from: { id: parent.id, index: oldidx },
        to: { id: parent2.id, index: newidx.index },
        origin: undefined,
        target: page,
        data2: shape
    });
    return ops;
}

export function _getMinMaxIndex(arr: { crdtidx: number[] }[]): { min: number[], max: number[] } {
    let min: number[] = []
    let max: number[] = []
    arr.forEach((v, i) => {
        if (i === 0) {
            min = v.crdtidx
            max = v.crdtidx
        } else if (compArrIndex(v.crdtidx, min) < 0) {
            min = v.crdtidx
        } else if (compArrIndex(v.crdtidx, max) > 0) {
            max = v.crdtidx
        }
    })
    return { min, max }
}

export function _crdtFixArrIndex(arr: { crdtidx: number[] }[]) {
    // console.log("_crdtFixArrIndex")
    const minMax = _getMinMaxIndex(arr)
    if (isGoodIndex(minMax.max) || !isGoodIndex(minMax.min)) {
        let preIndex = minMax.max.length === 0 ? [0] : minMax.max
        // 直接重新生成index
        arr.forEach((item) => {
            item.crdtidx = genArrIndex(preIndex, undefined)!
            preIndex = item.crdtidx
        })
    } else {
        let preIndex = minMax.min // good
        arr.slice(0).reverse().forEach((item) => {
            item.crdtidx = genArrIndex(undefined, preIndex)!
            preIndex = item.crdtidx
        })
    }
}

function _crdtFixShapeIndex(page: Page, parent: GroupShape, index: number): TreeMoveOpRecord[] {
    console.log("_crdtFixShapeIndex", parent, index)
    const path = page.getCrdtPath() // shape 操作统一到page
    const oldidx = parent.childs.map(c => c.crdtidx)
    _crdtFixArrIndex(parent.childs)
    const ops: (TreeMoveOpRecord | undefined)[] = parent.childs.map((shape, i) => {
        if (isEqualsIndex(shape.crdtidx, oldidx[i])) return undefined
        return {
            id: shape.id,
            type: OpType.CrdtTree,
            path,
            data: undefined,
            from: { id: parent.id, index: oldidx[i] },
            to: { id: parent.id, index: shape.crdtidx },
            origin: undefined,
            target: page,
            data2: shape
        }
    })
    return ops.filter((v) => v !== undefined) as TreeMoveOpRecord[];
}

// 属性设置操作
export function crdtSetAttr(obj: Basic | BasicMap<any, any>, key: string, value: any): IdOpRecord {
    let origin;
    if (obj instanceof Map) {
        origin = obj.get(key);
        if (value !== undefined) {
            obj.set(key, value);
        } else {
            obj.delete(key);
        }
    } else if (obj instanceof ResourceMgr) {
        origin = obj.getSync(key);
        if (value !== undefined) {
            obj.add(key, value);
        }
    } else {
        origin = (obj as any)[key];
        (obj as any)[key] = value;
    }
    return {
        id: key,
        type: OpType.Idset,
        path: obj.getCrdtPath().concat(key), // 用于路径能找到唯一的reponode
        data: typeof value === 'object' ? JSON.stringify(value, (k, v) => k.startsWith('__') ? undefined : v) : value,
        origin,
        target: obj,
        data2: value
    }
}

function newText(content: string): Text {
    const text = new Text(new BasicArray());
    const para = new Para(content + '\n', new BasicArray());
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    return text;
}

// 文本操作
export function otTextInsert(parent: ShapeView | Shape | Variable, text: Text | string, index: number, str: Text | string, props?: {
    attr?: SpanAttr,
    paraAttr?: ParaAttr
}): TextOpInsertRecord {
    if (typeof text === "string") {
        if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
        text = newText(text);
        parent.value = text;
    }
    const type = typeof str === 'string' ? 'simple' : 'complex';
    if (type === 'simple') {
        text.insertText(str as string, index, props)
        return new TextOpInsertRecord("", text.getCrdtPath(), Number.MAX_SAFE_INTEGER, index, str.length, {
            type: 'simple',
            text: str as string,
            props,
        },
            text)
    } else {
        text.insertFormatText(str as Text, index);
        return new TextOpInsertRecord("", text.getCrdtPath(), Number.MAX_SAFE_INTEGER, index, str.length, {
            type: 'complex',
            text: str as Text
        },
            text)
    }
}

export function otTextRemove(parent: ShapeView | Shape | Variable, text: Text | string, index: number, length: number): TextOpRemoveRecord | undefined {
    if (typeof text === "string") {
        if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
        text = newText(text);
        parent.value = text;
    }
    const del = text.deleteText(index, length);
    return del && new TextOpRemoveRecord("", text.getCrdtPath(), Number.MAX_SAFE_INTEGER, index, del.length, del, text);
}

export function otTextSetAttr(parent: ShapeView | Shape | Variable, text: Text | string, index: number, length: number, key: string, value: any): TextOpAttrRecord {
    if (typeof text === "string") {
        if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
        text = newText(text);
        parent.value = text;
    }
    length = Math.min(text.length, length);
    const ret = text.formatText(index, length, key, value);
    return new TextOpAttrRecord("", text.getCrdtPath(), Number.MAX_SAFE_INTEGER, index, length, {
        target: "span",
        key,
        value
    }, ret, text);
}

export function otTextSetParaAttr(parent: ShapeView | Shape | Variable, text: Text | string, index: number, length: number, key: string, value: any): TextOpAttrRecord {
    length = Math.min(text.length, length);
    if (typeof text === "string") {
        if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
        text = newText(text);
        parent.value = text;
    }
    let ret;
    if (key === "bulletNumbersType") {
        ret = text.setBulletNumbersType(value, index, length);
    } else if (key === "bulletNumbersStart") {
        ret = text.setBulletNumbersStart(value, index, length);
    } else if (key === "bulletNumbersBehavior") {
        ret = text.setBulletNumbersBehavior(value, index, length);
    } else if (key === "indent") {
        ret = text.setParaIndent(value, index, length);
    } else {
        ret = text.formatPara(index, length, key, value);
    }
    return new TextOpAttrRecord("", text.getCrdtPath(), Number.MAX_SAFE_INTEGER, index, length, {
        target: "para",
        key,
        value
    }, ret, text);
}

// 数据操作
export function crdtArrayInsert(arr: BasicArray<CrdtItem>, index: number, item: CrdtItem): ArrayMoveOpRecord[] {
    // check index
    if (index < 0 || index > arr.length) throw new Error("index out of range");
    const ops: ArrayMoveOpRecord[] = [];
    let newidx = crdtGetArrIndex(arr, index);
    if (!newidx.valid) {
        const _ops = _crdtFixArrayIndex(arr, index);
        if (Array.isArray(_ops)) ops.push(..._ops);
        else if (_ops) ops.push(_ops);
        newidx = crdtGetArrIndex(arr, index);
        if (!newidx.valid) throw new Error();
    }
    item.crdtidx = newidx.index;
    arr.splice(index, 0, item);
    ops.push({
        id: item.id,
        type: OpType.CrdtArr,
        path: arr.getCrdtPath(),
        data: typeof item === 'object' ? JSON.stringify(item, (k, v) => k.startsWith('__') ? undefined : v) : item,
        from: undefined,
        to: newidx.index,
        origin: undefined,
        target: arr,
        data2: item
    });
    return ops;
}

export function crdtArrayRemove(arr: BasicArray<CrdtItem>, index: number): ArrayMoveOpRecord | undefined {
    if (index < 0 || index >= arr.length) throw new Error("index out of range");
    const item = arr[index];
    if (!item) return;
    const oldidx = item.crdtidx;
    arr.splice(index, 1);
    return {
        id: item.id,
        type: OpType.CrdtArr,
        path: arr.getCrdtPath(),
        data: undefined,
        from: oldidx,
        to: undefined,
        origin: item,
        target: arr,
        data2: undefined
    }
}

/**
 *
 * @param arr
 * @param from
 * @param to 移动前的index
 * @returns
 */
export function crdtArrayMove(arr: BasicArray<CrdtItem>, from: number, to: number): ArrayMoveOpRecord[] | undefined {
    if (from < 0 || from >= arr.length) throw new Error("index out of range");
    if (to < 0 || to > arr.length) throw new Error("index out of range");
    const item = arr[from];
    if (!item || Math.abs(from - to) <= 0) return;
    const ops: ArrayMoveOpRecord[] = [];
    const oldidx = item.crdtidx;
    let newidx = crdtGetArrIndex(arr, to);
    if (!newidx.valid) {
        const _ops = _crdtFixArrayIndex(arr, to);
        if (Array.isArray(_ops)) ops.push(..._ops);
        else if (_ops) ops.push(_ops);
        newidx = crdtGetArrIndex(arr, to);
        if (!newidx.valid) throw new Error();
    }
    arr.splice(from, 1);
    if (from < to) --to;
    item.crdtidx = newidx.index;
    arr.splice(to, 0, item);
    ops.push({
        id: item.id,
        type: OpType.CrdtArr,
        path: arr.getCrdtPath(),
        data: undefined,
        from: oldidx,
        to: newidx.index,
        origin: undefined,
        target: arr,
        data2: undefined
    });
    return ops;
}

function _crdtFixArrayIndex(arr: BasicArray<CrdtItem>, index: number): ArrayMoveOpRecord[] {
    console.log("_crdtFixArrayIndex", arr, index)
    if (index < 0 || index > arr.length) throw new Error("index out of range");

    const path = arr.getCrdtPath()
    const oldidx = arr.map(c => c.crdtidx)
    _crdtFixArrIndex(arr)
    const ops: (ArrayMoveOpRecord | undefined)[] = arr.map((item, i) => {
        if (isEqualsIndex(item.crdtidx, oldidx[i])) return undefined
        return {
            id: item.id,
            type: OpType.CrdtArr,
            path,
            data: undefined,
            from: oldidx[i],
            to: item.crdtidx,
            origin: undefined,
            target: arr,
            data2: undefined
        }
    })
    return ops.filter((v) => v !== undefined) as ArrayMoveOpRecord[];
}