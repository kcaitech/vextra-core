import { RadiusType } from "../data/consts";
import { StarShape } from "../data/shape";
import { PathShapeView } from "./pathshape";

export class StarShapeView extends PathShapeView {
    get data(): StarShape {
        return this.m_data as StarShape;
    }
    get radiusType() {
        return RadiusType.Fixed;
    }
}