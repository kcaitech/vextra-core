import {
    BulletNumbers,
    BulletNumbersBehavior,
    BulletNumbersType,
    StrikethroughType,
    TextBehaviour,
    TextHorAlign,
    TextOrientation,
    TextTransformType,
    TextVerAlign,
    UnderlineType
} from "./classes";

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
    TextTransformType,
    Padding
} from "./baseclasses";
import * as classes from "./baseclasses"
import { deleteText, formatPara, formatText, insertComplexText, insertSimpleText, setBulletNumbersBehavior, setBulletNumbersStart, setBulletNumbersType, setParaIndent } from "./textedit";
import { LayoutItem, TextLayout, layoutText } from "./textlayout";
import { layoutAtDelete, layoutAtFormat, layoutAtInsert } from "./textinclayout";
import { getSimpleText, getUsedFontNames, getTextFormat, getTextWithFmt } from "./textread";
import { _travelTextPara } from "./texttravel";
import { FillType, Padding } from "./baseclasses";
import { Gradient } from "./style"
import { Color } from "./color";
import { ShapeFrame } from "./typesdefine";

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
    bold?: number
    italic?: boolean
    bulletNumbers?: BulletNumbers
    highlight?: Color
    kerning?: number
    transform?: TextTransformType
    placeholder?: boolean
    fillType?: FillType
    gradient?: Gradient
    constructor(
    ) {
        super()
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
    padding?: Padding
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
    fillTypeIsMulti: boolean = false;
    gradientIsMulti: boolean = false;
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

    static DefaultFontSize = 12;

    typeId = 'text'
    paras: BasicArray<Para>
    attr?: TextAttr

    // layout与显示窗口大小有关
    // 尽量复用, layout缓存排版信息，进行update
    private __layouts: Map<string, LayoutItem> = new Map();

    dropLayout(token: string, owner: string) {
        let o = this.__layouts.get(token);
        if (o) {
            const i = o.owners.indexOf(owner);
            if (i >= 0) {
                o.owners.splice(i, 1);
                if (o.owners.length === 0) this.__layouts.delete(token!);
            }
        }
    }

    getLayout3(frame: ShapeFrame, owner: string, token: string | undefined): { token: string, layout: TextLayout } {

        const width = frame.width;
        const height = frame.height;

        const cur = [width, height].join(',');
        if (cur !== token) {
            let o = token && this.__layouts.get(token);
            if (o) {
                if (o.owners.length === 1 && o.owners[0] === owner) {
                    o.update(frame, this.attr);
                    if (!o.layout) o.layout = layoutText(this, frame);
                    this.__layouts.delete(token!);
                    this.__layouts.set(cur, o);
                    return { token: cur, layout: o.layout! }
                }
                const i = o.owners.indexOf(owner);
                if (i >= 0) {
                    o.owners.splice(i, 1);
                    if (o.owners.length === 0) this.__layouts.delete(token!);
                }
            }
        }

        let o = this.__layouts.get(cur);
        if (o) {
            if (o.owners.indexOf(owner) < 0) o.owners.push(owner);
        } else {
            o = new LayoutItem();
            o.owners.push(owner);
            this.__layouts.set(cur, o)
        }

        o.update(frame, this.attr);
        if (!o.layout) o.layout = layoutText(this, frame);

        return { token: cur, layout: o.layout! }
    }

    getLayout2(frame: ShapeFrame): TextLayout {

        const width = frame.width;
        const height = frame.height;

        const cur = [width, height].join(',');

        let o = this.__layouts.get(cur);
        if (o) {
            return o.layout!;
        }

        return layoutText(this, frame);
    }

    /**
     * for command
     */
    getOpTarget(path: string[]): any {
        if (path.length === 0) return this;
        // 只有attr走idset
        if (path[0] !== 'attr') return;
        if (!this.attr) this.attr = new TextAttr();
        return this.attr.getOpTarget(path.splice(1));
    }

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
    spanAt(index: number): Span | undefined {
        const paraInfo = this.paraAt(index);
        if (!paraInfo) return;
        const para = paraInfo.para;
        index = paraInfo.index;
        const spans = para.spans;
        for (let i = 0, len = spans.length; i < len; i++) {
            const span = spans[i];
            if (index < span.length) {
                return span;
            }
            else {
                index -= span.length;
            }
        }
    }
    /**
     * 对齐段落
     * @param index 
     * @param len 
     */
    alignParaRange(index: number, len: number): { index: number, len: number } {
        if (index < 0) {
            throw new Error("index < 0");
        }
        const ret = { index, len };
        for (let i = 0, plen = this.paras.length; i < plen; i++) {
            const p = this.paras[i];
            if (index < p.length) {
                ret.index -= index;
                ret.len += index;
                len += index;

                for (let j = i; j < plen; j++) {
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
        if (index < 0) {
            throw new Error("index < 0");
        }
        return getSimpleText(this, index, count);
    }
    toString() {
        const str = getSimpleText(this, 0, Number.MAX_VALUE);
        return str.substring(0, str.length - 1); // 去掉最后回车符
    }
    getTextWithFormat(index: number, count: number): Text {
        if (index < 0) {
            throw new Error("index < 0");
        }
        return getTextWithFmt(this, index, count);
    }
    getDefaultTextFormat(): TextAttr | undefined {
        return this.attr;
    }
    getTextFormat(index: number, count: number, cachedAttr?: SpanAttr): AttrGetter {
        if (index < 0) {
            throw new Error("index < 0");
        }
        return getTextFormat(this, index, count, cachedAttr);
    }
    getUsedFontNames(fontNames?: Set<string>): Set<string> {
        return getUsedFontNames(this, fontNames);
    }

    insertText(text: string, index: number, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
        if (index < 0) {
            throw new Error("index < 0");
        }
        insertSimpleText(this, text, index, props);
        this.__layouts.forEach(l => l.layout = l.layout && layoutAtInsert(this, l.__frame, index, text.length, l.layout));
    }
    // 这个没走api,纯是用于更新排版
    composingInputUpdate(index: number) {
        if (index < 0) {
            throw new Error("index < 0");
        }
        this.__layouts.forEach(l => l.layout = l.layout && layoutAtDelete(this, l.__frame, index, 1, l.layout));
    }
    insertFormatText(text: Text, index: number) {
        if (index < 0) {
            throw new Error("index < 0");
        }
        insertComplexText(this, text, index);
        this.__layouts.forEach(l => l.layout = l.layout && layoutAtInsert(this, l.__frame, index, text.length, l.layout));
    }
    formatText(index: number, length: number, key: string, value: any): { index: number, len: number, value: any }[] {
        if (index < 0) {
            throw new Error("index < 0");
        }
        const ret = formatText(this, index, length, key, value);
        this.__layouts.forEach(l => l.layout = l.layout && layoutAtFormat(this, l.__frame, index, length, l.layout));
        return ret;
    }
    formatPara(index: number, length: number, key: string, value: any): { index: number, len: number, value: any }[] {
        if (index < 0) {
            throw new Error("index < 0");
        }
        const ret = formatPara(this, index, length, key, value)
        this.__layouts.forEach(l => l.layout = l.layout && layoutAtFormat(this, l.__frame, index, length, l.layout));
        return ret;
    }
    deleteText(index: number, count: number): Text | undefined {
        if (index < 0) {
            throw new Error("index < 0");
        }
        const ret = deleteText(this, index, count);
        if (ret && this.__layouts.size > 0) {
            const paras = ret.paras;
            let hasBulletNumbers = false;
            for (let i = 0, len = paras.length; i < len; i++) {
                const p = paras[i];
                if (p.text.at(0) === '*') {
                    const spans = p.spans;
                    const span0 = spans[0];
                    if (span0 && span0.placeholder && span0.bulletNumbers && span0.length === 1) {
                        hasBulletNumbers = true;
                        break;
                    }
                }
            }
            if (hasBulletNumbers) {
                this.reLayout();
            }
            else {
                this.__layouts.forEach(l => l.layout = l.layout && layoutAtDelete(this, l.__frame, index, count, l.layout));
            }
        }
        return ret;
    }

    onRollback(from: string): void {
        if (from !== "composingInput") this.reLayout();
    }

    reLayout() {
        // this.__layout = undefined;
        this.__layouts.forEach(l => l.layout = undefined);
    }

    setTextBehaviour(textBehaviour: TextBehaviour) {
        if (!this.attr) this.attr = new TextAttr();
        this.attr.textBehaviour = textBehaviour;
    }
    setTextVerAlign(verAlign: TextVerAlign) {
        if (!this.attr) this.attr = new TextAttr();
        this.attr.verAlign = verAlign;
    }

    setBulletNumbersType(type: BulletNumbersType, index: number, len: number) {
        const ret = setBulletNumbersType(this, type, index, len);
        this.reLayout(); // todo
        return ret;
    }

    setBulletNumbersStart(start: number, index: number, len: number) {
        const ret = setBulletNumbersStart(this, start, index, len);
        this.reLayout(); // todo
        return ret;
    }

    setBulletNumbersBehavior(behavior: BulletNumbersBehavior, index: number, len: number) {
        const ret = setBulletNumbersBehavior(this, behavior, index, len);
        this.reLayout(); // todo
        return ret;
    }

    setParaIndent(indent: number | undefined, index: number, len: number) {
        const ret = setParaIndent(this, indent, index, len);
        this.reLayout(); // todo
        return ret;
    }

    setPadding(left: number, top: number, right: number, bottom: number) {
        if (!this.attr) this.attr = new TextAttr();
        if (!this.attr.padding) this.attr.padding = new Padding();
        if (left) this.attr.padding.left = left;
        if (top) this.attr.padding.top = top;
        if (right) this.attr.padding.right = right;
        if (bottom) this.attr.padding.bottom = bottom;
        this.reLayout(); // todo
    }
}
