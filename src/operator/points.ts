/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { CurvePoint, PathSegment } from "../data/baseclasses";
import { PathShape } from "../data/shape";
import { BasicOp } from "./basicop";

export class PointsOp {
    constructor(private _basicop: BasicOp) { }

    addPointAt(shape: PathShape, point: CurvePoint, index: number, segmentIndex: number) {
        const points = shape.pathsegs[segmentIndex]?.points;
        if (points) {
            return this._basicop.crdtArrayInsert(points, index, point)
        }
    }

    addSegmentAt(shape: PathShape, segment: PathSegment, index: number) {
        return this._basicop.crdtArrayInsert(shape.pathsegs, index, segment);
    }

    // export function insertSegmentAt(shape: PathShape, index: number, segment: PathSegment) {
    //     checkPathSegment(segment)
    //     return crdtArrayInsert(shape.pathsegs, index, segment);
    // }

    deleteSegmentAt(shape: PathShape, index: number) {
        return this._basicop.crdtArrayRemove(shape.pathsegs, index)
    }

    deletePoints(shape: PathShape, index: number, strength: number, segmentIndex: number) {
        for (let i = index + strength - 1; i >= index; i--) {
            const __points = shape.pathsegs[segmentIndex]?.points;
            if (!__points) continue;
            this._basicop.crdtArrayRemove(__points, i);
        }
    }

    deletePointAt(shape: PathShape, index: number, segmentIndex: number) {
        const points = shape.pathsegs[segmentIndex]?.points;
        if (points) {
            return this._basicop.crdtArrayRemove(points, index);
        }
    }
}