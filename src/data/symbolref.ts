import { ResourceMgr } from "./basic";
import { Style } from "./style";
import { Para, ParaAttr, Span, Text } from "./text";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export { CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint, ShapeFrame, Ellipse, PathSegment, OverrideType } from "./baseclasses"
import { ShapeType, ShapeFrame, OverrideType } from "./baseclasses"
import { Path } from "./path";
import { TextLayout } from "./textlayout";
import { uuid } from "../basic/uuid";
import { mergeParaAttr, mergeSpanAttr } from "./textutils";
import { GroupShape, Shape, SymbolShape, TextShape } from "./shape";

export class OverrideShape extends Shape implements classes.OverrideShape {
    typeId = 'override-shape'
    refId: string

    override_stringValue?: boolean
    override_text?: boolean
    override_image?: boolean

    stringValue?: string // 兼容sketch，用户一旦编辑，转成text
    __stringValue_text?: Text;
    text?: Text // 设置override_text时初始化
    imageRef?: string
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        refId: string
    ) {
        super(
            id,
            name,
            ShapeType.OverrideShape,
            frame,
            style
        )
        this.refId = refId
    }

    getPath(): Path {
        const x = 0;
        const y = 0;
        const w = this.frame.width;
        const h = this.frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return new Path(path);
    }

    static getPathOfFrame(frame: ShapeFrame): Path {
        const x = 0;
        const y = 0;
        const w = frame.width;
        const h = frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return new Path(path);
    }

    // getSymbolMgr(): ResourceMgr<SymbolShape> | undefined {
    //     if (!this.__symMgr) {
    //         const parent = this.parent as SymbolRefShape;
    //         this.__symMgr = parent.__symMgr;
    //     }
    //     return this.__symMgr;
    // }

    // getRefShape(): Shape | undefined {
    //     if (!this.__refShape) {
    //         const parent = this.parent as SymbolRefShape;
    //         const symMgr = parent.__symMgr;
    //         const sym = symMgr?.getSync(parent.refId);
    //         const page = sym?.getPage();
    //         this.__refShape = page?.getShape(this.refId); // todo
    //     }
    //     return this.__refShape;
    // }

    // image
    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    private __cacheData?: { buff: Uint8Array, base64: string };

    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }
    peekImage() {
        return this.__cacheData?.base64;
    }
    // image shape
    async loadImage(): Promise<string> {
        if (!this.imageRef) return "";
        if (this.__cacheData) return this.__cacheData.base64;
        this.__cacheData = this.__imageMgr && await this.__imageMgr.get(this.imageRef)
        return this.__cacheData && this.__cacheData.base64 || "";
    }

    // // text
    // setFrameSize(w: number, h: number) {
    //     super.setFrameSize(w, h);
    //     if (this.text) this.text.updateSize(this.frame.width, this.frame.height)
    // }

    getText(refShape: Shape): Text | undefined {
        let text = this.text;

        if (this.stringValue) {
            if (this.__stringValue_text) {
                text = this.__stringValue_text;
            }
            else {

                if (text) throw new Error("Duplicate set text and stringValue")
                if (!(refShape instanceof TextShape)) throw new Error("refshape is not textshape")

                text = new Text(new BasicArray());
                const para = new Para('\n', new BasicArray());
                para.attr = new ParaAttr();
                text.paras.push(para);
                const span = new Span(para.length);
                para.spans.push(span);
                mergeParaAttr(para, refShape.text.paras[0]);
                mergeSpanAttr(span, refShape.text.paras[0].spans[0]);
                text.insertText(this.stringValue, 0);

                this.__stringValue_text = text;
            }
        }
        return text;
    }

    getLayout(refShape: Shape): TextLayout | undefined {
        const frame = refShape.frame;

        const text = this.getText(refShape);

        if (!text) return;
        const width = frame.width;
        const height = frame.height;
        text.updateSize(width, height);

        return text.getLayout();
    }

    onRollback(): void {
        if (this.text) this.text.reLayout();
    }
}

// handlers
function proxyMapObj(target: Map<any, any>) {
    return {
        get(key: any) {
            const get = Map.prototype.get.bind(target);
            return get(key);
        },
        set(key: any, value: any) {
            const set_inner = Map.prototype.set.bind(target);
            set_inner(key, value);
        },
        delete(key: any) {
            const get = Map.prototype.get.bind(target);
            const ori = get(key)
            const delete_inner = Map.prototype.delete.bind(target);
            delete_inner(key);
        }
    };
}
class NormalHdl {
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        const ret = Reflect.set(target, propertyKey, value, receiver);
        return ret;
    }
    deleteProperty(target: object, propertyKey: PropertyKey): boolean {
        const result = Reflect.deleteProperty(target, propertyKey);
        return result;
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        if (target instanceof Map) { // map对象上的属性和方法都会进入get
            if (propertyKey === 'get') { // 高频操作，单独提出并置顶，提高响应速度
                return Reflect.get(target, propertyKey, receiver).bind(target);
            } else if (propertyKey === 'set' || propertyKey === 'delete') { // 需要进入事务的方法
                return Reflect.get(proxyMapObj(target), propertyKey);
            } else if (propertyKey === 'size') { // map对象上唯一的一个可访问属性
                return target.size;
            } else if (propertyKey === 'clear') { // todo clear操作为批量删除，也需要进入事务
                return false;
            } else { // 其他操作，get、values、has、keys、forEach、entries，不影响数据
                const val = Reflect.get(target, propertyKey, receiver);
                if (typeof val === 'function') {
                    return val.bind(target);
                }
                return val;
            }
        } else {
            const val = Reflect.get(target, propertyKey, receiver);
            return val;
        }
    }
    has(target: object, propertyKey: PropertyKey): boolean {
        if (target instanceof Map) {
            return target.has(propertyKey);
        }
        const val = Reflect.has(target, propertyKey);
        return val;
    }
}

class TextHdl {
    __symRef: SymbolRefShape;
    __target: Text;
    __parent: TextShape;

    constructor(symRef: SymbolRefShape, target: Text, parent: TextShape) {
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
    }
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        // const ret = Reflect.set(target, propertyKey, value, receiver);
        // return ret;
        throw new Error("forbidden");
    }
    deleteProperty(target: object, propertyKey: PropertyKey): boolean {
        // const result = Reflect.deleteProperty(target, propertyKey);
        // return result;
        throw new Error("forbidden");
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'parent') return this.__parent;

        const val = Reflect.get(target, propertyKey, receiver);
        return val;
    }
    has(target: object, propertyKey: PropertyKey): boolean {
        if (target instanceof Map) {
            return target.has(propertyKey);
        }
        const val = Reflect.has(target, propertyKey);
        return val;
    }
}

class FillHdl {

}

class BorderHdl {

}

class GroupShapeHdl {
    __symRef: SymbolRefShape;
    __target: GroupShape;
    __childs: Shape[] = [];
    __parent: Shape;

    constructor(symRef: SymbolRefShape, target: GroupShape, parent: Shape) {
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
    }
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        // const ret = Reflect.set(target, propertyKey, value, receiver);
        // return ret;
        throw new Error("forbidden");
    }
    deleteProperty(target: object, propertyKey: PropertyKey): boolean {
        // const result = Reflect.deleteProperty(target, propertyKey);
        // return result;
        throw new Error("forbidden");
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'shapeId') return [this.__symRef.id, this.__target.id];
        if (propStr === 'parent') return this.__parent;
        if (propStr === 'childs') return this.__childs;
        if (propStr === 'frame') {
            const frame = this.__target.frame;
            return new ShapeFrame(frame.x, frame.y, frame.width, frame.height);
        }
        const val = Reflect.get(target, propertyKey, receiver);
        return val;
    }
    has(target: object, propertyKey: PropertyKey): boolean {
        if (target instanceof Map) {
            return target.has(propertyKey);
        }
        const val = Reflect.has(target, propertyKey);
        return val;
    }
}

class TextShapeHdl {
    __symRef: SymbolRefShape;
    __target: TextShape;
    __parent: Shape;
    __override: OverrideShape | undefined;
    __text: Text;

    constructor(symRef: SymbolRefShape, target: TextShape, parent: Shape, override: OverrideShape | undefined) {
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
        this.__override = override;
        this.__text = new Proxy<Text>(target.text, new TextHdl(symRef, target.text, target));
    }
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        // const ret = Reflect.set(target, propertyKey, value, receiver);
        // return ret;
        throw new Error("forbidden");
    }
    deleteProperty(target: object, propertyKey: PropertyKey): boolean {
        // const result = Reflect.deleteProperty(target, propertyKey);
        // return result;
        throw new Error("forbidden");
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'shapeId') return [this.__symRef.id, this.__target.id];
        if (propStr === 'parent') return this.__parent;
        if (propStr === 'frame') {
            const frame = this.__target.frame;
            return new ShapeFrame(frame.x, frame.y, frame.width, frame.height);
        }
        if (propStr === 'text') {
            const text = this.__override && this.__override.getText(this.__target)
            if (text) return text;
            return this.__text;
        }
        const val = Reflect.get(target, propertyKey, receiver);
        return val;
    }
    has(target: object, propertyKey: PropertyKey): boolean {
        if (target instanceof Map) {
            return target.has(propertyKey);
        }
        const val = Reflect.has(target, propertyKey);
        return val;
    }
}

class ShapeHdl {
    __symRef: SymbolRefShape;
    __target: Shape;
    __parent: Shape;

    constructor(symRef: SymbolRefShape, target: Shape, parent: Shape) {
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
    }
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        // const ret = Reflect.set(target, propertyKey, value, receiver);
        // return ret;
        throw new Error("forbidden");
    }
    deleteProperty(target: object, propertyKey: PropertyKey): boolean {
        // const result = Reflect.deleteProperty(target, propertyKey);
        // return result;
        throw new Error("forbidden");
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'shapeId') return [this.__symRef.id, this.__target.id];
        if (propStr === 'parent') return this.__parent;
        if (propStr === 'frame') {
            const frame = this.__target.frame;
            return new ShapeFrame(frame.x, frame.y, frame.width, frame.height);
        }
        const val = Reflect.get(target, propertyKey, receiver);
        return val;
    }
    has(target: object, propertyKey: PropertyKey) {
        if (target instanceof Map) {
            return target.has(propertyKey);
        }
        const val = Reflect.has(target, propertyKey);
        return val;
    }
}

export interface OverridesGetter {
    getOverrid(id: string): OverrideShape | undefined;
}

// 适配左侧导航栏
function proxyShape(shape: Shape, parent: Shape, root: SymbolRefShape): Shape {

    if (shape instanceof GroupShape) {
        const hdl = new GroupShapeHdl(root, shape, parent);
        const ret = new Proxy<GroupShape>(shape, hdl);
        hdl.__childs = shape.childs.map((child) => proxyShape(child, ret, root));
        return ret;
    }

    if (shape instanceof TextShape) {
        const override = root.getOverrid(shape.id);
        const ret = new Proxy<TextShape>(shape, new TextShapeHdl(root, shape, parent, override))
        return ret;
    }

    const ret = new Proxy<Shape>(shape, new ShapeHdl(root, shape, parent))
    return ret;
}

export class SymbolRefShape extends Shape implements classes.SymbolRefShape, OverridesGetter {
    __data: SymbolShape | undefined
    __symMgr?: ResourceMgr<SymbolShape>

    typeId = 'symbol-ref-shape'
    refId: string
    overrides: BasicArray<OverrideShape>
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        refId: string,
        overrides: BasicArray<OverrideShape>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
        this.refId = refId
        this.overrides = overrides
    }

    get naviChilds(): Shape[] | undefined {
        return this.__data?.childs.map((v) => proxyShape(v, this, this));
    }

    get childs() {// 作为引用的symbol的parent，需要提供个childs
        return [];
        // return this.overrides;
    }

    setSymbolMgr(mgr: ResourceMgr<SymbolShape>) {
        this.__symMgr = mgr;
    }
    peekSymbol(): SymbolShape | undefined {
        return this.__data;
    }
    async loadSymbol() {
        if (this.__data) return this.__data;
        this.__data = this.__symMgr && await this.__symMgr.get(this.refId);
        if (this.__data) this.notify();
        return this.__data;
    }

    // overrideValues
    addOverrid(id: string, attr: OverrideType, value: any) {

        let override = this.getOverrid(id);
        if (!override) {
            override = new OverrideShape(uuid(), "",
                ShapeType.OverrideShape,
                new ShapeFrame(0, 0, 0, 0),
                new Style(new BasicArray(), new BasicArray()),
                id);
            this.overrides.push(override);
        }

        switch (attr) {
            case OverrideType.Text:
                override.text = value;
                override.override_text = true;
                break;
            case OverrideType.StringValue:
                override.stringValue = value;
                override.override_stringValue = true;
                break;
            case OverrideType.Image:
                override.imageRef = value;
                override.override_image = true;
        }
    }
    getOverrid(id: string): OverrideShape | undefined {
        for (let i = 0, len = this.overrides.length; i < len; ++i) {
            if (this.overrides[i].refId === id) return this.overrides[i];
        }
    }
}