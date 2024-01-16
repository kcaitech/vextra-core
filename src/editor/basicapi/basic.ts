import { Basic, BasicArray } from "../../data/basic";
import { ArrayMoveOpRecord, CrdtItem, IdOpRecord, TreeMoveOpRecord } from "../../coop/client/crdt";
import { GroupShape, Shape, Variable } from "../../data/shape";
import { TextOpAttrRecord, TextOpInsertRecord, TextOpRemoveRecord } from "../../coop/client/textop";

// 对象树操作
export function crdtShapeInsert(parent: GroupShape, shape: Shape, index: number): TreeMoveOpRecord {

}
export function crdtShapeRemove(shape: Shape): TreeMoveOpRecord {

}
export function crdtShapeMove(shape: Shape, toparent: GroupShape, index: number): TreeMoveOpRecord {

}

// 属性设置操作
export function crdtSetAttr(obj: Basic, key: string, value: any): IdOpRecord {

}

// 文本操作
export function otTextInsert(parent: Shape | Variable, text: Text | string, index: number, intext: string): TextOpInsertRecord {

}
export function otTextRemove(parent: Shape | Variable, text: Text | string, index: number, length: number): TextOpRemoveRecord {

}
export function otTextSetAttr(parent: Shape | Variable, text: Text | string, index: number, length: number, key: string, value: any): TextOpAttrRecord {

}

// 数据操作
export function crdtArrayInsert(arr: BasicArray<CrdtItem>, index: number, item: CrdtItem): ArrayMoveOpRecord {

}

export function crdtArrayRemove(arr: BasicArray<CrdtItem>, index: number): ArrayMoveOpRecord {

}

export function crdtArrayMove(arr: BasicArray<CrdtItem>, from: number, to: number): ArrayMoveOpRecord {

}