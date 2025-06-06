import { FrameProxy } from "./view";
import { TextShapeView } from "../../textshape";
import { ShapeSize } from "../../../data";

export class TextFrameProxy extends FrameProxy {
    constructor(protected view: TextShapeView) {
        super(view);
    }

    __origin_frame: ShapeSize = new ShapeSize();

    forceUpdateOriginFrame() {
        const frame = this.view.data.size;
        this.__origin_frame.width = frame.width;
        this.__origin_frame.height = frame.height;
    }
}