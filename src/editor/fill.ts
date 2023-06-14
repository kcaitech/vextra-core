import { Color, Fill, Style } from "../data/style";

// 填充
export function addFill(style: Style, fill: Fill) {
    style.fills.unshift(fill);
}
export function deleteFillByIndex(style: Style, idx: number) {
    style.fills.splice(idx, 1);
}

export function setFillColor(style: Style, idx: number, color: Color) {
    const fill: Fill = style.fills[idx];
    fill && (fill.color = color);
}

export function setFillEnabled(style: Style, idx: number, value: boolean) {
    const fill: Fill = style.fills[idx];
    fill && (fill.isEnabled = value);
}
export function replaceFills(style: Style, fills: Fill[]) {
    style.fills.length = 0;
    style.fills.push(...fills);
}