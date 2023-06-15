import { Color, Fill, Style } from "../data/style";

// 填充
export function addFill(style: Style, fill: Fill) {
    const { isEnabled, color, contextSettings, fillType } = fill;
    style.fills.unshift(new Fill(isEnabled, fillType, color, contextSettings));
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
    style.fills.splice(0, style.fills.length);
    for (let i = 0; i < fills.length; i++) {
        const f_sim = fills[i];
        const { isEnabled, fillType, color, contextSettings } = f_sim;
        const _f = new Fill(isEnabled, fillType, color, contextSettings);
        style.fills.push(_f);
    }
    console.log('replace');
}