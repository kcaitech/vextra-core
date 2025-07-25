
import { Basic, BasicArray, BasicMap, GroupShape, Page, ParaAttr, Shape, SpanAttr, Variable, Text, ResourceMgr, Para, Span } from "../data"

export interface CrdtItem {
    id: string; // uuid
    crdtidx: Array<number>;
}

export interface BasicOp {
    crdtShapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number): Shape // return inserted shape
    crdtShapeRemove(page: Page, parent: GroupShape, index: number): Shape | undefined // return origin shape
    crdtShapeMove(page: Page, parent: GroupShape, index: number, parent2: GroupShape, index2: number): void
    crdtSetAttr(obj: Basic | BasicMap<any, any>, key: string, value: any): void
    crdtArrayInsert(arr: BasicArray<CrdtItem>, index: number, item: CrdtItem): void
    crdtArrayRemove(arr: BasicArray<CrdtItem>, index: number): void
    crdtArrayMove(arr: BasicArray<CrdtItem>, from: number, to: number): void
    otTextInsert(parent: Shape | Variable, text: Text | string, index: number, str: Text | string, props?: {
        attr?: SpanAttr,
        paraAttr?: ParaAttr
    }): void
    otTextRemove(parent: Shape | Variable, text: Text | string, index: number, length: number): void
    otTextSetAttr(parent: Shape | Variable, text: Text | string, index: number, length: number, key: string, value: any): void
    otTextSetParaAttr(parent: Shape | Variable, text: Text | string, index: number, length: number, key: string, value: any): void
}

function newText(content: string): Text {
    const text = new Text(new BasicArray());
    const para = new Para(content + '\n', new BasicArray());
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    return text;
}

export class BasicOpImpl implements BasicOp {
    crdtShapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number): Shape // return inserted shape
    {
        shape = parent.addChildAt(shape, index);
        return shape;
    }
    crdtShapeRemove(page: Page, parent: GroupShape, index: number): Shape | undefined // return origin shape
    {
        const shape = parent.removeChildAt(index);
        return shape;
    }
    crdtShapeMove(page: Page, parent: GroupShape, index: number, parent2: GroupShape, index2: number): void {
        if (parent.id === parent2.id && index === index2) return;
        const shape = parent.childs.splice(index, 1)[0]
        if (!shape) return;
        parent2.childs.splice(index2, 0, shape);
    }
    crdtSetAttr(obj: Basic | BasicMap<any, any>, key: string, value: any): void {
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
    }
    crdtArrayInsert(arr: BasicArray<CrdtItem>, index: number, item: CrdtItem): void {
        if (index < 0 || index > arr.length) throw new Error("index out of range");
        arr.splice(index, 0, item);
    }
    crdtArrayRemove(arr: BasicArray<CrdtItem>, index: number): void {
        if (index < 0 || index >= arr.length) throw new Error("index out of range");
        arr.splice(index, 1);
    }
    crdtArrayMove(arr: BasicArray<CrdtItem>, from: number, to: number): void {
        if (from < 0 || from >= arr.length) throw new Error("index out of range");
        if (to < 0 || to > arr.length) throw new Error("index out of range");
        const item = arr[from];
        if (!item || Math.abs(from - to) <= 0) return;
        arr.splice(from, 1);
        if (from < to) --to;
        arr.splice(to, 0, item);
    }
    otTextInsert(parent: Shape | Variable, text: Text | string, index: number, str: Text | string, props?: {
        attr?: SpanAttr;
        paraAttr?: ParaAttr;
    }): void {
        if (typeof text === "string") {
            if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
            text = newText(text);
            parent.value = text;
        }
        const type = typeof str === 'string' ? 'simple' : 'complex';
        if (type === 'simple') {
            text.insertText(str as string, index, props)
        } else {
            text.insertFormatText(str as Text, index);
        }
    }
    otTextRemove(parent: Shape | Variable, text: Text | string, index: number, length: number): void {
        if (typeof text === "string") {
            if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
            text = newText(text);
            parent.value = text;
        }
        text.deleteText(index, length);
    }
    otTextSetAttr(parent: Shape | Variable, text: Text | string, index: number, length: number, key: string, value: any): void {
        if (typeof text === "string") {
            if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
            text = newText(text);
            parent.value = text;
        }
        length = Math.min(text.length, length);
        text.formatText(index, length, key, value);
    }
    otTextSetParaAttr(parent: Shape | Variable, text: Text | string, index: number, length: number, key: string, value: any): void {
        length = Math.min(text.length, length);
        if (typeof text === "string") {
            if (!(parent instanceof Variable)) throw new Error("something wrong"); // 目前仅variable会是string
            text = newText(text);
            parent.value = text;
        }
        if (key === "bulletNumbersType") {
            text.setBulletNumbersType(value, index, length);
        } else if (key === "bulletNumbersStart") {
            text.setBulletNumbersStart(value, index, length);
        } else if (key === "bulletNumbersBehavior") {
            text.setBulletNumbersBehavior(value, index, length);
        } else if (key === "indent") {
            text.setParaIndent(value, index, length);
        } else {
            text.formatPara(index, length, key, value);
        }
    }

}