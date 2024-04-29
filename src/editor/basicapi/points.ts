import { ArrayMoveOpRecord } from "../../coop/client/crdt";
import { CurvePoint, PathSegment } from "../../data/baseclasses";
import { PathShape2, Shape } from "../../data/shape";
import { crdtArrayInsert, crdtArrayRemove } from "./basic";

export function addPointAt(shape: Shape, point: CurvePoint, index: number, segment = -1) {
    if (segment > -1) {
        return crdtArrayInsert((shape as PathShape2).pathsegs[segment].points, index, point);
    }
}

export function addSegmentAt(shape: Shape, segment: PathSegment, index: number) {
    return crdtArrayInsert((shape as PathShape2).pathsegs, index, segment);
}

export function deletePoints(shape: Shape, index: number, strength: number, segment = -1) {
    const ops: ArrayMoveOpRecord[] = [];
    if (segment > -1) {
        for (let i = index + strength - 1; i >= index; i--) {
            const __points = (shape as PathShape2).pathsegs[segment].points;
            const op = crdtArrayRemove(__points, i);
            if (op) ops.push(op);
        }
    }
    return ops;
}

export function deletePointAt(shape: Shape, index: number, segment = -1) {
    if (segment > -1) {
        return crdtArrayRemove((shape as PathShape2).pathsegs[segment].points, index);
    }
}