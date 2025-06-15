/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ArrayMoveOpRecord, isGoodCrdtArr } from "../basic/crdt";
import { CurvePoint, PathSegment } from "../../data/baseclasses";
import { PathShape } from "../../data/shape";
import { crdtArrayInsert, crdtArrayRemove } from "./basic";

function checkPathSegment(segment: PathSegment) {
    if (!isGoodCrdtArr(segment.points)) throw new Error("wrong segment points")
}

export function addPointAt(shape: PathShape, point: CurvePoint, index: number, segmentIndex: number) {
    const points = shape.pathsegs[segmentIndex]?.points;
    if (points) {
        return crdtArrayInsert(points, index, point)
    }
}

export function addSegmentAt(shape: PathShape, segment: PathSegment, index: number) {
    checkPathSegment(segment)
    return crdtArrayInsert(shape.pathsegs, index, segment);
}

// export function insertSegmentAt(shape: PathShape, index: number, segment: PathSegment) {
//     checkPathSegment(segment)
//     return crdtArrayInsert(shape.pathsegs, index, segment);
// }

export function deleteSegmentAt(shape: PathShape, index: number) {
    return crdtArrayRemove(shape.pathsegs, index)
}

export function deletePoints(shape: PathShape, index: number, strength: number, segmentIndex: number) {
    const ops: ArrayMoveOpRecord[] = [];
    for (let i = index + strength - 1; i >= index; i--) {
        const __points = shape.pathsegs[segmentIndex]?.points;
        if (!__points) continue;
        const op = crdtArrayRemove(__points, i);
        if (op) ops.push(op);
    }
    return ops;
}

export function deletePointAt(shape: PathShape, index: number, segmentIndex: number) {
    const points = shape.pathsegs[segmentIndex]?.points;
    if (points) {
        return crdtArrayRemove(points, index);
    }
}