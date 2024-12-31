// m00: 0.36926143017001317
// m01: -0.4736237374594613
// m02: 35.298167337300676
// m10: 0.9293255598490748
// m11: 0.8807272877088184
// m12: 0

import { makeShapeTransform1By2, makeShapeTransform2By1 } from "./shape_transform_util"
import { Transform } from "./transform"
import { Transform as Transform2 } from "../basic/transform"
import { ColVector3D } from "../basic/matrix2"

test("transform", () => {
    const o = new Transform(0.36926143017001317, -0.4736237374594613, 35.298167337300676, 0.9293255598490748, 0.8807272877088184, 0)
    const t = makeShapeTransform2By1(o)
    const scaleX = 2.0847457627118646
    const scaleY = 1.7394366197183098
    o.scale(scaleX, scaleY)

    const _scale = new Transform2().setScale(ColVector3D.FromXYZ(scaleX, scaleY, 1));
    t.addTransform(_scale);

    o.clearScale()
    t.clearScaleSize()

    const o2 = makeShapeTransform1By2(t)

    expect(o.equals(o2))
})