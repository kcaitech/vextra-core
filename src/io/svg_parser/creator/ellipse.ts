
import { BaseCreator } from "./base"
import * as shapeCreator from "../../../editor/creator"
import { ShapeFrame } from "../../../data"
export class EllipseCreator extends BaseCreator {
    createShape() {
        const x = this.attributes.x || 0
        const y = this.attributes.y || 0

        let width = 0
        if (this.attributes.rx) width = this.attributes.rx * 2;
        else if (this.attributes.width) width = this.attributes.width;

        let height = 0
        if (this.attributes.ry) height = this.attributes.ry * 2;
        else if (this.attributes.height) height = this.attributes.height;

        this.shape = shapeCreator.newOvalShape("圆形", new ShapeFrame(x, y, width, height), this.context.styleMgr)
    }
}
