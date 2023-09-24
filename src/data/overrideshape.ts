import { Style } from "./style";
import { Text } from "./text";
import { ShapeType, ShapeFrame } from "./baseclasses";
import { Shape } from "./shape";

/**
 * virtual shape for override
 */
export class OverrideShape extends Shape {
    typeId = 'override-shape'

    stringValue?: string // 兼容sketch，用户一旦编辑，转成text
    __stringValue_text?: Text;
    text?: Text // 设置override_text时初始化
    imageRef?: string
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style
    ) {
        super(
            id,
            name,
            ShapeType.OverrideShape,
            frame,
            style
        )
    }
}
