import { Transform } from "./typesdefine";
import { Transform as Transform2 } from "../basic/transform";
import { Matrix as Matrix2 } from "../basic/matrix2";

export function makeShapeTransform2By1(transform: Transform): Transform2 {
    return new Transform2({
        matrix: new Matrix2([4, 4], [
            transform.m00, transform.m01, 0, transform.m02,
            transform.m10, transform.m11, 0, transform.m12,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ], true),
    });
}

export function makeShapeTransformBy2(transform: Transform2): Transform {
    return {
        m00: transform.m00,
        m01: transform.m01,
        m02: transform.m03,
        m10: transform.m10,
        m11: transform.m11,
        m12: transform.m13,
    };
}

export function transformEquals(transform0: Transform, transform: Transform) {
    return transform0.m00 === transform.m00
        && transform0.m10 === transform.m10
        && transform0.m01 === transform.m01
        && transform0.m11 === transform.m11
        && transform0.m02 === transform.m02
        && transform0.m12 === transform.m12;
}

export function updateShapeTransformBy2(transform0: Transform, transform: Transform2) {
    transform0.m00 = transform.m00;
    transform0.m10 = transform.m10;
    transform0.m01 = transform.m01;
    transform0.m11 = transform.m11;
    transform0.m02 = transform.m03;
    transform0.m12 = transform.m13;
}
