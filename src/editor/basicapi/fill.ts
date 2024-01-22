import { uuid } from "../../basic/uuid";
import { Fill, FillType } from "../../data/style";
import { Color } from "../../data/color";

// 填充

export function addFillAt(fills: Fill[], fill: Fill, index: number) {
    fills.splice(index, 0, fill);
}
export function deleteFillAt(fills: Fill[], idx: number) {
    return fills.splice(idx, 1)[0];
}
/**
 * @param idx 开始删的位置
 * @param strength 删除的个数
 * @returns 被删除的元素
 */
export function deleteFills(fills: Fill[], idx: number, strength: number) {
    return fills.splice(idx, strength);
}
export function moveFill(fills: Fill[], idx: number, idx2: number) {
    const fill = fills.splice(idx, 1)[0];
    if (fill) fills.splice(idx2, 0, fill);
}
export function setFillColor(fill: Fill, color: Color) {
    // const fill: Fill = fills[idx];
    fill && (fill.color = color);
}

export function toggleFillEnabled(fill: Fill, idx: number) {
    // const fill: Fill = fills[idx];
    fill && (fill.isEnabled = !fill.isEnabled);
}
export function setFillEnable(fill: Fill, enable: boolean) {
    // const fill: Fill = fills[idx];
    if (fill) fill.isEnabled = enable;
}

export function setFillType(fill: Fill, fillType: FillType) {
    // const fill: Fill = fills[idx];
    if (fill) fill.fillType = fillType;
}

export function addFill(fills: Fill[], fill: Fill) {
    const { isEnabled, color, contextSettings, fillType } = fill;
    const _fill = new Fill(uuid(), isEnabled, fillType, color);
    _fill.contextSettings = contextSettings;
    fills.unshift(_fill);
}
export function deleteFillByIndex(fills: Fill[], idx: number) {
    fills.splice(idx, 1);
}

// export function setFillEnabled(fills: Fill[], idx: number, value: boolean) {
//     const fill: Fill = fills[idx];
//     fill && (fill.isEnabled = value);
// }
export function replaceFills(fillsOld: Fill[], fills: Fill[]) {
    fillsOld.splice(0, fillsOld.length);
    for (let i = 0; i < fills.length; i++) {
        const f_sim = fills[i];
        const { isEnabled, fillType, color, contextSettings } = f_sim;
        const _f = new Fill(uuid(), isEnabled, fillType, color);
        _f.contextSettings = contextSettings;
        fillsOld.push(_f);
    }
}