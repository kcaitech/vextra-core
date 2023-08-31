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
import { Shape, SymbolShape, TextShape } from "./shape";

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

    getLayout(refShape: Shape): TextLayout | undefined {
        const frame = refShape.frame;

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

export interface OverridesGetter {
    getOverrid(id: string): OverrideShape | undefined;
}


export class SymbolRefShape extends Shape implements classes.SymbolRefShape, OverridesGetter {
    __data: SymbolShape | undefined
    __symMgr?: ResourceMgr<SymbolShape>

    typeId = 'symbol-ref-shape'
    refId: string
    childs: BasicArray<OverrideShape>
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        refId: string,
        childs: BasicArray<OverrideShape>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
        this.refId = refId
        this.childs = childs
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
            this.childs.push(override);
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
        for (let i = 0, len = this.childs.length; i < len; ++i) {
            if (this.childs[i].refId === id) return this.childs[i];
        }
    }
}