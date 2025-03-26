import { ViewLayout } from "./view";
import { ShapeSize } from "../../../data";
import { PathShapeView } from "../../pathshape";

export class PathLayout extends ViewLayout {
    constructor(protected view: PathShapeView) {
        super(view);
    }

     _layout(
        parentFrame: ShapeSize | undefined,
        scale: { x: number, y: number } | undefined,
    ): void {
        super._layout(parentFrame, scale);
        this.view.m_pathsegs = undefined;
    }
}