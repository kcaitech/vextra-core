import { Color, Border, BorderPosition, Style, BorderStyle, MarkerType } from "../../data/style";
// 边框
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
export function setBorderStartMarkerType(style: Style, idx: number, type: MarkerType) {
    style.borders[idx].startMarkerType = type;
}

export function setBorderEndMarkerType(style: Style, idx: number, type: MarkerType) {
    style.borders[idx].endMarkerType = type;
}

export function deleteBorderAt(style: Style, idx: number) {
    return style.borders.splice(idx, 1)[0];
}

export function addBorder(style: Style, border: Border) {
    style.borders.push(border);
}
export function addBorderAt(style: Style, border: Border, index: number) {
    style.borders.splice(index, 0, border);
}
export function moveBorder(style: Style, idx: number, idx2: number) {
    const border = style.borders.splice(idx, 1)[0];
    if (border) style.borders.splice(idx2, 0, border);
}