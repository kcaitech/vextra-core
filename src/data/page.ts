import { BoolOp, FlattenShape, GroupShape, Shape, ShapeFrame, ShapeType, ImageShape, PathShape, RectShape, SymbolRefShape, TextShape } from "./shape";
import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, BasicMap } from "./basic";
import { Artboard } from "./artboard";
export class Page extends GroupShape implements classes.Page {
    typeId = 'page';
    artboards: BasicMap<string, Artboard> = new BasicMap();
    flat: BasicMap<string, Shape> = new BasicMap();
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape)>
    ) {
        super(
            id,
            name,
            ShapeType.Page,
            frame,
            style,
            boolOp,
            childs
        )
        const recursion = (cs: Shape[]) => {
            for (let i = cs.length - 1; i > -1; i--) {
                const item = cs[i];
                if (item.type == ShapeType.Artboard) {
                    this.artboards.set(item.id, item as Artboard);
                }
                this.flat.set(item.id, item);
                const childs = item?.childs || [];
                if (childs.length) {
                    recursion(childs);
                }
            }
        }
        recursion(this.childs);
    }
    addArtboard(artboard: Shape) {
        this.artboards.set(artboard.id, artboard as Artboard);
    }
    removeArtboard(artboard: Shape) {
        this.artboards.delete(artboard.id);
    }
    addShape(shape: Shape) {
        this.flat.set(shape.id, shape);
    }
    removeShape(shape: Shape) {
        this.flat.delete(shape.id);
    }
    get artboardList() {
        return Array.from(this.artboards.values());
    }
    get flatShapes() {
        return Array.from(this.flat.values());
    }
}