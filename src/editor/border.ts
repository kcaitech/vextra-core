import { Color, Border, BorderPosition, Style, BorderStyle, MarkerType } from "../data/style";
// 边框
export function addBorder(style: Style, border: Border) {
    style.borders.unshift(border);
}
export function setBorderColor(
    style: Style,
    idx: number,
    color: Color
) {
    const border: Border = style.borders[idx];
    border.color = color;
}
export function setBorderEnable(
    style: Style,
    idx: number,
    isEnabled: boolean,
) {
    const border: Border = style.borders[idx];
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
export function replaceBorders(style: Style, borders: Border[]) {
    style.borders.length = 0;
    for (let i = 0; i < borders.length; i++) {
        const b_sim = borders[i];
        const { isEnabled, fillType, color, contextSettings, position, thickness, borderStyle,
            startMarkerType, endMarkerType } = b_sim;
        const _b = new Border(isEnabled, fillType, color, contextSettings, position, thickness, borderStyle,
            startMarkerType, endMarkerType)
        style.borders.push(_b);
    }
}