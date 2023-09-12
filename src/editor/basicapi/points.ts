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
    const p = new CurvePoint(v4(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(_p.point.x, _p.point.y));
    shape.points.push(p);
  }
}
export function deletePoints(shape: PathShape, index: number, strength: number) {
  return shape.points.splice(index, strength);
}
export function deletePointAt(shape: PathShape, index: number) {
  return shape.points.splice(index, 1);
}