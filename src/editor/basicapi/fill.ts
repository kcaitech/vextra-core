import { uuid } from "../../basic/uuid";
import { Color, Fill, Style } from "../../data/style";

// 填充

export function addFillAt(style: Style, fill: Fill, index: number) {
    style.fills.splice(index, 0, fill);
}
export function deleteFillAt(style: Style, idx: number) {
    return style.fills.splice(idx, 1)[0];
}
/**
 * @param idx 开始删的位置
 * @param strength 删除的个数
 * @returns 被删除的元素
 */
export function deleteFills(style: Style, idx: number, strength: number) {
    return style.fills.splice(idx, strength);
}
export function moveFill(style: Style, idx: number, idx2: number) {
    const fill = style.fills.splice(idx, 1)[0];
    if (fill) style.fills.splice(idx2, 0, fill);
}
export function setFillColor(style: Style, idx: number, color: Color) {    
    const fill: Fill = style.fills[idx];
    fill && (fill.color = color);
}

export function toggleFillEnabled(style: Style, idx: number) {
    const fill: Fill = style.fills[idx];
    fill && (fill.isEnabled = !fill.isEnabled);
}
export function setFillEnable(style: Style, idx: number, enable: boolean) {
    const fill: Fill = style.fills[idx];
    if (fill) fill.isEnabled = enable;
}

export function addFill(style: Style, fill: Fill) {
    const { isEnabled, color, contextSettings, fillType } = fill;
    const _fill = new Fill(uuid(), isEnabled, fillType, color);
    _fill.contextSettings = contextSettings;
    style.fills.unshift(_fill);
}
export function deleteFillByIndex(style: Style, idx: number) {
    style.fills.splice(idx, 1);
}

export function setFillEnabled(style: Style, idx: number, value: boolean) {
    const fill: Fill = style.fills[idx];
    fill && (fill.isEnabled = value);
}
export function replaceFills(style: Style, fills: Fill[]) {
    style.fills.splice(0, style.fills.length);
    for (let i = 0; i < fills.length; i++) {
        const f_sim = fills[i];
        const { isEnabled, fillType, color, contextSettings } = f_sim;
        const _f = new Fill(uuid(), isEnabled, fillType, color);
        _f.contextSettings = contextSettings;
        style.fills.push(_f);
    }
}