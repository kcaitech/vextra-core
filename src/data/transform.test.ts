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

import { makeShapeTransform1By2, makeShapeTransform2By1 } from "./shape_transform_util"
import { Transform } from "./transform"
import { Transform as Transform2 } from "../basic/transform"
import { ColVector3D } from "../basic/matrix2"
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
    const t = makeShapeTransform2By1(o)
    // 0
    isTrue(o.equals(makeShapeTransform1By2(t)))

    const scaleX = 2.0847457627118646
    const scaleY = 1.7394366197183098
    o.scale(scaleX, scaleY)

    const _scale = new Transform2().setScale(ColVector3D.FromXYZ(scaleX, scaleY, 1));
    t.addTransform(_scale);

    // 1
    isTrue(o.equals(makeShapeTransform1By2(t)))

    const ox = o.clearScale()
    const tx = t.decomposeScale()
    t.clearScaleSize()

    // 2
    isTrue(o.equals(makeShapeTransform1By2(t)))

    // 3
    isTrue(isEqual(ox.x, tx.x) && isEqual(ox.y, tx.y))
})


test("transform2", () => {
    const m = new Matrix([0.44246047735214233, 0.8967880010604858, -0.5553208589553833, 0.8316361308097839, 43.527407400266384, 0])
    const o = Transform.from(m)
    const t = makeShapeTransform2By1(o)
    // 0
    isTrue(o.equals(makeShapeTransform1By2(t)))

    const scaleX = 2.0847457627118646
    const scaleY = 1.7394366197183098
    o.scale(scaleX, scaleY)

    const _scale = new Transform2().setScale(ColVector3D.FromXYZ(scaleX, scaleY, 1));
    t.addTransform(_scale);

    // 1
    isTrue(o.equals(makeShapeTransform1By2(t)))

    const ox = o.clearScale()
    const tx = t.decomposeScale()
    t.clearScaleSize()

    // 2
    isTrue(o.equals(makeShapeTransform1By2(t)))

    // // 3
    isTrue(isEqual(ox.x, tx.x) && isEqual(ox.y, tx.y))
})