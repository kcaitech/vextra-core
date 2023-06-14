import { Color, Fill, Style } from "../data/style";

// 填充
export function addFill(style: Style, fill: Fill) {
    style.fills.unshift(fill);
}
export function addFillAt(style: Style, fill: Fill, index: number) {
    style.fills.splice(index, 0, fill);
}
export function deleteFillAt(style: Style, idx: number) {
    return style.fills.splice(idx, 1)[0];
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