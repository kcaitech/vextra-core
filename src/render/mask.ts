import { BoolShapeView, EL, elh, PathShapeView } from "../dataview";
import { stroke } from "./stroke";
import { renderFills } from "./SVG/effects";

// 绘制轮廓
export function outline(view: PathShapeView | BoolShapeView) {
    const path = view.getPath().clone();
    const border = view.getBorder();
    const fill = view.getFills();
    if (border.strokePaints.length) path.addPath(stroke(view));
    return renderFills(elh, fill, view.frame, path.toSVGString());
}

// 漂白
export function bleach(el: EL) {

}