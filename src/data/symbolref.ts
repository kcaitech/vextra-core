import { ResourceMgr } from "./basic";
import { Border, Fill, Style } from "./style";
import { Para, ParaAttr, Span, Text } from "./text";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export { CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint, ShapeFrame, Ellipse, PathSegment, OverrideType } from "./baseclasses"
import { ShapeType, ShapeFrame, OverrideType } from "./baseclasses"
import { Path } from "./path";
import { TextLayout } from "./textlayout";
import { uuid } from "../basic/uuid";
import { mergeParaAttr, mergeSpanAttr } from "./textutils";
import { GroupShape, Shape, TextShape } from "./shape";
import { importBorder, importFill, importText } from "./baseimport";

export interface OverridesGetter {
    getOverrid(shapeId: string): OverrideShape | undefined;
    watch(watcher: ((...args: any[]) => void)): (() => void);
    unwatch(watcher: ((...args: any[]) => void)): boolean;
}

export class OverrideShape extends Shape implements classes.OverrideShape {
    typeId = 'override-shape'
    refId: string

    override_text?: boolean
    override_image?: boolean
    override_fills?: boolean
    override_borders?: boolean
    override_visible?: boolean

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

    getTarget(targetId: (string | { rowIdx: number; colIdx: number; })[]): Shape {
        if (targetId[0] === 'text') { // hack!
            // inittext
            if (!this.text) {
                const text = new Text(new BasicArray());
                text.setTextBehaviour(classes.TextBehaviour.Fixed); // 固定宽高
                const para = new Para('\n', new BasicArray());
                para.attr = new ParaAttr();
                text.paras.push(para);
                const span = new Span(para.length);
                para.spans.push(span);
                this.text = text;
            }
        }
        return this;
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
    private __startLoad: boolean = false;
    peekImage(startLoad: boolean = false) {
        const ret = this.__cacheData?.base64;
        if (ret) return ret;
        if (!this.imageRef) return "";
        if (startLoad && !this.__startLoad) {
            this.__startLoad = true;
            this.__imageMgr && this.__imageMgr.get(this.imageRef).then((val) => {
                if (!this.__cacheData) {
                    this.__cacheData = val;
                    if (val) this.notify();
                }
            })
        }
        return ret;
    }
    // image shape
    async loadImage(): Promise<string> {
        if (!this.imageRef) return "";
        if (this.__cacheData) return this.__cacheData.base64;
        this.__cacheData = this.__imageMgr && await this.__imageMgr.get(this.imageRef)
        if (this.__cacheData) this.notify();
        return this.__cacheData && this.__cacheData.base64 || "";
    }

    // // text
    // setFrameSize(w: number, h: number) {
    //     super.setFrameSize(w, h);
    //     if (this.text) this.text.updateSize(this.frame.width, this.frame.height)
    // }

    peekText(): Text | undefined {
        return this.text ?? this.__stringValue_text;
    }

    getText(refShape: Shape): Text | undefined {
        if (this.text) return this.text;

        if (this.stringValue && !this.__stringValue_text) {

            // if (text) throw new Error("Duplicate set text and stringValue")
            if (!(refShape instanceof TextShape)) throw new Error("refshape is not textshape")

            const text = new Text(new BasicArray());
            text.setTextBehaviour(classes.TextBehaviour.Fixed); // 固定宽高
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
        return this.__stringValue_text;
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

    setVisible(isVisible: boolean | undefined) {
        this.isVisible = isVisible;
        this.override_visible = true;
    }
}

export class ForbiddenError extends Error {}

class FreezHdl {
    __target: Object;
    constructor(target: Object) {
        this.__target = target;
    }
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        throw new ForbiddenError("forbidden");
    }
    deleteProperty(target: object, propertyKey: PropertyKey): boolean {
        throw new ForbiddenError("forbidden");
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any): any {
        const val = Reflect.get(target, propertyKey, receiver);
        if (typeof val === 'object' && !propertyKey.toString().startsWith('__')) {
            if (!target.hasOwnProperty(propertyKey)) return val;
            return new Proxy<Object>(val, new FreezHdl(val));
        }
        return val;
    }
    has(target: object, propertyKey: PropertyKey): boolean {
        if (target instanceof Map) {
            return target.has(propertyKey);
        }
        return Reflect.has(target, propertyKey);
    }
}

class StyleHdl extends FreezHdl {
    __symRef: SymbolRefShape;
    __shape: Shape;
    __override?: OverrideShape;
    constructor(symRef: SymbolRefShape, shape: Shape, target: Style) {
        super(target)
        this.__symRef = symRef;
        this.__shape = shape;
        this.__override = symRef.getOverrid(shape.id);
    }
    private get _style(): Style {
        return this.__target as Style;
    }

    overrideFills(curFills: Fill[]): Fill[] { // 需要生成command
        const imgMgr = this.__symRef.getImageMgr();
        const fills = new BasicArray<Fill>();
        curFills.forEach((v) => {
            const fill = importFill(v);
            if (imgMgr) fill.setImageMgr(imgMgr);
            fills.push(fill);
        })
        this.__override = this.__symRef.addOverrid(this.__shape.id, OverrideType.Fills, fills);
        return this.__override.style.fills;
    }

    overrideBorders(curBorders: Border[]): Border[] { // 需要生成command
        const borders = new BasicArray<Border>();
        curBorders.forEach((v) => {
            const border = importBorder(v);
            borders.push(border);
        })
        this.__override = this.__symRef.addOverrid(this.__shape.id, OverrideType.Borders, borders);
        return this.__override.style.borders;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();

        if (propStr === 'overrideFills') {
            if (!this.__override) {
                this.__override = this.__symRef.getOverrid(this.__shape.id);
            }
            if (this.__override && this.__override.override_fills) return;
            return this.overrideFills((this.__target as Style).fills);
        }

        if (propStr === 'overrideBorders') {
            if (!this.__override) {
                this.__override = this.__symRef.getOverrid(this.__shape.id);
            }
            if (this.__override && this.__override.override_borders) return;
            return this.overrideBorders((this.__target as Style).borders);
        }

        if (propStr === 'fills') {
            if (this.__override && this.__override.override_fills) return this.__override.style.fills;
            return this._style.fills.map((v) => new Proxy(v, new FreezHdl(v)));
        }
        if (propStr === 'borders') {
            if (this.__override && this.__override.override_borders) return this.__override.style.borders;
            return this._style.borders.map((v) => new Proxy(v, new FreezHdl(v)));
        }
        return super.get(target, propertyKey, receiver);
    }
}

class ShapeHdl extends FreezHdl {
    __symRef: SymbolRefShape;
    __target: Shape;
    __parent: Shape;
    __tmpframe?: ShapeFrame;

    constructor(symRef: SymbolRefShape, target: Shape, parent: Shape) {
        super(target);
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
    }

    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        const propStr = propertyKey.toString();
        if (propStr === "isVisible") {
            let override = this.__symRef.getOverrid(this.__target.id);
            if (!override) {
                this.__symRef.addOverrid(this.__target.id, OverrideType.Visible, value);
            }
            else {
                override.override_visible = true;
                override.isVisible = value;
            }
            return true;
        }
        throw new ForbiddenError("forbidden");
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'shapeId') return [this.__symRef.id, this.__target.id];
        if (propStr === 'parent') return this.__parent;
        if (propStr === 'frame') {
            const frame = this.__target.frame;
            if (!this.__tmpframe) this.__tmpframe = new ShapeFrame(0, 0, 0, 0);
            this.__tmpframe.x = frame.x;
            this.__tmpframe.y = frame.y;
            this.__tmpframe.width = frame.width;
            this.__tmpframe.height = frame.height;
            return this.__tmpframe;
        }
        if (propStr === 'style') {
            return new Proxy(this.__target.style, new StyleHdl(this.__symRef, this.__target, this.__target.style));
        }
        if (propStr === 'overridesGetter') {
            return this.__symRef;
        }
        if (propStr === "isVisible") {
            const override = this.__symRef.getOverrid(this.__target.id);
            if (override && override.override_visible) return override.isVisible;
            return this.__target.isVisible;
        }
        return super.get(target, propertyKey, receiver);
    }
}

class GroupShapeHdl extends ShapeHdl {
    __this?: GroupShape;

    constructor(symRef: SymbolRefShape, target: GroupShape, parent: Shape) {
        super(symRef, target, parent);
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'childs') return (this.__target as GroupShape).childs.map((child) => proxyShape(child, this.__this!, this.__symRef));
        return super.get(target, propertyKey, receiver);
    }
}

class TextShapeHdl extends ShapeHdl {

    __override: OverrideShape | undefined;
    __text: Text;
    __stringValueText?: Text;

    constructor(symRef: SymbolRefShape, target: TextShape, parent: Shape, override: OverrideShape | undefined) {
        super(symRef, target, parent);
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
        this.__override = override;
        this.__text = new Proxy<Text>(target.text, new FreezHdl(target.text));
    }

    overrideText(curText: Text): Text { // 需要生成command
        const text = importText(curText); // clone
        this.__override = this.__symRef.addOverrid(this.__target.id, OverrideType.Text, text);
        return this.__override.text!;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();

        if (propStr === 'text') {
            if (this.__override && this.__override.text) return this.__override.text;

            const text = this.__override?.getText(this.__target);
            if (text) {
                if (!this.__stringValueText) {
                    this.__stringValueText = new Proxy<Text>(text, new FreezHdl(text));
                }
                return this.__stringValueText;
            }

            return this.__text;
        }

        if (propStr === 'overrideText') {
            if (this.__override && this.__override.text) return;
            let curText = (this.__target as TextShape).text;
            if (this.__override) {
                const text = this.__override.getText(this.__target);
                curText = text ?? (this.__target as TextShape).text;
            }
            return this.overrideText(curText);
        }

        return super.get(target, propertyKey, receiver);
    }
}

// 适配左侧导航栏
function proxyShape(shape: Shape, parent: Shape, root: SymbolRefShape): Shape {

    if (shape instanceof GroupShape) {
        const hdl = new GroupShapeHdl(root, shape, parent);
        const ret = new Proxy<GroupShape>(shape, hdl);
        // hdl.__childs = shape.childs.map((child) => proxyShape(child, ret, root));
        hdl.__this = ret;
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
    __data: GroupShape | undefined
    __symMgr?: ResourceMgr<GroupShape>

    typeId = 'symbol-ref-shape'
    refId: string
    overrides: BasicArray<OverrideShape>

    __overridesMap?: Map<string, OverrideShape>;
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

    getTarget(targetId: (string | { rowIdx: number, colIdx: number })[]): Shape {
        if (targetId.length > 0) {
            const shapeId = targetId[0] as string;
            let shape = this.getOverrid(shapeId);
            if (!shape) {
                // throw new Error("shape not find");
                shape = this.createOverrid(shapeId);
            }
            return shape.getTarget(targetId.slice(1));
        }
        return this;
    }

    private get overrideMap() {
        if (!this.__overridesMap) {
            const map = new Map();
            this.overrides.forEach((o) => {
                map.set(o.refId, o);
            })
            this.__overridesMap = map;
        }
        return this.__overridesMap;
    }

    // symbolref需要watch symbol的修改？
    get naviChilds(): Shape[] | undefined {
        return this.__data?.childs.map((v) => proxyShape(v, this, this));
    }

    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }
    getImageMgr() {
        return this.__imageMgr;
    }

    // get childs() {// 作为引用的symbol的parent，需要提供个childs
    //     return [];
    //     // return this.overrides;
    // }

    setSymbolMgr(mgr: ResourceMgr<GroupShape>) {
        this.__symMgr = mgr;
    }
    peekSymbol(): GroupShape | undefined {
        return this.__data;
    }
    async loadSymbol() {
        if (this.__data) return this.__data;
        this.__data = this.__symMgr && await this.__symMgr.get(this.refId);
        if (this.__data) this.notify();
        return this.__data;
    }

    private createOverrid(refId: string) {
        let override = new OverrideShape(uuid(), "",
            ShapeType.OverrideShape,
            new ShapeFrame(0, 0, 0, 0),
            new Style(new BasicArray(), new BasicArray()),
            refId);
        this.overrides.push(override);
        override = this.overrides[this.overrides.length - 1];

        if (this.__overridesMap) {
            this.__overridesMap.set(refId, override);
        }

        return override;
    }

    // overrideValues
    addOverrid(id: string, attr: OverrideType, value: any) {
        let override = this.getOverrid(id);
        if (!override) {
            override = this.createOverrid(id);
        }

        switch (attr) {
            case OverrideType.Text:
                override.text = value;
                override.__stringValue_text = undefined;
                override.stringValue = undefined;
                override.override_text = true;
                break;
            case OverrideType.StringValue:
                override.stringValue = value;
                override.override_text = true;
                break;
            case OverrideType.Image:
                override.imageRef = value;
                override.override_image = true;
                break;
            case OverrideType.Borders:
                override.style.borders = value;
                override.override_borders = true;
                break;
            case OverrideType.Fills:
                override.style.fills = value;
                override.override_fills = true;
                break;
        }
        return override;
    }
    getOverrid(id: string): OverrideShape | undefined {
        // for (let i = 0, len = this.overrides.length; i < len; ++i) {
        //     if (this.overrides[i].refId === id) return this.overrides[i];
        // }
        return this.overrideMap.get(id);
    }
}