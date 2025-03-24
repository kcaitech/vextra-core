import { makeShapeTransform2By1, ResizingConstraints2, Shape, ShapeSize, updateShapeTransform1By2 } from "../../data";


function _checkNum(val: number) {
    if (Number.isNaN(val) || (!Number.isFinite(val))) throw new Error(String(val));
}

function _checkFrame(frame: ShapeSize) {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    _checkNum(frame.width);
    _checkNum(frame.height);
}

export function addCommonAttr(shape: Shape) {
    const transform2 = makeShapeTransform2By1(shape.transform);
    transform2.setRotateZ(0);
    updateShapeTransform1By2(shape.transform, transform2);
    shape.isVisible = true;
    shape.isLocked = false;
    shape.constrainerProportions = false;
    shape.nameIsFixed = false;
    shape.resizingConstraint = ResizingConstraints2.Default;
}
