import { RadiusType } from "../data/consts";
import { PolygonShape } from "../data/shape";
import { PathShapeView } from "./pathshape";

export class PolygonShapeView extends PathShapeView {
    get data(): PolygonShape {
        return this.m_data as PolygonShape;
    }
    get radiusType() {
        return RadiusType.Fixed;
    }

    get counts() {
        return this.data.counts;
    }
}