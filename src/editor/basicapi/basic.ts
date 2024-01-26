import { Basic, BasicArray, BasicMap, ResourceMgr } from "../../data/basic";
import { ArrayMoveOpRecord, CrdtItem, IdOpRecord, TreeMoveOpRecord, crdtGetArrIndex } from "../../coop/client/crdt";
import { GroupShape, Shape, Variable } from "../../data/shape";
import { TextOpAttrRecord, TextOpInsertRecord, TextOpRemoveRecord } from "../../coop/client/textop";
import { OpType } from "../../coop/common/op";
import { Para, ParaAttr, Span, SpanAttr, Text } from "../../data/text";
// import { uuid } from "../../basic/uuid";
import { Page } from "../../data/page";

// 对象树操作
export function crdtShapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number): TreeMoveOpRecord {
    shape.crdtidx = crdtGetArrIndex(parent.childs, index);
    shape = parent.addChildAt(shape, index);
    return {
        id: shape.id,
        type: OpType.CrdtTree,
        path: page.getCrdtPath(), // shape 操作统一到page
        order: Number.MAX_SAFE_INTEGER,
        data: shape,
        from: undefined,
        // isRemove: false,
        to: { id: parent.id, index: shape.crdtidx.index, order: Number.MAX_SAFE_INTEGER }
    };
}
export function crdtShapeRemove(page: Page, parent: GroupShape, index: number): TreeMoveOpRecord | undefined {
    const shape = parent.removeChildAt(index);
    if (shape) return {
        id: shape.id,
        type: OpType.CrdtTree,
        path: page.getCrdtPath(), // shape 操作统一到page
        order: Number.MAX_SAFE_INTEGER,
        data: shape,
        from: { id: parent.id, index: shape.crdtidx.index, order: shape.crdtidx.order },
        // isRemove: true,
        to: undefined
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
export function crdtShapeMove(page: Page, parent: GroupShape, index: number, parent2: GroupShape, index2: number): TreeMoveOpRecord | undefined {
    if (index === index2 && parent.id === parent2.id) return;
    const shape = parent.childs.splice(index, 1)[0]
    if (!shape) return;
    const newidx = crdtGetArrIndex(parent2.childs, index2);
    const oldidx = shape.crdtidx;
    shape.crdtidx = newidx;
    parent2.childs.splice(index2, 0, shape);
    return {
        id: shape.id,
        type: OpType.CrdtTree,
        path: page.getCrdtPath(), // shape 操作统一到page
        order: Number.MAX_SAFE_INTEGER,
        data: shape,
        from: { id: parent.id, index: oldidx.index, order: oldidx.order },
        // isRemove: true,
        to: { id: parent2.id, index: newidx.index, order: Number.MAX_SAFE_INTEGER }
    };
}

// 属性设置操作
export function crdtSetAttr(obj: Basic | BasicMap<any, any>, key: string, value: any): IdOpRecord {
    let origin;
    if (obj instanceof Map) {
        origin = obj.get(key);
        if (value) obj.set(key, value);
        else obj.delete(key);
    } else if (obj instanceof ResourceMgr) {
        origin = obj.getSync(key);
        if (value) obj.add(key, value);
    } else {
        origin = (obj as any)[key];
        (obj as any)[key] = value;
    }
    return {
        id: key,
        type: OpType.Idset,
        path: obj.getCrdtPath().concat(key), // 用于路径能找到唯一的reponode
        order: Number.MAX_SAFE_INTEGER,
        data: value,
        origin
    }
}

export function newText(content: string): Text {
    const text = new Text(new BasicArray());
    const para = new Para(content + '\n', new BasicArray());
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    return text;
}

// 文本操作
export function otTextInsert(parent: Shape | Variable, text: Text | string, index: number, str: Text | string, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }): TextOpInsertRecord {
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
        })
    } else {
        text.insertFormatText(str as Text, index);
        return new TextOpInsertRecord("", text.getCrdtPath(), Number.MAX_SAFE_INTEGER, index, str.length, {
            type: 'complex',
            text: str as Text
        })
    }
}
export function otTextRemove(parent: Shape | Variable, text: Text | string, index: number, length: number): TextOpRemoveRecord | undefined {
    if (typeof text === "string") {
        if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
        text = newText(text);
        parent.value = text;
    }
    const del = text.deleteText(index, length);
    return del && new TextOpRemoveRecord("", text.getCrdtPath(), Number.MAX_SAFE_INTEGER, index, length, del);
}
export function otTextSetAttr(parent: Shape | Variable, text: Text | string, index: number, length: number, key: string, value: any): TextOpAttrRecord {
    if (typeof text === "string") {
        if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
        text = newText(text);
        parent.value = text;
    }
    const ret = text.formatText(index, length, key, value);
    return new TextOpAttrRecord("", text.getCrdtPath(), Number.MAX_SAFE_INTEGER, index, length, { target: "span", key, value }, ret);
}

export function otTextSetParaAttr(parent: Shape | Variable, text: Text | string, index: number, length: number, key: string, value: any): TextOpAttrRecord {
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
    return new TextOpAttrRecord("", text.getCrdtPath(), Number.MAX_SAFE_INTEGER, index, length, { target: "para", key, value }, ret);
}

// 数据操作
export function crdtArrayInsert(arr: BasicArray<CrdtItem>, index: number, item: CrdtItem): ArrayMoveOpRecord {
    // check index
    if (index < 0 || index > arr.length) throw new Error("index out of range");
    const newidx = crdtGetArrIndex(arr, index);
    item.crdtidx = newidx;
    arr.splice(index, 0, item);
    return {
        id: item.id,
        type: OpType.CrdtArr,
        path: arr.getCrdtPath(),
        order: Number.MAX_SAFE_INTEGER,
        data: item,
        from: undefined,
        to: newidx
    }
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
        order: Number.MAX_SAFE_INTEGER,
        data: item,
        from: oldidx,
        to: undefined
    }
}

/**
 * 
 * @param arr 
 * @param from 
 * @param to 移动前的index
 * @returns 
 */
export function crdtArrayMove(arr: BasicArray<CrdtItem>, from: number, to: number): ArrayMoveOpRecord | undefined {
    if (from < 0 || from >= arr.length) throw new Error("index out of range");
    if (to < 0 || to > arr.length) throw new Error("index out of range");
    const item = arr[from];
    if (!item || Math.abs(from - to) <= 1) return;
    const oldidx = item.crdtidx;
    const newidx = crdtGetArrIndex(arr, to);
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
        to: newidx
    }
}