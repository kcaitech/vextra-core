import { BaseCreator } from "./base"
import * as shapeCreator from "../../../editor/creator"
import { ShapeFrame } from "../../../data"

export class LineCreator extends BaseCreator {
    createShape() {
        const x1 = this.attributes.x1 || 0
        const y1 = this.attributes.y1 || 0
        const x2 = this.attributes.x2 || 0
        const y2 = this.attributes.y2 || 0
        const dx = x2 - x1
        const dy = y2 - y1
        this.shape = shapeCreator.newLineShape("直线", new ShapeFrame(x1, y1, 1, 1), this.context.styleMgr)
    }
}
