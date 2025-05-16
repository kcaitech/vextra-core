import { FrameProxy } from "./view";
import { TextShapeView } from "../../textshape";
import { ShapeSize } from "../../../data";

export class TextFrameProxy extends FrameProxy {
    __origin_frame: ShapeSize;

    constructor(protected view: TextShapeView) {
        super(view);
        this.__origin_frame = new ShapeSize(view.data.size.width, view.data.size.height);
    }


    forceUpdateOriginFrame() {
        const frame = this.view.data.size;
        this.__origin_frame.width = frame.width;
        this.__origin_frame.height = frame.height;
    }
}