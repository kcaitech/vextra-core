import { Border, BorderPosition, BorderStyle } from "../../data/style";
import { Color } from "../../data/color";
// 边框
export function setBorderColor(
    border: Border,
    color: Color
) {
    // const border: Border = style.borders[idx];
    border.color = color;
}
export function setBorderEnable(
    border: Border,
    isEnabled: boolean,
) {
    // const border: Border = style.borders[idx];
    border.isEnabled = isEnabled;
}
export function setBorderThickness(border: Border, thickness: number) {
    border.thickness = thickness;
}
export function setBorderPosition(border: Border, position: BorderPosition) {
    border.position = position;
}
export function setBorderStyle(border: Border, borderStyle: BorderStyle) {
    border.borderStyle = borderStyle;
}

export function deleteBorderAt(borders: Border[], idx: number) {
    return borders.splice(idx, 1)[0];
}
/**
 * @param idx 开始删的位置
 * @param strength 删除的个数
 * @returns 被删除的元素
 */
export function deleteBorders(borders: Border[], idx: number, strength: number) {
    return borders.splice(idx, strength);
}

export function addBorder(borders: Border[], border: Border) {
    borders.push(border);
}
export function addBorderAt(borders: Border[], border: Border, index: number) {
    borders.splice(index, 0, border);
}
export function moveBorder(borders: Border[], idx: number, idx2: number) {
    const border = borders.splice(idx, 1)[0];
    if (border) borders.splice(idx2, 0, border);
}