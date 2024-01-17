import { Fill } from "../../data/style";
import { Color } from "../../data/color";
import { crdtArrayInsert, crdtArrayMove, crdtArrayRemove, crdtSetAttr } from "./basic";
import { BasicArray } from "../../data/basic";
import { ArrayMoveOpRecord } from "../../coop/client/crdt";

// 填充

export function addFillAt(uid: string, fills: BasicArray<Fill>, fill: Fill, index: number) {
    return crdtArrayInsert(uid, fills, index, fill);
}
export function deleteFillAt(uid: string, fills: BasicArray<Fill>, idx: number) {
    return crdtArrayRemove(uid, fills, idx);
}
/**
 * @param idx 开始删的位置
 * @param strength 删除的个数
 * @returns 被删除的元素
 */
export function deleteFills(uid: string, fills: BasicArray<Fill>, idx: number, strength: number) {
    const ops: ArrayMoveOpRecord[] = [];
    for (let i = idx + strength - 1; i >= idx; i--) {
        const op = crdtArrayRemove(uid, fills, i);
        if (op) ops.push(op);
    }
    return ops;
}
export function moveFill(uid: string, fills: BasicArray<Fill>, idx: number, idx2: number) {
    return crdtArrayMove(uid, fills, idx, idx2);
}

export function setFillColor(fill: Fill, color: Color) {
    return fill && crdtSetAttr(fill, "color", color);
}

export function setFillEnable(fill: Fill, enable: boolean) {
    return fill && crdtSetAttr(fill, "isEnabled", enable);
}
