import { Color, Fill, Style } from "@/data/data/style";

// 填充
export function setFillColor(fill: Fill, color: Color) {
    if (fill) fill.color = color;
}

export function setFillColorAtIdx(style: Style, idx: number, color: Color) {
    setFillColor(style.getFillByIndex(idx), color);
}

export function setFillEnabled(style: Style, idx: number, isEnabled: boolean) {
    const fill = style.getFillByIndex(idx);
    fill && (fill.isEnabled = isEnabled);
}