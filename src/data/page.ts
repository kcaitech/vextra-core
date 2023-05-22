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
        const maping = (cs: Shape[]) => {
            for (let i = cs.length - 1; i > -1; i--) {
                const item = cs[i];
                this.addShape(item);
                const childs = item?.childs || [];
                if (childs.length) {
                    maping(childs);
                }
            }
        }
        maping(this.childs);
    }
    addShape(shape: Shape) {
        this.flat.set(shape.id, shape);
        if (shape.type == ShapeType.Artboard) {
            this.artboards.set(shape.id, shape as Artboard);
        }
    }
    removeShape(shape: Shape) {
        this.flat.delete(shape.id);
        if (shape.type == ShapeType.Artboard) {
            this.artboards.delete(shape.id);
        }
        const child = (shape as GroupShape).childs;
        if (child && child.length) {
            for (let i = 0; i < child.length; i++) {
                this.removeShape(child[i]);
            }
        }
    }
    get artboardList() {
        return Array.from(this.artboards.values());
    }
    get flatShapes() {
        return Array.from(this.flat.values());
    }
}