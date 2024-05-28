import {Shape} from "./index";
import {Transform as Transform2} from "../basic/transform";
import {Matrix2} from "../index";

export function getShapeTransform2(shape: Shape): Transform2 {
    return new Transform2({
        matrix: new Matrix2([4, 4], [
            shape.transform.m00, shape.transform.m01, 0, shape.transform.m02,
            shape.transform.m10, shape.transform.m11, 0, shape.transform.m12,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ], true),
    });
}

export function updateShapeTransformBy2(shape: Shape, transform: Transform2) {
    shape.transform.m00 = transform.m00;
    shape.transform.m10 = transform.m10;
    shape.transform.m01 = transform.m01;
    shape.transform.m11 = transform.m11;
    shape.transform.m02 = transform.m03;
    shape.transform.m12 = transform.m13;
}
