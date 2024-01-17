import { Border, BorderPosition, BorderStyle } from "../../data/style";
import { Color } from "../../data/color";
import { crdtArrayInsert, crdtArrayMove, crdtArrayRemove, crdtSetAttr } from "./basic";
import { BasicArray } from "../../data/basic";
import { ArrayMoveOpRecord } from "../../coop/client/crdt";
// 边框
export function setBorderColor(
    border: Border,
    color: Color
) {
    return crdtSetAttr(border, "color", color);
}
export function setBorderEnable(
    border: Border,
    isEnabled: boolean,
) {
    return crdtSetAttr(border, "isEnabled", isEnabled);
}
export function setBorderThickness(border: Border, thickness: number) {
    return crdtSetAttr(border, "thickness", thickness);
}
export function setBorderPosition(border: Border, position: BorderPosition) {
    return crdtSetAttr(border, "position", position);
}
export function setBorderStyle(border: Border, borderStyle: BorderStyle) {
    return crdtSetAttr(border, "borderStyle", borderStyle);
}

export function deleteBorderAt(uid: string, borders: BasicArray<Border>, idx: number) {
    return crdtArrayRemove(uid, borders, idx);
}
/**
 * @param idx 开始删的位置
 * @param strength 删除的个数
 * @returns 被删除的元素
 */
export function deleteBorders(uid: string, borders: BasicArray<Border>, idx: number, strength: number) {
    const ops: ArrayMoveOpRecord[] = [];
    for (let i = idx + strength - 1; i >= idx; i--) {
        const op = crdtArrayRemove(uid, borders, i);
        if (op) ops.push(op);
    }
    return ops;
}

export function addBorder(uid: string, borders: BasicArray<Border>, border: Border) {
    return crdtArrayInsert(uid, borders, borders.length, border);
}
export function addBorderAt(uid: string, borders: BasicArray<Border>, border: Border, index: number) {
    return crdtArrayInsert(uid, borders, index, border);
}
export function moveBorder(uid: string, borders: BasicArray<Border>, idx: number, idx2: number) {
    return crdtArrayMove(uid, borders, idx, idx2);
}