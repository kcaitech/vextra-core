import { Color, ParaAttr, TextAttr } from "./baseclasses";
import { Basic, BasicArray } from "./basic";

export { TextVerAlign, TextHorAlign, TextBehaviour, TextOrientation, ParaAttr, TextAttr } from "./baseclasses";
import * as classes from "./baseclasses"
import { deleteText, formatText, getText, getTextText, insertComplexText, insertSimpleText } from "./textfun";

export class SpanAttr extends Basic implements classes.SpanAttr {
    typeId = 'span-attr'
    fontName?: string
    fontSize?: number
    color?: Color
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

export class SpanAttrSetter extends SpanAttr {
    fontNameIsSet: boolean = false;
    fontSizeIsSet: boolean = false;
    colorIsSet: boolean = false;
}

export class ParaAttrSetter extends ParaAttr {
    fontNameIsSet: boolean = false;
    fontSizeIsSet: boolean = false;
    colorIsSet: boolean = false;

    alignmentIsSet: boolean = false;
    paraSpacingIsSet: boolean = false;
    kerningIsSet: boolean = false;
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
    get length() {
        return this.paras.reduce((count, p) => {
            return count + p.length;
        }, 0);
    }
    getText(index: number, count: number): string {
        return getText(this, index, count);
    }
    getTextWithFormat(index: number, count: number): Text {
        return getTextText(this, index, count);
    }
    insertText(text: string, index: number, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
        insertSimpleText(this, text, index, props);
    }
    insertFormatText(text: Text, index: number) {
        insertComplexText(this, text, index);
    }
    formatText(index: number, length: number, props: { attr?: SpanAttrSetter, paraAttr?: ParaAttrSetter }): { spans: Span[], paras: (ParaAttr & { length: number })[] } {
        return formatText(this, index, length, props)
    }
    deleteText(index: number, count: number): Text | undefined {
        return deleteText(this, index, count);
    }
}
