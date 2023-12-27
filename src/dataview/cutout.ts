import { CutoutShape } from "../data/shape";
import { PathShapeView } from "./pathshape";

export class CutoutShapeView extends PathShapeView {
    get data(): CutoutShape {
        return this.m_data as CutoutShape;
    }
}