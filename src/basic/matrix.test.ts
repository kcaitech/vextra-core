/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

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

// test("decompose", () => {
//     const m = new Matrix([-0.9074125123405369, -0.42024104088943404, 0.2750172313593987, -0.9614392973326039, -172, -552]);
//     const decompose = m.decompose();
//     const m1 = new Matrix(decompose.T).multi(decompose.R).multi(decompose.S);
//     isTrue(m.equals(m1))
//     // console.log(m, m1)
// })
