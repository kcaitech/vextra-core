import { BulletNumbers, Color, StrikethroughType, TextBehaviour, TextHorAlign, TextOrientation, TextTransformType, TextVerAlign, UnderlineType } from "./baseclasses";
import { Basic, BasicArray } from "./basic";

export {
    TextVerAlign,
    TextHorAlign,
    TextBehaviour,
    TextOrientation,
    StrikethroughType,
    UnderlineType,
    BulletNumbers,
    BulletNumbersType,
    BulletNumbersBehavior,
    TextTransformType
} from "./baseclasses";
import * as classes from "./baseclasses"
import { deleteText, formatText, insertComplexText, insertSimpleText } from "./textedit";
import { MeasureFun, TextLayout, layoutText } from "./textlayout";
import { layoutAtDelete, layoutAtFormat, layoutAtInsert } from "./textincrementlayout";
import { getSimpleText, getUsedFontNames, getTextFormat, getTextWithFmt } from "./textread";
import { CursorLocate, locateCursor, locateRange, locateText } from "./textlocate";
import { _travelTextPara } from "./texttravel";
/*
 文本框属性
    文本框大小行为
    文本方向*
    垂直对齐
    段落属性
        水平对齐
        行高
        字距
        段间距*
        编号*
        字属性
            字号
            颜色
            字体
            加粗
            倾斜
            高亮色
            删除线
            下划线
 */

export class SpanAttr extends Basic implements classes.SpanAttr {
    typeId = 'span-attr'
    fontName?: string
    fontSize?: number
    color?: Color
    strikethrough?: StrikethroughType
    underline?: UnderlineType
    bold?: boolean
    italic?: boolean
    bulletNumbers?: BulletNumbers
    highlight?: Color
    kerning?: number
    transform?: TextTransformType
    placeholder?: boolean
    constructor(
    ) {
        super()
    }
    clone(newSpanAttr?: SpanAttr): SpanAttr {
        if (!newSpanAttr) newSpanAttr = new SpanAttr();
        newSpanAttr.fontName = this.fontName;
        newSpanAttr.fontSize = this.fontSize;
        if (this.color) newSpanAttr.color = new Color(this.color.alpha, this.color.red, this.color.green, this.color.blue);
        return newSpanAttr;
    }
}

export class ParaAttr extends SpanAttr implements classes.ParaAttr {
    typeId = 'para-attr'
    alignment?: TextHorAlign
    paraSpacing?: number
    minimumLineHeight?: number
    maximumLineHeight?: number
    indent?: number
    constructor(
    ) {
        super(
        )
    }
}

export class TextAttr extends ParaAttr implements classes.TextAttr {
    typeId = 'text-attr'
    verAlign?: TextVerAlign
    orientation?: TextOrientation
    textBehaviour?: TextBehaviour
    constructor(
    ) {
        super(
        )
    }
}

export class AttrGetter extends TextAttr {
    fontNameIsMulti: boolean = false;
    fontSizeIsMulti: boolean = false;
    colorIsMulti: boolean = false;
    highlightIsMulti: boolean = false;
    boldIsMulti: boolean = false;
    italicIsMulti: boolean = false;
    underlineIsMulti: boolean = false;
    strikethroughIsMulti: boolean = false;

    alignmentIsMulti: boolean = false;
    paraSpacingIsMulti: boolean = false;
    kerningIsMulti: boolean = false;
    minimumLineHeightIsMulti: boolean = false;
    maximumLineHeightIsMulti: boolean = false;
    transformIsMulti: boolean = false;
    bulletNumbersIsMulti: boolean = false;
}

export class SpanAttrSetter extends SpanAttr {
    fontNameIsSet: boolean = false;
    fontSizeIsSet: boolean = false;
    colorIsSet: boolean = false;
    highlightIsSet: boolean = false;
    boldIsSet: boolean = false;
    italicIsSet: boolean = false;
    underlineIsSet: boolean = false;
    strikethroughIsSet: boolean = false;
    kerningIsSet: boolean = false;
    transformIsSet: boolean = false;
}

export class ParaAttrSetter extends ParaAttr {
    fontNameIsSet: boolean = false;
    fontSizeIsSet: boolean = false;
    colorIsSet: boolean = false;
    highlightIsSet: boolean = false;
    boldIsSet: boolean = false;
    italicIsSet: boolean = false;
    underlineIsSet: boolean = false;
    strikethroughIsSet: boolean = false;
    kerningIsSet: boolean = false;
    transformIsSet: boolean = false;

    alignmentIsSet: boolean = false;
    paraSpacingIsSet: boolean = false;
    minimumLineHeightIsSet: boolean = false;
    maximumLineHeightIsSet: boolean = false;
}

export class Span extends SpanAttr implements classes.Span {
    typeId = 'span'
    length: number
    constructor(
        length: number
    ) {
        super(
        )
        this.length = length
    }
    clone(): Span {
        const span = new Span(this.length);
        super.clone(span);
        return span;
    }
}

export class Para extends Basic implements classes.Para {
    typeId = 'para'
    text: string
    spans: BasicArray<Span>
    attr?: ParaAttr
    constructor(
        text: string,
        spans: BasicArray<Span>
    ) {
        super()
        this.text = text
        this.spans = spans
    }
    get length() {
        return this.text.length;
    }
    charAt(index: number): string {
        return this.text.charAt(index);
    }
}

export class Text extends Basic implements classes.Text {
    typeId = 'text'
    paras: BasicArray<Para>
    attr?: TextAttr
    private __layout?: TextLayout;
    private __layoutWidth: number = 0;
    private __frameWidth: number = 0;
    private __frameHeight: number = 0;
    private __measure: MeasureFun = (code: number, font: string) => undefined;

    constructor(
        paras: BasicArray<Para>
    ) {
        super()
        this.paras = paras
    }
    charAt(index: number): string {
        for (let i = 0, len = this.paras.length; i < len; i++) {
            const para = this.paras[i];
            if (index < para.length) {
                return para.charAt(index);
            }
            else {
                index -= para.length;
            }
        }
        return '';
    }
    revertCharAt(index: number): string {
        for (let i = this.paras.length - 1; i >= 0; i--) {
            const para = this.paras[i];
            if (index < para.length) {
                return para.charAt(para.length - index - 1);
            }
            else {
                index -= para.length;
            }
        }
        return '';
    }
    paraAt(index: number): { para: Para, index: number, paraIndex: number } | undefined {
        for (let i = 0, len = this.paras.length; i < len; i++) {
            const p = this.paras[i];
            if (index < p.length) {
                return { para: p, index, paraIndex: i }
            }
            else {
                index -= p.length;
            }
        }
    }
    /**
     * 对齐段落
     * @param index 
     * @param len 
     */
    alignParaRange(index: number, len: number): { index: number, len: number } {
        const ret = { index, len };
        for (let i = 0, len = this.paras.length; i < len; i++) {
            const p = this.paras[i];
            if (index < p.length) {
                ret.index -= index;
                ret.len += index;
                len += index;

                for (let j = i; j < len; j++) {
                    const p = this.paras[j];
                    if (len <= p.length) {
                        ret.len += p.length - len;
                        break;
                    }
                    len -= p.length;
                }
                break;
            }
            else {
                index -= p.length;
            }
        }
        return ret;
    }
    get length() {
        return this.paras.reduce((count, p) => {
            return count + p.length;
        }, 0);
    }
    getText(index: number, count: number): string {
        return getSimpleText(this, index, count);
    }
    getTextWithFormat(index: number, count: number): Text {
        return getTextWithFmt(this, index, count);
    }
    getDefaultTextFormat(): TextAttr | undefined {
        return this.attr;
    }
    getTextFormat(index: number, count: number): AttrGetter {
        return getTextFormat(this, index, count);
    }
    getUsedFontNames(fontNames?: Set<string>): Set<string> {
        return getUsedFontNames(this, fontNames);
    }

    insertText(text: string, index: number, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
        // this.reLayout(); // todo
        insertSimpleText(this, text, index, props);
        if (this.__layout) this.__layout = layoutAtInsert(this, this.__layoutWidth, this.__frameHeight, this.__measure, index, text.length, this.__layout);
    }
    composingInputUpdate(index: number) {
        if (this.__layout) this.__layout = layoutAtDelete(this, this.__layoutWidth, this.__frameHeight, this.__measure, index, 1, this.__layout);
    }
    insertFormatText(text: Text, index: number) {
        // this.reLayout(); // todo
        insertComplexText(this, text, index);
        if (this.__layout) this.__layout = layoutAtInsert(this, this.__layoutWidth, this.__frameHeight, this.__measure, index, text.length, this.__layout);
    }
    formatText(index: number, length: number, props: { attr?: SpanAttrSetter, paraAttr?: ParaAttrSetter }): { spans: Span[], paras: (ParaAttr & { length: number })[] } {
        // this.reLayout(); // todo
        const ret = formatText(this, index, length, props)
        if (this.__layout) this.__layout = layoutAtFormat(this, this.__layoutWidth, this.__frameHeight, this.__measure, index, length, this.__layout, props);
        return ret;
    }
    deleteText(index: number, count: number): Text | undefined {
        // this.reLayout(); // todo
        const ret = deleteText(this, index, count);
        if (this.__layout) this.__layout = layoutAtDelete(this, this.__layoutWidth, this.__frameHeight, this.__measure, index, count, this.__layout);
        return ret;
    }

    setMeasureFun(measure: MeasureFun) {
        if (this.__measure !== measure) {
            this.__measure = measure;
            this.reLayout();
        }
    }

    updateSize(w: number, h: number) {
        const layoutWidth = ((b: TextBehaviour) => {
            switch (b) {
                case TextBehaviour.Flexible: return Number.MAX_VALUE;
                case TextBehaviour.Fixed: return w;
                case TextBehaviour.FixWidthAndHeight: return w;
            }
            // return Number.MAX_VALUE
        })(this.attr?.textBehaviour ?? TextBehaviour.Flexible)
        if (this.__layoutWidth !== layoutWidth) {
            this.__frameHeight = h;
            this.__layoutWidth = layoutWidth;
            this.reLayout();
        }
        else if (this.__frameHeight !== h && this.__layout) {
            const vAlign = this.attr?.verAlign ?? TextVerAlign.Top;
            const yOffset: number = ((align: TextVerAlign) => {
                switch (align) {
                    case TextVerAlign.Top: return 0;
                    case TextVerAlign.Middle: return (h - this.__layout.contentHeight) / 2;
                    case TextVerAlign.Bottom: return h - this.__layout.contentHeight;
                }
            })(vAlign);
            this.__layout.yOffset = yOffset;
        }
        this.__frameWidth = w;
        this.__frameHeight = h;
    }

    private reLayout() {
        this.__layout = undefined;
    }

    getLayout() {
        if (this.__layout) return this.__layout;
        this.__layout = layoutText(this, this.__layoutWidth, this.__frameHeight, this.__measure);
        return this.__layout;
    }
    locateText(x: number, y: number): { index: number, before: boolean } {
        return locateText(this.getLayout(), x, y);
    }
    locateCursor(index: number, cursorAtBefore: boolean): CursorLocate | undefined {
        return locateCursor(this.getLayout(), index, cursorAtBefore);
    }
    locateRange(start: number, end: number): { x: number, y: number }[] {
        return locateRange(this.getLayout(), start, end);
    }

    getContentWidth(): number {
        return this.getLayout().contentWidth;
    }
    getContentHeight(): number {
        return this.getLayout().contentHeight;
    }

    setTextBehaviour(textBehaviour: TextBehaviour) {
        if (!this.attr) this.attr = new TextAttr();
        this.attr.textBehaviour = textBehaviour;
        // 宽度变化时要重排
        const layoutWidth = ((b: TextBehaviour) => {
            switch (b) {
                case TextBehaviour.Flexible: return Number.MAX_VALUE;
                case TextBehaviour.Fixed: return this.__frameWidth;
                case TextBehaviour.FixWidthAndHeight: return this.__frameWidth;
            }
            // return Number.MAX_VALUE
        })(this.attr?.textBehaviour ?? TextBehaviour.Flexible)
        if (this.__layoutWidth !== layoutWidth) {
            this.__layoutWidth = layoutWidth;
            this.reLayout();
        }
    }
    setTextVerAlign(verAlign: TextVerAlign) {
        if (!this.attr) this.attr = new TextAttr();
        this.attr.verAlign = verAlign;
        if (this.__layout) {
            const vAlign = this.attr?.verAlign ?? TextVerAlign.Top;
            const yOffset: number = ((align: TextVerAlign) => {
                switch (align) {
                    case TextVerAlign.Top: return 0;
                    case TextVerAlign.Middle: return (this.__frameHeight - this.__layout.contentHeight) / 2;
                    case TextVerAlign.Bottom: return this.__frameHeight - this.__layout.contentHeight;
                }
            })(vAlign);
            this.__layout.yOffset = yOffset;
        }
    }

    setDefaultTextColor(color: Color | undefined) {
        // 不需要重排
        if (!this.attr) this.attr = new TextAttr();
        this.attr.color = color;
    }
    setDefaultFontName(fontName: string | undefined) {
        if (!this.attr) this.attr = new TextAttr();
        this.attr.fontName = fontName;
        this.reLayout();
    }
    setDefaultFontSize(fontSize: number) {
        if (!this.attr) this.attr = new TextAttr();
        this.attr.fontSize = fontSize;
        this.reLayout();
    }
    setDefaultTextHorAlign(horAlign: TextHorAlign) {
        if (!this.attr) {
            if (horAlign === TextHorAlign.Left) return;
            this.attr = new TextAttr();
            this.attr.alignment = horAlign;
            this.reLayout();
        }
        else if (this.attr.alignment !== horAlign) {
            this.attr.alignment = horAlign;
            this.reLayout();
        }
    }
    setDefaultMinLineHeight(minLineHeight: number) {
        if (!this.attr) this.attr = new TextAttr();
        this.attr.minimumLineHeight = minLineHeight;
        this.reLayout(); // todo
    }
    setDefaultMaxLineHeight(maxLineHeight: number) {
        if (!this.attr) this.attr = new TextAttr();
        this.attr.maximumLineHeight = maxLineHeight;
        this.reLayout(); // todo
    }
    setDefaultTransform(transform: TextTransformType | undefined) {
        if (!this.attr) this.attr = new TextAttr();
        this.attr.transform = transform;
        this.reLayout(); // todo
    }
}
