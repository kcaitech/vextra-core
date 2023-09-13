import { ResourceMgr } from "./basic";
import { Style } from "./style";
import { Para, ParaAttr, Span, Text } from "./text";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType, Variable, VariableType
} from "./baseclasses"
import { ShapeType, ShapeFrame, OverrideType } from "./baseclasses"
import { Path } from "./path";
import { TextLayout } from "./textlayout";
import { mergeParaAttr, mergeSpanAttr } from "./textutils";
import { Shape, TextShape } from "./shape";

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

export interface OverridesGetter {
    // 当前symbolref的overrid，当前可修改的
    getOverrid(shapeId: string): OverrideShape | undefined;
    // 当前实际起作用的override
    watch(watcher: ((...args: any[]) => void)): (() => void);
    unwatch(watcher: ((...args: any[]) => void)): boolean;
}
