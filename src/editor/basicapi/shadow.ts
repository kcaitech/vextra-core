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
  const s = new Shadow(uuid(), true, 4, new Color(0.4, 0, 0, 0), 2, 2, 2);
  style.shadows.unshift(s);
  return s;
}
