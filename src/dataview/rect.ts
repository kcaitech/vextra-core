import { RectShape } from "../data/shape";
import { PathShapeView } from "./pathshape";

export class RectShapeView extends PathShapeView {
    get data(): RectShape {
        return this.m_data as RectShape;
    }
    getRectRadius() {
        return this.data.getRectRadius();
    }
}