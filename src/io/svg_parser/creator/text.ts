import { BaseCreator } from "./base"
import * as shapeCreator from "../../../editor/creator"
import { ShapeFrame } from "../../../data"

export class TextCreator extends BaseCreator {
    createShape() {
        const x = this.attributes.x || 0
        const y = this.attributes.y || 0

        const text = this.htmlElement!.node.textContent
        if (!text) return;

        const fontStyleAttr = this.attributes.styleAttributes?.font
        const fill = this.attributes.textFill

        const textShape = shapeCreator.newTextShape("文本", new ShapeFrame(x, y, 0, 0))
        textShape.text.insertText(text, 0)

        this.shape = textShape
    }
}
