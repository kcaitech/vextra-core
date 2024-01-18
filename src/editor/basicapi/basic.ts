import { Basic, BasicArray, BasicMap } from "../../data/basic";
import { ArrayMoveOpRecord, CrdtItem, IdOpRecord, TreeMoveOpRecord, crdtGetArrIndex } from "../../coop/client/crdt";
import { GroupShape, Shape, Variable } from "../../data/shape";
import { TextOpAttrRecord, TextOpInsertRecord, TextOpRemoveRecord } from "../../coop/client/textop";
import { OpType } from "../../coop/common/op";
import { Text } from "../../data/text";

// 对象树操作
export function crdtShapeInsert(uid: string, parent: GroupShape, shape: Shape, index: number): TreeMoveOpRecord {
    shape = parent.addChildAt(shape, index);
    return {
        id: shape.id,
        type: OpType.CrdtTree,
        path: parent.getCrdtPath(),
        order: Number.MAX_SAFE_INTEGER,
        data: shape,
        from: undefined,
        isRemove: false,
        to: { id: parent.id, index: shape.crdtidx.index, order: Number.MAX_SAFE_INTEGER, uid }
    };
}
export function crdtShapeRemove(uid: string, parent: GroupShape, index: number): TreeMoveOpRecord | undefined {
    const shape = parent.removeChildAt(index);
    if (shape) return {
        id: shape.id,
        type: OpType.CrdtTree,
        path: parent.getCrdtPath(),
        order: Number.MAX_SAFE_INTEGER,
        data: shape,
        from: { id: parent.id, index: shape.crdtidx.index, order: shape.crdtidx.order, uid: shape.crdtidx.uid },
        isRemove: true,
        to: undefined
    };
}
/**
 * 
 * @param uid 
 * @param page 
 * @param parent 
 * @param index 
 * @param parent2 
 * @param index2 移动前的index
 * @param needUpdateFrame 
 * @returns 
 */
export function crdtShapeMove(uid: string, parent: GroupShape, index: number, parent2: GroupShape, index2: number): TreeMoveOpRecord | undefined {
    if (parent.id === parent2.id) {
        if (Math.abs(index - index2) <= 1) return;
        if (index2 > index) index2--;
    }
    const shape = parent.childs.splice(index, 1)[0]
    if (!shape) return;
    const newidx = crdtGetArrIndex(uid, parent2.childs, index2);
    const oldidx = shape.crdtidx;
    shape.crdtidx = newidx;
    parent2.childs.splice(index2, 0, shape);
    return {
        id: shape.id,
        type: OpType.CrdtTree,
        path: parent2.getCrdtPath(),
        order: Number.MAX_SAFE_INTEGER,
        data: shape,
        from: { id: parent.id, index: oldidx.index, order: oldidx.order, uid: oldidx.uid },
        isRemove: true,
        to: { id: parent2.id, index: newidx.index, order: Number.MAX_SAFE_INTEGER, uid }
    };
}

// 属性设置操作
export function crdtSetAttr(obj: Basic | BasicMap<any, any>, key: string, value: any): IdOpRecord {
    let origin;
    if (obj instanceof Map) {
        origin = obj.get(key);
        if (value) obj.set(key, value);
        else obj.delete(key);
    } else {
        origin = (obj as any)[key];
        (obj as any)[key] = value;
    }
    return {
        id: key,
        type: OpType.Idset,
        path: obj.getCrdtPath(),
        order: Number.MAX_SAFE_INTEGER,
        data: value,
        origin
    }
}

// 文本操作
export function otTextInsert(parent: Shape | Variable, text: Text | string, index: number, intext: string): TextOpInsertRecord {
    if (typeof text === "string") {
        // todo
        throw new Error("not implemented");
    }

}
export function otTextRemove(parent: Shape | Variable, text: Text | string, index: number, length: number): TextOpRemoveRecord {
    if (typeof text === "string") {
        // todo
        throw new Error("not implemented");
    }
}
export function otTextSetAttr(parent: Shape | Variable, text: Text | string, index: number, length: number, key: string, value: any): TextOpAttrRecord {
    if (typeof text === "string") {
        // todo
        throw new Error("not implemented");
    }
}

// 数据操作
export function crdtArrayInsert(uid: string, arr: BasicArray<CrdtItem>, index: number, item: CrdtItem): ArrayMoveOpRecord {
    const newidx = crdtGetArrIndex(uid, arr, index);
    const oldidx = item.crdtidx;
    item.crdtidx = newidx;
    arr.splice(index, 0, item);
    return {
        id: item.id,
        type: OpType.CrdtArr,
        path: arr.getCrdtPath(),
        order: Number.MAX_SAFE_INTEGER,
        data: item,
        from: oldidx,
        isRemove: false,
        to: newidx
    }
}

export function crdtArrayRemove(uid: string, arr: BasicArray<CrdtItem>, index: number): ArrayMoveOpRecord | undefined {
    const item = arr[index];
    if (!item) return;
    const oldidx = item.crdtidx;
    arr.splice(index, 1);
    return {
        id: item.id,
        type: OpType.CrdtArr,
        path: arr.getCrdtPath(),
        order: Number.MAX_SAFE_INTEGER,
        data: item,
        from: oldidx,
        isRemove: true,
        to: undefined
    }
}

/**
 * 
 * @param uid 
 * @param arr 
 * @param from 
 * @param to 移动前的index
 * @returns 
 */
export function crdtArrayMove(uid: string, arr: BasicArray<CrdtItem>, from: number, to: number): ArrayMoveOpRecord | undefined {
    const item = arr[from];
    if (!item || Math.abs(from - to) <= 1) return;
    const oldidx = item.crdtidx;
    const newidx = crdtGetArrIndex(uid, arr, to);
    arr.splice(from, 1);
    if (from < to) --to;
    arr.splice(to, 0, item);
    return {
        id: item.id,
        type: OpType.CrdtArr,
        path: arr.getCrdtPath(),
        order: Number.MAX_SAFE_INTEGER,
        data: item,
        from: oldidx,
        isRemove: false,
        to: newidx
    }
}