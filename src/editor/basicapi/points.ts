import { ArrayMoveOpRecord } from "../../coop/client/crdt";
import { CurvePoint, PathSegment } from "../../data/baseclasses";
import { PathShape2, Shape } from "../../data/shape";
import { crdtArrayInsert, crdtArrayRemove } from "./basic";

export function addPointAt(shape: Shape, point: CurvePoint, index: number, segmentIndex: number) {
    const points = (shape as PathShape2)?.pathsegs[segmentIndex]?.points;
    if (points) {
        return crdtArrayInsert(points, index, point)
    }
}

export function addSegmentAt(shape: Shape, segment: PathSegment, index: number) {
    return crdtArrayInsert((shape as PathShape2).pathsegs, index, segment);
}

export function deletePoints(shape: Shape, index: number, strength: number, segmentIndex: number) {
    const ops: ArrayMoveOpRecord[] = [];
    for (let i = index + strength - 1; i >= index; i--) {
        const __points = (shape as PathShape2)?.pathsegs[segmentIndex]?.points;
        if (!__points) continue;
        const op = crdtArrayRemove(__points, i);
        if (op) ops.push(op);
    }
    return ops;
}

export function deletePointAt(shape: Shape, index: number, segmentIndex: number) {
    const points = (shape as PathShape2)?.pathsegs[segmentIndex]?.points;
    if (points) {
        return crdtArrayRemove(points, index);
    }
}