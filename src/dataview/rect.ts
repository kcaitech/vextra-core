import { RectShape } from "../data";
import { PathShapeView } from "./pathshape";

export class RectShapeView extends PathShapeView {
    get data(): RectShape {
        return this.m_data as RectShape;
    }
}