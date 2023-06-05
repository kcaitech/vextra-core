import { BoolOp, FlattenShape, GroupShape, Shape, ShapeFrame, ShapeType, ImageShape, PathShape, RectShape, SymbolRefShape, TextShape } from "./shape";
import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, BasicMap } from "./basic";
import { Artboard } from "./artboard";
export class Page extends GroupShape implements classes.Page {
    typeId = 'page';
    artboards: BasicMap<string, Artboard> = new BasicMap();
    shapes: BasicMap<string, Shape> = new BasicMap();
    __allshapes: Map<string, WeakRef<Shape> > = new Map(); // 包含被删除的
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
        // this.onAddShape(this); // 不能add 自己
        childs.forEach((c) => this.onAddShape(c))
    }
    onAddShape(shape: Shape) {
        // check 不可以重shape id
        if (this.shapes.has(shape.id)) throw new Error("The same shape id already exists")

        this.shapes.set(shape.id, shape);
        this.__allshapes.set(shape.id, new WeakRef(shape));
        if (shape.type === ShapeType.Artboard) {
            this.artboards.set(shape.id, shape as Artboard);
        }
        if (shape instanceof GroupShape) {
            const childs = shape.childs;
            childs.forEach((c) => this.onAddShape(c))
        }
    }
    onRemoveShape(shape: Shape) { // ot上要求被删除的对象也要能查找到
        this.shapes.delete(shape.id);
        if (shape.type === ShapeType.Artboard) {
            this.artboards.delete(shape.id);
        }
        const child = (shape as GroupShape).childs;
        if (child && child.length) {
            for (let i = 0; i < child.length; i++) {
                this.onRemoveShape(child[i]);
            }
        }
    }
    getShape(shapeId: string, containsDeleted?: boolean): Shape | undefined {
        let shape;
        if (containsDeleted) {
            const ref = this.__allshapes.get(shapeId);
            shape = ref?.deref();
        }
        else {
            shape = this.shapes.get(shapeId);
        }
        if (!shape && shapeId === this.id) {
            shape = this;
        }
        return shape;
    }
    get artboardList() {
        return Array.from(this.artboards.values());
    }
    // get flatShapes() {
    //     return Array.from(this.shapes.values());
    // }
}