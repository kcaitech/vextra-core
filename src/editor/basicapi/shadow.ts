import { ShadowPosition } from "../../data/baseclasses";
import { Color, Shadow, Style } from "../../data/style";

// 阴影
export function deleteShadowAt(style: Style, idx: number) {
  return style.shadows.splice(idx, 1)[0];
}

export function setShadowEnable(style: Style, idx: number, enable: boolean) {
  const s: Shadow = style.shadows[idx];
  if (s) s.isEnabled = enable;
}

export function addShadow(style: Style, shadow: Shadow, index: number) {
  style.shadows.splice(index, 0, shadow);
}

export function setShadowColor(style: Style, idx: number, color: Color) {
  const shadow: Shadow = style.shadows[idx];
  if(shadow) shadow.color = color;
}

export function setShadowPosition(style: Style, idx: number, position: ShadowPosition) {
  const shadow: Shadow = style.shadows[idx];
  if(shadow) shadow.position = position;
}

export function setShadowOffsetX(style: Style, idx: number, offsetX: number) {
  const shadow: Shadow = style.shadows[idx];
  if(shadow) shadow.offsetX = offsetX;
}

export function setShadowOffsetY(style: Style, idx: number, offsetY: number) {
  const shadow: Shadow = style.shadows[idx];
  if(shadow) shadow.offsetY = offsetY;
}

export function setShadowBlur(style: Style, idx: number, blur: number) {
  const shadow: Shadow = style.shadows[idx];
  if(shadow) shadow.blurRadius = blur;
}

export function setShadowSpread(style: Style, idx: number, spread: number) {
  const shadow: Shadow = style.shadows[idx];
  if(shadow) shadow.spread = spread;
}

export function deleteShadows(style: Style, idx: number, strength: number) {
  return style.shadows.splice(idx, strength);
}