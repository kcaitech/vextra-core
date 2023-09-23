import { Style } from "./style";
import { Text } from "./text";
import * as classes from "./baseclasses"
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType, Variable, VariableType
} from "./baseclasses"
import { ShapeType, ShapeFrame } from "./baseclasses";
import { Shape } from "./shape";

/**
 * virtual shape for override
 */
export class OverrideShape extends Shape implements classes.OverrideShape {
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
