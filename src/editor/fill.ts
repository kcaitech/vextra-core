import { Color, Fill, Style } from "../data/style";

// 填充
export function addFill(style: Style, fill: Fill) {
    style.fills.unshift(fill);
}
export function addFillAt(style: Style, fill: Fill, index: number) {
    style.fills.splice(index, 0, fill);
}
export function deleteFillAt(style: Style, idx: number) {
    style.fills.splice(idx, 1);
}

export function setFillColor(style: Style, idx: number, color: Color) {
    const fill: Fill = style.fills[idx];
    fill && (fill.color = color);
}

export function setFillEnabled(style: Style, idx: number) {
    const fill: Fill = style.fills[idx];
    fill && (fill.isEnabled = !fill.isEnabled);
}