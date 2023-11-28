import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
import { GroupShape, ImageShape, PathShape, RectShape, Shape, SymbolShape, TextShape } from "./shape";
import { ShapeType } from "./typesdefine";
import { Style } from "./style";

// export class SymbolShapeStates extends GroupShape implements classes.SymbolShapeStates {
//     typeId = 'symbolshapestates';
//     constructor(
//         id: string,
//         name: string,
//         type: ShapeType,
//         frame: classes.ShapeFrame,
//         style: Style,
//         childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>
//     ) {
//         super(id, name, ShapeType.Page, frame, style, childs);
//         (childs as any).typeId = "childs";
//     }
// }