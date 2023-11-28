import { CurveMode, CurvePoint, Point2D } from "../../data/baseclasses";
import { PathShape } from "../../data/shape";
import { v4 } from "uuid";

export function addPointAt(shape: PathShape, point: CurvePoint, index: number) {
  shape.points.splice(index, 0, point);
}
export function repalcePoints(shape: PathShape, points: CurvePoint[]) {
  shape.points.splice(0, shape.points.length);
  for (let i = 0; i < points.length; i++) {
    const _p = points[i];
    const p = new CurvePoint(v4(), _p.x, _p.y, CurveMode.Straight);
    shape.points.push(p);
  }
}
export function deletePoints(shape: PathShape, index: number, strength: number) {
  return shape.points.splice(index, strength);
}
export function deletePointAt(shape: PathShape, index: number) {
  return shape.points.splice(index, 1);
}