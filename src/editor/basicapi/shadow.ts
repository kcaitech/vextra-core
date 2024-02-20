import { ShadowPosition } from "../../data/baseclasses";
import { Shadow } from "../../data/style";
import { Color } from "../../data/color";
import { BasicArray } from "../../data/basic";
import { crdtArrayInsert, crdtArrayRemove, crdtSetAttr } from "./basic";
import { ArrayMoveOpRecord } from "../../coop/client/crdt";
// 阴影
export function deleteShadowAt(shadows: BasicArray<Shadow>, idx: number) {
    return crdtArrayRemove(shadows, idx);
}

export function setShadowEnable(shadows: BasicArray<Shadow>, idx: number, enable: boolean) {
    const s: Shadow = shadows[idx];
    if (s) return crdtSetAttr(s, "isEnabled", enable); // s.isEnabled = enable;
}

export function addShadow(shadows: BasicArray<Shadow>, shadow: Shadow, index: number) {
    return crdtArrayInsert(shadows, index, shadow);
}

export function setShadowColor(shadows: BasicArray<Shadow>, idx: number, color: Color) {
    const shadow: Shadow = shadows[idx];
    if (shadow) return crdtSetAttr(shadow, "color", color); // shadow.color = color;
}

export function setShadowPosition(shadows: BasicArray<Shadow>, idx: number, position: ShadowPosition) {
    const shadow: Shadow = shadows[idx];
    if (shadow) return crdtSetAttr(shadow, "position", position); // shadow.position = position;
}

export function setShadowOffsetX(shadows: BasicArray<Shadow>, idx: number, offsetX: number) {
    const shadow: Shadow = shadows[idx];
    if (shadow) return crdtSetAttr(shadow, "offsetX", offsetX); // shadow.offsetX = offsetX;
}

export function setShadowOffsetY(shadows: BasicArray<Shadow>, idx: number, offsetY: number) {
    const shadow: Shadow = shadows[idx];
    if (shadow) return crdtSetAttr(shadow, "offsetY", offsetY); // shadow.offsetY = offsetY;
}

export function setShadowBlur(shadows: BasicArray<Shadow>, idx: number, blur: number) {
    const shadow: Shadow = shadows[idx];
    if (shadow) return crdtSetAttr(shadow, "blurRadius", blur); // shadow.blurRadius = blur;
}

export function setShadowSpread(shadows: BasicArray<Shadow>, idx: number, spread: number) {
    const shadow: Shadow = shadows[idx];
    if (shadow) return crdtSetAttr(shadow, "spread", spread); // shadow.spread = spread;
}

export function deleteShadows(shadows: BasicArray<Shadow>, idx: number, strength: number) {
    const ops: ArrayMoveOpRecord[] = [];
    for (let i = idx + strength - 1; i >= idx; i--) {
        const op = crdtArrayRemove(shadows, i);
        if (op) ops.push(op);
    }
    return ops;
}