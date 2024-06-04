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

export function makeShapeTransform1By2(transform2: Transform2): Transform {
    return {
        m00: transform2.m00,
        m01: transform2.m01,
        m02: transform2.m03,
        m10: transform2.m10,
        m11: transform2.m11,
        m12: transform2.m13,
    };
}

export function transform1Equals2(transform: Transform, transform2: Transform) {
    return transform.m00 === transform2.m00
        && transform.m10 === transform2.m10
        && transform.m01 === transform2.m01
        && transform.m11 === transform2.m11
        && transform.m02 === transform2.m02
        && transform.m12 === transform2.m12;
}

export function updateShapeTransform1By2(transform: Transform, transform2: Transform2) {
    transform.m00 = transform2.m00;
    transform.m10 = transform2.m10;
    transform.m01 = transform2.m01;
    transform.m11 = transform2.m11;
    transform.m02 = transform2.m03;
    transform.m12 = transform2.m13;
}
