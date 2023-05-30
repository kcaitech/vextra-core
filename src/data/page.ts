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
        const mapping = (cs: Shape[]) => {
            for (let i = cs.length - 1; i > -1; i--) {
                const item = cs[i];
                this.onAddShape(item);
                const childs = item?.childs || [];
                if (childs.length) {
                    mapping(childs);
                }
            }
        }
        mapping(this.childs);
    }
    onAddShape(shape: Shape) {
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
        if (containsDeleted) {
            const ref = this.__allshapes.get(shapeId);
            return ref?.deref();
        }
        return this.shapes.get(shapeId);
    }
    get artboardList() {
        return Array.from(this.artboards.values());
    }
    get flatShapes() {
        return Array.from(this.shapes.values());
    }
}