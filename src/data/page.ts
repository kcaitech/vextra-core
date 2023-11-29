import { GroupShape, Shape, ShapeFrame, ShapeType, ImageShape, PathShape, RectShape, TextShape, SymbolShape, Variable } from "./shape";
import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, Watchable } from "./basic";
import { Artboard } from "./artboard";
import { SymbolRefShape, TableCell } from "./classes";
class PageCollectNotify extends Watchable(Object) {
    constructor() {
        super();
    }
}
export class Page extends GroupShape implements classes.Page {
    typeId = 'page';
    artboards: Map<string, Artboard> = new Map();
    shapes: Map<string, Shape> = new Map();
    __allshapes: Map<string, WeakRef<Shape>> = new Map(); // 包含被删除的
    __collect: PageCollectNotify = new PageCollectNotify();
    __symbolshapes: Map<string, SymbolShape> = new Map();
    isReserveLib: boolean;
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>,
        isReserveLib?: boolean
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
        childs.forEach((c) => this.onAddShape(c));
        this.isReserveLib = !!isReserveLib;
    }

    getTarget(targetId: (string | { rowIdx: number, colIdx: number })[]): Shape | Variable | undefined {
        if (targetId.length > 0) {
            const shapeId = targetId[0] as string;
            const shape = this.getShape(shapeId);
            if (!shape) return undefined;
            return shape.getTarget(targetId.slice(1));
        }
        return this;
    }

    onAddShape(shape: Shape, recursive: boolean = true) {
        // check 不可以重shape id
        if (this.shapes.has(shape.id)) throw new Error("The same shape id already exists");
        this.shapes.set(shape.id, shape);
        this.__allshapes.set(shape.id, new WeakRef(shape));
        if (shape.type === ShapeType.Artboard) {
            this.artboards.set(shape.id, shape as Artboard);
        }
        if (shape.type === ShapeType.Symbol) {
            this.__symbolshapes.set(shape.id, shape as SymbolShape);
        }
        if (recursive && (shape instanceof GroupShape)) {
            const childs = shape.childs;
            childs.forEach((c) => this.onAddShape(c))
        }
    }
    onRemoveShape(shape: Shape, recursive: boolean = true) { // ot上要求被删除的对象也要能查找到
        this.shapes.delete(shape.id);
        if (shape.type === ShapeType.Artboard) {
            this.artboards.delete(shape.id);
        }
        if (shape.type === ShapeType.Symbol) {
            this.__symbolshapes.delete(shape.id);
        }
        shape.onRemoved();
        if (recursive && (shape instanceof GroupShape)) {
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
            if (shape instanceof GroupShape) {
                stack.push(...shape.childs);
            }
            else if (shape instanceof TextShape || shape instanceof TableCell) {
                if (shape.text) shape.text.getUsedFontNames(ret);
            }
        }

        return ret;
    }
}