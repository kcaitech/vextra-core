import { CurvePoint } from "../../data/baseclasses";
import { PathShape } from "../../data/shape";

export function addPointAt(shape: PathShape, point: CurvePoint, index: number) {
  shape.points.splice(index, 0, point);
}