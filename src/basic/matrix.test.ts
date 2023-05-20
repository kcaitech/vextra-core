import * as chai from 'chai'
import { Matrix } from './matrix'

const {
  equal, strictEqual, deepEqual, throws,
  isFalse, isTrue, isUndefined, isNaN, isOk,
  fail,
} = chai.assert

test("invert", () => {
    const m = new Matrix();
    m.trans(100, 50);
    m.rotate(Math.PI / 2);
    m.scale(0.1, 0.2);

    const inverse = new Matrix(m.inverse)

    inverse.multi(m);
    isTrue(inverse.isIdentity());
})

test("rotate", () => {
    const m = new Matrix();
    m.rotate(Math.PI / 2);
    const xy = m.computeCoord(10, 0);

    const float_accuracy = 1e-7;
    isTrue(Math.abs(xy.x - 0) < float_accuracy)
    isTrue(Math.abs(xy.y - 10) < float_accuracy)
})

test("inverse2", () => {
    const m = new Matrix([
        -0.984807753012208,
        0.17364817766693033,
        0.17364817766693033,
        0.984807753012208,
        1010.5809781340822,
        150.9268434975672
    ]);

    const xy = m.computeCoord(100, 100);
    const inv = m.inverseCoord(xy.x, xy.y);

    const float_accuracy = 1e-7;
    isTrue(Math.abs(inv.x - 100) < float_accuracy)
    isTrue(Math.abs(inv.y - 100) < float_accuracy)
})
