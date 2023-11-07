import { ShadowPosition } from "../../data/baseclasses";
import { uuid } from "../../basic/uuid";
import { Color, Shadow, Style } from "../../data/style";

// 阴影
export function deleteShadowAt(style: Style, idx: number) {
  return style.shadows.splice(idx, 1)[0];
}

export function setShadowEnable(style: Style, idx: number, enable: boolean) {
  const s: Shadow = style.shadows[idx];
  if (s) s.isEnabled = enable;
}

export function addShadow(style: Style) {
  const s = new Shadow(uuid(), true, 4, new Color(0.8, 80, 80, 80), 2, 2, 4, ShadowPosition.Outer);
  style.shadows.unshift(s);
  return s;
}
