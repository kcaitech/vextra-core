import { BoolShape, Shape, Style } from "../data/classes";
import { ShapeView } from "../dataview";

// find first usable style
export function findUsableFillStyle(shape: Shape | ShapeView): Style {
    if (shape.style.fills.length > 0) return shape.style;
    if (shape instanceof BoolShape && shape.childs.length > 0) return findUsableFillStyle(shape.childs[0]);
    return shape.style;
}

export function findUsableBorderStyle(shape: Shape | ShapeView): Style {
    if (shape.style.borders.length > 0) return shape.style;
    if (shape instanceof BoolShape && shape.childs.length > 0) return findUsableBorderStyle(shape.childs[0]);
    return shape.style;
}
