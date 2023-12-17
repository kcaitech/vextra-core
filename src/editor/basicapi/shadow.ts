import { ShadowPosition } from "../../data/baseclasses";
import { Shadow, Style } from "../../data/style";
import { Color } from "../../data/color";
// 阴影
export function deleteShadowAt(shadows: Shadow[], idx: number) {
  return shadows.splice(idx, 1)[0];
}

export function setShadowEnable(shadows: Shadow[], idx: number, enable: boolean) {
  const s: Shadow = shadows[idx];
  if (s) s.isEnabled = enable;
}

export function addShadow(shadows: Shadow[], shadow: Shadow, index: number) {
  shadows.splice(index, 0, shadow);
}

export function setShadowColor(shadows: Shadow[], idx: number, color: Color) {
  const shadow: Shadow = shadows[idx];
  if (shadow) shadow.color = color;
}

export function setShadowPosition(shadows: Shadow[], idx: number, position: ShadowPosition) {
  const shadow: Shadow = shadows[idx];
  if (shadow) shadow.position = position;
}

export function setShadowOffsetX(shadows: Shadow[], idx: number, offsetX: number) {
  const shadow: Shadow = shadows[idx];
  if (shadow) shadow.offsetX = offsetX;
}

export function setShadowOffsetY(shadows: Shadow[], idx: number, offsetY: number) {
  const shadow: Shadow = shadows[idx];
  if (shadow) shadow.offsetY = offsetY;
}

export function setShadowBlur(shadows: Shadow[], idx: number, blur: number) {
  const shadow: Shadow = shadows[idx];
  if (shadow) shadow.blurRadius = blur;
}

export function setShadowSpread(shadows: Shadow[], idx: number, spread: number) {
  const shadow: Shadow = shadows[idx];
  if (shadow) shadow.spread = spread;
}

export function deleteShadows(shadows: Shadow[], idx: number, strength: number) {
  return shadows.splice(idx, strength);
}