import { BoolOp, FlattenShape, GroupShape, Shape, ShapeFrame, ShapeType, ImageShape, PathShape, RectShape, SymbolRefShape, TextShape } from "./shape";
import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
import { Artboard } from "./artboard";
import { TableCell, TableShape } from "./table";
export class Page extends GroupShape implements classes.Page {
    typeId = 'page';
    artboards: Map<string, Artboard> = new Map();
    shapes: Map<string, Shape> = new Map();
    __allshapes: Map<string, WeakRef<Shape>> = new Map(); // 包含被删除的
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape)>
    ) {
        super(
            id,
            name,
            ShapeType.Page,
            frame,
            style,
            childs
        )
        // this.onAddShape(this); // 不能add 自己
        childs.forEach((c) => this.onAddShape(c))
    }
    onAddShape(shape: Shape, recursive: boolean = true) {
        // check 不可以重shape id
        if (this.shapes.has(shape.id)) throw new Error("The same shape id already exists");
        this.shapes.set(shape.id, shape);
        this.__allshapes.set(shape.id, new WeakRef(shape));
        if (shape.type === ShapeType.Artboard) {
            this.artboards.set(shape.id, shape as Artboard);
        }
        if (recursive && (shape instanceof GroupShape || shape instanceof TableShape || shape instanceof TableCell)) {
            const childs = shape.childs;
            childs.forEach((c) => this.onAddShape(c))
        }
    }
    onRemoveShape(shape: Shape, recursive: boolean = true) { // ot上要求被删除的对象也要能查找到
        this.shapes.delete(shape.id);
        if (shape.type === ShapeType.Artboard) {
            this.artboards.delete(shape.id);
        }
        if (recursive && (shape instanceof GroupShape || shape instanceof TableShape || shape instanceof TableCell)) {
            const childs = shape.childs;
            childs.forEach((c) => this.onRemoveShape(c))
        }
    }
    getShape(shapeId: string, containsDeleted?: boolean): Shape | undefined {
        let shape;
        if (containsDeleted) {
            shape = this.shapes.get(shapeId);
            if (!shape) {
                const ref = this.__allshapes.get(shapeId);
                shape = ref?.deref();
            }
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

    getUsedFontNames(fontNames?: Set<string>): Set<string> {
        const ret = fontNames ?? new Set<string>();
        const stack: Shape[] = [this];

        while (stack.length > 0) {
            const shape = stack.pop();
            if (shape instanceof GroupShape || shape instanceof TableShape || shape instanceof TableCell) {
                stack.push(...shape.childs);
            }
            else if (shape instanceof TextShape) {
                shape.text.getUsedFontNames(ret);
            }
        }

        return ret;
    }
}