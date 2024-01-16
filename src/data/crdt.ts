
import * as classes from "./baseclasses"
import * as types from "./typesdefine"
import { Basic } from "./basic"

/**
 * crdt table index 
 */
export class CrdtIndex2 extends Basic implements classes.CrdtIndex2 {
    typeId = 'crdt-index2'
    x: CrdtIndex
    y: CrdtIndex
    constructor(
        x: CrdtIndex,
        y: CrdtIndex
    ) {
        super()
        this.x = x
        this.y = y
    }

    notify(...args: any[]): void { // 这个修改不需要notify
    }
}
/**
 * crdt array index 
 */
export class CrdtIndex extends Basic implements classes.CrdtIndex {
    typeId = 'crdt-index'
    index: string
    order: number
    uid: string
    constructor(
        index: string,
        order: number,
        uid: string
    ) {
        super()
        this.index = index
        this.order = order
        this.uid = uid
    }

    notify(...args: any[]): void {
    }
}

export class CrdtNumber extends Basic implements classes.CrdtNumber {
    typeId = 'crdt-number'
    id: string
    crdtidx: CrdtIndex
    value: number
    constructor(
        id: string,
        crdtindex: CrdtIndex,
        value: number
    ) {
        super()
        this.id = id
        this.crdtidx = crdtindex
        this.value = value
    }

    notify(...args: any[]): void {
    }
}

export class CrdtId extends Basic implements classes.CrdtId {
    typeId = 'crdt-id'
    id: string
    order: number
    constructor(
        id: string,
        order: number
    ) {
        super()
        this.id = id
        this.order = order
    }
}



export enum OpType {
    None,
    Array,
    Idset,
    Table,
    CrdtArr,
    CrdtTree
}

export interface Op {
    id: string; // op target
    path: string[]; // 定位到具体的repo node
    type: OpType;
    order: number;
}

// 数组
// 定义数组的index为<[i1, i2, i3, ...], order>, uid.
export interface CrdtItem {
    id: string; // uuid
    crdtidx: types.CrdtIndex;
}

export interface CrdtArray extends Array<CrdtItem> { }

// 数组的操作仅处理move
export interface ArrayMoveOp extends Op {
    data: CrdtItem | undefined;
    to: types.CrdtIndex | undefined; // undefined表示不在列表里
}
export interface ArrayMoveOpRecord extends ArrayMoveOp {
    from: types.CrdtIndex | undefined;
    isRemove: boolean; // 是否是删除操作
}

export interface TreeIndex extends types.CrdtIndex {
    id: string;
}

export interface TreeMoveOp extends Op {
    id: string; // target id
    data: CrdtItem | undefined;
    to: TreeIndex | undefined;
}

export interface TreeMoveOpRecord extends TreeMoveOp {
    from: TreeIndex | undefined;
    isRemove: boolean; // 是否是删除操作
}

const ArrIndexStep = 32;
const ArrIndexSpace = 65536;
function randomArrInterval(): number {
    return Math.floor(Math.random() * ArrIndexSpace);
}

function _genArrIndex(start: number, uid: string, count: number, step: number): CrdtIndex[] {
    const ret: CrdtIndex[] = [];
    while (--count) {
        ret.push(
            new CrdtIndex(
                Number(start).toString(),
                // 这个只能临时用，如果是本地未同步的文档，可以自行安排order，如0。
                // 如果是长时间离线编辑，最后不同步，保存为新版本的，可以自行递增order。
                Number.MAX_SAFE_INTEGER,
                uid
            ));
        start += step;
    }
    return ret;
}

function _genArrIndex2(_start: number[], uid: string, count: number, step: number): CrdtIndex[] {
    let start = _start[_start.length - 1];
    const ret: CrdtIndex[] = [];
    const index = _start.slice(0);
    while (--count) {
        index[index.length - 1] = start;
        ret.push(
            new CrdtIndex(
                index.join(','),
                Number.MAX_SAFE_INTEGER,
                uid
            ));
        start += step;
    }
    return ret;
}

function isUnsafeAdd(num1: number, num2: number) {
    if (num1 <= 0) return false;
    if (Number.MAX_SAFE_INTEGER - num1 < num2) return true;
    return false;
}

function isUnsafeMinus(num1: number, num2: number) {
    if (num1 >= 0) return false;
    return isUnsafeAdd(-num1, -num2);
}

function parseCrdtIndex(index: string): number[] {
    return index.split(',').map((v) => Number.parseInt(v))
}

function genArrIndex(preIndex: types.CrdtIndex | undefined, nextIndex: types.CrdtIndex | undefined, uid: string, count: number = 1): CrdtIndex[] {
    if (preIndex === undefined && nextIndex === undefined) { // 空数组
        const start = randomArrInterval();
        return _genArrIndex(start, uid, count, ArrIndexStep);
    }

    if (preIndex === undefined) { // 数组前追加
        if (nextIndex === undefined) throw new Error("impossible");
        if (nextIndex.index === undefined) throw new Error('nextIndex.index is undefined'); // 这个仅存在于op中，用于新建或者删除

        const nextIndexindex = parseCrdtIndex(nextIndex.index);
        if (nextIndex.uid === uid) {
            const start = nextIndexindex[0] - ArrIndexStep * (count + 1);
            return _genArrIndex(start, uid, count, -ArrIndexStep); // 不对
        } else {
            // todo 有没有可能超出范围？
            const s1 = nextIndexindex[0] - ArrIndexStep * (count + 1);
            const s2 = randomArrInterval();
            if (isUnsafeMinus(s1, s2)) {
                throw new Error('unsafe minus'); // todo
            }
            const start = s1 - s2;
            return _genArrIndex(start, uid, count, -ArrIndexStep);
        }
    }

    if (nextIndex === undefined) { // 数组后追加
        if (preIndex.index === undefined) throw new Error('preIndex.index is undefined'); // 这个仅存在于op中，用于新建或者删除
        // 存在preIndex
        const preIndexindex = parseCrdtIndex(preIndex.index);
        if (preIndex.uid === uid) {
            const start = preIndexindex[0] + ArrIndexStep;
            return _genArrIndex(start, uid, count, ArrIndexStep);
        } else {
            // todo 有没有可能超出范围？
            const s1 = preIndexindex[0];
            const s2 = randomArrInterval();
            if (isUnsafeAdd(s1, s2)) {
                throw new Error('unsafe add'); // todo
            }
            const start = s1 - s2;
            return _genArrIndex(start, uid, count, ArrIndexStep);
        }
    }

    if (preIndex.index === undefined || nextIndex.index === undefined) throw new Error('preIndex.index or nextIndex.index is undefined');

    // 存在preIndex和nextIndex
    const len = Math.min(preIndex.index.length, nextIndex.index.length);
    let i = 0;
    let step = 1;
    const start: number[] = [];
    const preIndexindex = parseCrdtIndex(preIndex.index);
    const nextIndexindex = parseCrdtIndex(nextIndex.index);
    for (; i < len; i++) {
        if (preIndex.index[i] === nextIndex.index[i]) {
            start.push(preIndexindex[i]);
        } else if (preIndex.index[i] + count < nextIndex.index[i]) {
            const space = nextIndexindex[i] - preIndexindex[i];
            step = Math.floor(space / (count + 1));
            if (step <= ArrIndexStep) {
                start.push(preIndexindex[i]);
            } else {
                step = ArrIndexStep;
                const space2 = space - ArrIndexStep * (count + 1);
                if (space2 > 0) {
                    const offset = Math.floor(Math.random() * space2);
                    start.push(offset + preIndexindex[i]);
                } else {
                    start.push(preIndexindex[i]);
                }
            }
            break; // i < len
        } else {
            if (preIndex.index[i] > nextIndex.index[i]) throw new Error('preIndex.index[i] > nextIndex.index[i]');
            const space = nextIndexindex[i] - preIndexindex[i] - 1; // 减1: 不能被random到nextIndex.index[i]上了
            const offset = Math.floor(Math.random() * space);
            start.push(offset + preIndexindex[i]);
        }
    }
    if (i === len) {
        const s0 = nextIndexindex.length > len ? nextIndexindex[len] : 0;
        const s1 = s0 - ArrIndexStep * (count + 1);
        const s2 = randomArrInterval();
        const s = s1 - s2;
        start.push(s);
        return _genArrIndex2(start, uid, count, -ArrIndexStep);
    } else {
        return _genArrIndex2(start, uid, count, step);
    }
}

// 数组操作
export function crdtGetArrIndex(uid: string, arr: Array<CrdtItem>, index: number) {
    const preIdx = index > 0 ? arr[index - 1].crdtidx : undefined;
    const nexIdx = index < arr.length ? arr[index].crdtidx : undefined;
    const idx = genArrIndex(preIdx, nexIdx, uid)[0];
    return idx;
}
