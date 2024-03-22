import { ArrayMoveOpRecord } from "../../coop/client/crdt";
import { uuid } from "../../basic/uuid";
import { CurveMode, CurvePoint } from "../../data/baseclasses";
import { PathShape, PathShape2, Shape } from "../../data/shape";
import { crdtArrayInsert, crdtArrayRemove } from "./basic";

export function addPointAt(shape: Shape, point: CurvePoint, index: number, segment = -1) {
    if (segment > -1) {
        return crdtArrayInsert((shape as PathShape2).pathsegs[segment].points, index, point);
    } else {
        return crdtArrayInsert((shape as PathShape).points, index, point);
    }
}
export function repalcePoints(shape: PathShape, points: CurvePoint[]) {
    const ops: ArrayMoveOpRecord[] = [];
    ops.push(...deletePoints(shape, 0, shape.points.length));
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const copy = new CurvePoint(p.crdtidx, uuid(), p.x, p.y, CurveMode.Straight);
        const op = crdtArrayInsert(shape.points, i, copy);
        if (Array.isArray(op)) ops.push(...op);
        else if (op) ops.push(op);
    }
    return ops;
}
export function deletePoints(shape: Shape, index: number, strength: number, segment = -1) {
    const ops: ArrayMoveOpRecord[] = [];
    if (segment > -1) {
        for (let i = index + strength - 1; i >= index; i--) {
            const __points = (shape as PathShape2).pathsegs[segment].points;
            const op = crdtArrayRemove(__points, i);
            if (op) ops.push(op);
        }
    } else {
        for (let i = index + strength - 1; i >= index; i--) {
            const op = crdtArrayRemove((shape as PathShape).points, i);
            if (op) ops.push(op);
        }
    }
    return ops;
}
export function deletePointAt(shape: Shape, index: number, segment = -1) {
    if (segment > -1) {
        return crdtArrayRemove((shape as PathShape2).pathsegs[segment].points, index);
    } else {
        return crdtArrayRemove((shape as PathShape).points, index);
    }
}