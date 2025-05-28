/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import * as impl from "./classes"
import * as types from "./typesdefine"
import { lessThan, FMT_VER_transfrom } from "./fmtver"
import { Matrix } from "../basic/matrix"
export interface IImportContext {
    document: impl.Document
    fmtVer: string
}

export function compatibleOldData(source: types.Shape, ctx?: IImportContext) {
    if (ctx && lessThan(ctx.fmtVer, FMT_VER_transfrom)) { // todo 应该在import ctx中初始化好，不是每次判断
        const _source = source as any
        const frame = _source.frame as types.ShapeFrame
        const isFlippedHorizontal = _source.isFlippedHorizontal as boolean
        const isFlippedVertical = _source.isFlippedVertical as boolean
        const rotation = _source.rotation ?? 0
        if (!isFlippedHorizontal && !isFlippedVertical && !rotation) {
            _source.size = { width: frame.width, height: frame.height }
            const transform = new impl.Transform()
            transform.m02 = frame.x
            transform.m12 = frame.y
            _source.transform = transform
        } else {
            const m = new Matrix()
            const cx = frame.width / 2
            const cy = frame.height / 2
            m.trans(-cx, -cy)
            if (rotation) m.rotate(rotation / 360 * 2 * Math.PI)
            if (isFlippedHorizontal) m.flipHoriz()
            if (isFlippedVertical) m.flipVert()
            m.trans(cx, cy)
            m.trans(frame.x, frame.y)
            _source.size = { width: frame.width, height: frame.height }
            const transform = new impl.Transform(m.m00, m.m01, m.m02, m.m10, m.m11, m.m12)
            _source.transform = transform;
        }
    }
}