import { ArrayMoveOpRecord } from "../../coop/client/crdt";
import { uuid } from "../../basic/uuid";
import { CurveMode, CurvePoint } from "../../data/baseclasses";
import { PathShape } from "../../data/shape";
import { crdtArrayInsert, crdtArrayRemove } from "./basic";

export function addPointAt(uid: string, shape: PathShape, point: CurvePoint, index: number) {
    return crdtArrayInsert(uid, shape.points, index, point);
}
export function repalcePoints(uid: string, shape: PathShape, points: CurvePoint[]) {
    const ops: ArrayMoveOpRecord[] = [];
    ops.push(...deletePoints(uid, shape, 0, shape.points.length));
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const copy = new CurvePoint(p.crdtidx, uuid(), p.x, p.y, CurveMode.Straight);
        const op = crdtArrayInsert(uid, shape.points, i, copy);
        if (op) ops.push(op);
    }
    return ops;
}
export function deletePoints(uid: string, shape: PathShape, index: number, strength: number) {
    const ops: ArrayMoveOpRecord[] = [];
    for (let i = index + strength - 1; i >= index; i--) {
        const op = crdtArrayRemove(uid, shape.points, i);
        if (op) ops.push(op);
    }
    return ops;
}
export function deletePointAt(uid: string, shape: PathShape, index: number) {
    return crdtArrayRemove(uid, shape.points, index);
}