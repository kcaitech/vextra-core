import { Color, Border, BorderPosition, Style, BorderStyle, MarkerType } from "../data/style";
// 边框
export function setBorder(
    style: Style,
    idx: number,
    options: { 
        color: Color,
        isEnabled: boolean,
 }) {
    const { color, isEnabled } = options;
    const border: Border = style.borders[idx];
    border.color = color;
    border.isEnabled = isEnabled;
}
export function setBorderThickness(style: Style, idx: number, thickness: number) {
    style.borders[idx].thickness = thickness;
}
export function setBorderPosition(style: Style, idx: number, position: BorderPosition) {
    style.borders[idx].position = position;
}

export function setBorderStyle(style: Style, idx: number, borderStyle: BorderStyle) {
    style.borders[idx].borderStyle = borderStyle;
}
export function setBorderApexStyle(style: Style, idx: number, apexStyle: MarkerType, isEnd: boolean) {
    if (isEnd) {
        style.borders[idx].endMarkerType = apexStyle;
    } else {
        style.borders[idx].startMarkerType = apexStyle;
    }
}

export function deleteBorder(style: Style, idx: number) {
    const borders = style.borders;
    borders.splice(idx, 1);
}

export function addBorder(style: Style, border: Border) {
    style.borders.push(border);
}