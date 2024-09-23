import { Basic, BasicArray, BasicMap, ResourceMgr } from "../../data/basic";
import { ArrayMoveOpRecord, CrdtItem, IdOpRecord, TreeMoveOpRecord, crdtGetArrIndex } from "../../coop/client/crdt";
import { GroupShape, Shape, Variable } from "../../data/shape";
import { TextOpAttrRecord, TextOpInsertRecord, TextOpRemoveRecord } from "../../coop/client/textop";
import { OpType } from "../../coop/common/op";
import { Para, ParaAttr, Span, SpanAttr, Text } from "../../data/text/text";
import { Page } from "../../data/page";
import { SNumber } from "../../coop/client/snumber";
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
    if (index === index2 && parent.id === parent2.id) return;
    const shape = parent.childs.splice(index, 1)[0]
    if (!shape) return;
    const ops: TreeMoveOpRecord[] = [];
    let newidx = crdtGetArrIndex(parent2.childs, index2);
    if (!newidx.valid) {
        const _ops = _crdtFixShapeIndex(page, parent2, index2);
        if (Array.isArray(_ops)) ops.push(..._ops);
        else if (_ops) ops.push(_ops);
        newidx = crdtGetArrIndex(parent.childs, index2);
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

function _crdtFixShapeIndex(page: Page, parent: GroupShape, index: number): TreeMoveOpRecord[] | undefined {
    console.log("_crdtFixShapeIndex", parent, index)
    const ops: TreeMoveOpRecord[] = [];
    const shape = parent.childs[index];
    if (!shape) return;
    let newidx = crdtGetArrIndex(parent.childs, index + 1);
    if (!newidx.valid) {
        const _ops = _crdtFixShapeIndex(page, parent, index + 1);
        if (Array.isArray(_ops)) ops.push(..._ops);
        else if (_ops) ops.push(_ops);
        newidx = crdtGetArrIndex(parent.childs, index + 1);
        if (!newidx.valid) throw new Error();
    }
    const oldidx = shape.crdtidx;
    shape.crdtidx = newidx.index;
    ops.push({
        id: shape.id,
        type: OpType.CrdtTree,
        path: page.getCrdtPath(), // shape 操作统一到page
        data: undefined,
        from: { id: parent.id, index: oldidx },
        to: { id: parent.id, index: newidx.index },
        origin: undefined,
        target: page,
        data2: shape
    });
    return ops;
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
export function otTextInsert(parent: ShapeView | Shape | Variable, text: Text | string, index: number, str: Text | string, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }): TextOpInsertRecord {
    if (typeof text === "string") {
        if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
        text = newText(text);
        parent.value = text;
    }
    const type = typeof str === 'string' ? 'simple' : 'complex';
    if (type === 'simple') {
        text.insertText(str as string, index, props)
        return new TextOpInsertRecord("", text.getCrdtPath(), SNumber.MAX_SAFE_INTEGER, index, str.length, {
            type: 'simple',
            text: str as string,
            props,
        },
            text)
    } else {
        text.insertFormatText(str as Text, index);
        return new TextOpInsertRecord("", text.getCrdtPath(), SNumber.MAX_SAFE_INTEGER, index, str.length, {
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
    return del && new TextOpRemoveRecord("", text.getCrdtPath(), SNumber.MAX_SAFE_INTEGER, index, del.length, del, text);
}
export function otTextSetAttr(parent: ShapeView | Shape | Variable, text: Text | string, index: number, length: number, key: string, value: any): TextOpAttrRecord {
    if (typeof text === "string") {
        if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
        text = newText(text);
        parent.value = text;
    }
    length = Math.min(text.length, length);
    const ret = text.formatText(index, length, key, value);
    return new TextOpAttrRecord("", text.getCrdtPath(), SNumber.MAX_SAFE_INTEGER, index, length, { target: "span", key, value }, ret, text);
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
    }
    else if (key === "bulletNumbersStart") {
        ret = text.setBulletNumbersStart(value, index, length);
    }
    else if (key === "bulletNumbersBehavior") {
        ret = text.setBulletNumbersBehavior(value, index, length);
    }
    else if (key === "indent") {
        ret = text.setParaIndent(value, index, length);
    }
    else {
        ret = text.formatPara(index, length, key, value);
    }
    return new TextOpAttrRecord("", text.getCrdtPath(), SNumber.MAX_SAFE_INTEGER, index, length, { target: "para", key, value }, ret, text);
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

function _crdtFixArrayIndex(arr: BasicArray<CrdtItem>, index: number): ArrayMoveOpRecord[] | undefined {
    console.log("_crdtFixArrayIndex", arr, index)
    if (index < 0 || index > arr.length) throw new Error("index out of range");
    const item = arr[index];
    if (!item) return;
    const ops: ArrayMoveOpRecord[] = [];
    let newidx = crdtGetArrIndex(arr, index + 1);
    if (!newidx.valid) {
        const _ops = _crdtFixArrayIndex(arr, index + 1);
        if (Array.isArray(_ops)) ops.push(..._ops);
        else if (_ops) ops.push(_ops);
        newidx = crdtGetArrIndex(arr, index + 1);
        if (!newidx.valid) throw new Error();
    }
    const oldidx = item.crdtidx;
    item.crdtidx = newidx.index;
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