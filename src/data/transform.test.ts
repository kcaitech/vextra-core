/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// m00: 0.36926143017001317
// m01: -0.4736237374594613
// m02: 35.298167337300676
// m10: 0.9293255598490748
// m11: 0.8807272877088184
// m12: 0

import * as chai from 'chai'
const {
    equal, strictEqual, deepEqual, throws,
    isFalse, isTrue, isUndefined, isNaN, isOk,
    fail,
} = chai.assert

import { Transform } from "./transform"
import { isEqual } from "../basic/number_utils"
import { Matrix } from "../basic/matrix"

test("transform decompose", () => {
    const m = new Matrix([0.44246047735214233, 0.8967880010604858, -0.5553208589553833, 0.8316361308097839, 43.527407400266384, 0])
    const o = Transform.from(m)
    const d = o.decompose()
    const o2 = d.translate.multi(d.rotate).multi(d.skew).multi(d.scale)
    isTrue(o.equals(o2))
})

test("transform", () => {
    const o = new Transform(0.36926143017001317, -0.4736237374594613, 35.298167337300676, 0.9293255598490748, 0.8807272877088184, 0)
    const t = o.clone()
    // 0
    isTrue(o.equals(t))

    const scaleX = 2.0847457627118646
    const scaleY = 1.7394366197183098
    o.scale(scaleX, scaleY)

    const _scale = new Transform();
    _scale.scale(scaleX, scaleY)
    t.multiAtLeft(_scale)
    // t.addTransform(_scale);

    // 1
    isTrue(o.equals((t)))

    const ox = o.clearScaleSize()
    const tx = t.decomposeScale()
    t.clearScaleSize()

    // 2
    isTrue(o.equals((t)))

    // 3
    isTrue(isEqual(ox.x, tx.x) && isEqual(ox.y, tx.y))
})


test("transform2", () => {
    const m = new Matrix([0.44246047735214233, 0.8967880010604858, -0.5553208589553833, 0.8316361308097839, 43.527407400266384, 0])
    const o = Transform.from(m)
    const t = (o.clone())
    // 0
    isTrue(o.equals((t)))

    const scaleX = 2.0847457627118646
    const scaleY = 1.7394366197183098
    o.scale(scaleX, scaleY)

    const _scale = new Transform().scale(scaleX, scaleY);
    t.addTransform(_scale);

    // 1
    isTrue(o.equals((t)))

    const ox = o.clearScaleSize()
    const tx = t.decomposeScale()
    t.clearScaleSize()

    // 2
    isTrue(o.equals((t)))

    // // 3
    isTrue(isEqual(ox.x, tx.x) && isEqual(ox.y, tx.y))
})