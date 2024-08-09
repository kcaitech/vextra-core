import {
    GroupShape,
    Shape,
    ShapeFrame,
    ShapeType,
    ImageShape,
    PathShape,
    RectShape,
    TextShape,
    SymbolShape,
    CutoutShape,
    Transform,
    ShapeSize
} from "./shape";
import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, WatchableObject } from "./basic";
import { Artboard } from "./artboard";
import { Color } from "./color";
import { TableCell } from "./table";
import { Guide } from "./baseclasses";

class PageCollectNotify extends WatchableObject {
    constructor() {
        super();
    }
}

export class Page extends GroupShape implements classes.Page {

    static defaultBGColor = new Color(1, 239, 239, 239);

    typeId = 'page';
    backgroundColor?: Color;
    artboards: Map<string, Artboard> = new Map();
    shapes: Map<string, Shape> = new Map();
    __allshapes: Map<string, WeakRef<Shape>> = new Map(); // 包含被删除的
    __collect: PageCollectNotify = new PageCollectNotify();
    __symbolshapes: Map<string, SymbolShape> = new Map();
    isReserveLib: boolean;
    cutouts: Map<string, CutoutShape> = new Map();
    guides?: BasicArray<Guide>;
    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>,
        isReserveLib?: boolean,
        // horReferLines?: BasicArray<ReferLine>,
        // verReferLines?: BasicArray<ReferLine>,
        guides?: BasicArray<Guide>
    ) {
        super(
            crdtidx,
            id,
            name,
            ShapeType.Page,
            transform,
            style,
            childs,
        )
        // this.onAddShape(this); // 不能add 自己
        childs.forEach((c) => this.onAddShape(c));
        this.isReserveLib = !!isReserveLib;
        // this.horReferLines = horReferLines;
        // this.verReferLines = verReferLines;
        this.guides = guides;
    }

    getOpTarget(path: string[]): any {
        if (path.length === 0) throw new Error("path is empty");
        const path0 = path[0];
        if (path.length === 1) {
            if (path0 === this.id) return this;
            throw new Error("The shape is not found");
        }
        const path1 = path[1];
        const shape = this.getShape(path1, true); // 由于op是批量按path路径排序执行的，就有可能要修改的shape被提前delete掉了
        if (shape) return shape.getOpTarget(path.slice(2));
        if (path1 === 'guides' && !this.guides) this.guides = new BasicArray();
        return super.getOpTarget(path.slice(1));
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
        if (shape.type === ShapeType.Cutout) {
            this.cutouts.set(shape.id, shape as CutoutShape);
        }
        shape.onAdded();
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
        if (shape.type === ShapeType.Cutout) {
            this.cutouts.delete(shape.id);
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
        } else {
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
            } else if (shape instanceof TextShape || shape instanceof TableCell) {
                if (shape.text) shape.text.getUsedFontNames(ret);
            }
        }

        return ret;
    }

    get cutoutList() {
        return Array.from(this.cutouts.values());
    }

    get isContainer() {
        return true;
    }
}