/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

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
} from "../baseclasses";

import { Basic, BasicArray, ResourceMgr } from "../basic";

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
} from "../baseclasses";
import * as classes from "../baseclasses"
import { deleteText, formatPara, formatText, insertComplexText, insertSimpleText, setBulletNumbersBehavior, setBulletNumbersStart, setBulletNumbersType, setParaIndent } from "./textedit";
import { LayoutItem, TextLayout, layoutText } from "./textlayout";
import { layoutAtDelete, layoutAtFormat, layoutAtInsert } from "./textinclayout";
import { getSimpleText, getUsedFontNames, getTextFormat, getTextWithFmt } from "./textread";
import { _travelTextPara } from "./texttravel";
import { FillType, Padding } from "../baseclasses";
import { Gradient, StyleMangerMember, TextMask } from "../style"
import { Color } from "../color";
import { ShapeFrame, ShapeSize } from "../typesdefine";
import { getNextChar } from "./basic";

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
    weight?: number
    italic?: boolean
    bulletNumbers?: BulletNumbers
    highlight?: Color
    kerning?: number
    transform?: TextTransformType
    placeholder?: boolean
    fillType?: FillType
    gradient?: Gradient
    textMask?: string
    constructor(
    ) {
        super()
    }
}

export class ParaAttr extends SpanAttr implements classes.ParaAttr {
    typeId = 'para-attr'
    alignment?: TextHorAlign
    paraSpacing?: number
    autoLineHeight?: boolean
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
    weightIsMulti: boolean = false;
    italicIsMulti: boolean = false;
    underlineIsMulti: boolean = false;
    strikethroughIsMulti: boolean = false;

    alignmentIsMulti: boolean = false;
    paraSpacingIsMulti: boolean = false;
    kerningIsMulti: boolean = false;
    autoLineHeightIsMulti: boolean = false
    minimumLineHeightIsMulti: boolean = false;
    maximumLineHeightIsMulti: boolean = false;
    transformIsMulti: boolean = false;
    bulletNumbersIsMulti: boolean = false;
    fillTypeIsMulti: boolean = false;
    gradientIsMulti: boolean = false;
    textMaskIsMulti: boolean = false;
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

const EmptySpan = new Span(1);
Object.freeze(EmptySpan)

export type ParaIterItem = { char: string, span: Span, idx: number, spanIdx: number }

export class ParaIter {
    private _para: classes.Para;
    private _idx: number = 0;
    private _text: string;

    private _spanIdx: number = 0;
    private _spanOffset: number = 0;
    constructor(para: classes.Para) {
        this._para = para;
        this._text = para.text;
    }

    hasNext(): boolean {
        return this._idx < this._text.length;
    }

    get para() {
        return this._para;
    }

    private _nextAttr(step: number) {
        let span = this._para.spans[this._spanIdx];
        this._spanOffset += step;
        while (span && this._spanOffset >= span.length) {
            ++this._spanIdx;
            if (this._spanIdx >= this._para.spans.length) {
                this._spanIdx = this._para.spans.length - 1;
                this._spanOffset = 0;
                break;
            }
            this._spanOffset -= span.length;
            span = this._para.spans[this._spanIdx];
        }
    }

    next(): ParaIterItem {
        const item = this.peekNext();
        const len = item.char.length;
        this._nextAttr(len)
        this._idx += len;
        return item
    }

    peekNext(): ParaIterItem {
        const char = getNextChar(this._text, this._idx);
        const span = this._para.spans[this._spanIdx] ?? EmptySpan;
        const spanIdx = this._spanIdx;
        const idx = this._idx;
        return { char, span: span as Span, idx, spanIdx }
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

    iter() {
        return new ParaIter(this)
    }
}

export class Text extends Basic implements classes.Text {

    static DefaultFontSize = 12;

    typeId = 'text'
    paras: BasicArray<Para>
    attr?: TextAttr
    // isPureString?: boolean

    // layout与显示窗口大小有关
    // 尽量复用, layout缓存排版信息，进行update
    private __layouts: Map<string, LayoutItem> = new Map();
    dropAllLayout(){
        this.__layouts.clear();
    }
    
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

    getLayout3(frame: ShapeSize, owner: string, token: string | undefined): { token: string, layout: TextLayout } {
        const width = frame.width;
        const height = frame.height;
        const cur = [width, height].join(',');
        if (cur !== token) {
            let o = token && this.__layouts.get(token);
            if (o) {
                if (o.owners.length === 1 && o.owners[0] === owner) {
                    o.update(frame, this);
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

        o.update(frame, this);
        if (!o.layout) o.layout = layoutText(this, frame);

        return { token: cur, layout: o.layout! }
    }

    getLayout2(frame: ShapeSize): TextLayout {

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
    private __styleMgr?: ResourceMgr<StyleMangerMember>;

    constructor(
        paras: BasicArray<Para>
    ) {
        super()
        this.paras = paras
    }

    setStylesMgr(styleMgr: ResourceMgr<StyleMangerMember>) {
        this.__styleMgr = styleMgr;
    }

    getStylesMgr(): ResourceMgr<StyleMangerMember> | undefined {
        return this.__styleMgr;
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

    setPaddingLeft(left: number) {
        if (!this.attr) this.attr = new TextAttr();
        if (!this.attr.padding) this.attr.padding = new Padding();
        if (left) this.attr.padding.left = left;
        this.reLayout(); // todo
    }
    setPaddingRight(right: number) {
        if (!this.attr) this.attr = new TextAttr();
        if (!this.attr.padding) this.attr.padding = new Padding();
        if (right) this.attr.padding.right = right;
        this.reLayout(); // todo
    }
}

export function string2Text(text: string): Text {
    const splits = text.split("\n")
    const paras = new BasicArray<Para>()
    for (let i = 0, len = splits.length; i < len; ++i) {
        let s = splits[i];
        if (!s.endsWith('\n')) s += "\n"
        const p = new Para(s, new BasicArray<Span>())
        p.spans.push(new Span(s.length))
        paras.push(p)
    }
    return new Text(paras)
}

function overrideSpan(span: Span, length: number, origin: Span): Span {
    return new Proxy<Span>(span, {
        get: (target: Span, p: string | symbol, receiver: any): any => {
            if (p.toString() === "length") return length;
            let val = Reflect.get(target, p, receiver);
            if (val === undefined) {
                val = Reflect.get(origin, p, receiver);
            }
            return val;
        }
    })
}

function overrideAttr<T extends {}>(attr: T | undefined, origin?: T): T {
    return new Proxy<T>(attr ?? {} as T, {
        get: (target: T, p: string | symbol, receiver: any): any => {
            let val = Reflect.get(target, p, receiver);
            if (val === undefined && origin) {
                val = Reflect.get(origin, p, receiver);
            }
            return val;
        }
    })
}

export class OverrideTextPara extends Basic implements classes.Para {
    para: Para
    origin: BasicArray<Para>
    index: number
    _spans?: BasicArray<Span>
    _attr?: ParaAttr
    constructor(
        para: Para,
        index: number,
        origin: BasicArray<Para>
    ) {
        super()
        this.para = para
        this.index = index
        this.origin = origin
    }
    get length() {
        return this.para.length;
    }
    get text() {
        return this.para.text
    }
    get attr() {
        if (this._attr) return this._attr;
        this._attr = overrideAttr(this.para.attr, this.origin[this.index]?.attr)
        return this._attr
    }
    charAt(index: number): string {
        return this.para.charAt(index);
    }

    iter() {
        return new ParaIter(this)
    }
    get spans() {
        if (this._spans) return this._spans;
        const originpara = this.origin[this.index]
        const spans = this.para.spans;

        if (!originpara || originpara.spans.length <= 0) {
            this._spans = spans;
            return spans;
        }


        let remain = this.para.length;
        const ret: BasicArray<Span> = new BasicArray()
        this._spans = ret;

        const ospans = originpara.spans;

        let offset = 0

        let oidx = 0
        let ooffset = 0
        for (let i = 0, len = spans.length; i < len && remain > 0;) {
            const span = spans[i]
            const ospan = ospans[oidx]
            const length = Math.min(i === spans.length - 1 ? remain : span.length - offset, oidx === ospans.length - 1 ? remain : ospan.length - ooffset) || 1; // 至少是1
            ret.push(overrideSpan(span, length, ospan))
            offset += length
            ooffset += length
            remain -= length

            if (oidx < ospans.length - 1 && ooffset >= ospan.length) {
                ++oidx;
                ooffset -= ospan.length
            }

            if (i < len && offset >= span.length) {
                ++i;
                offset -= span.length;
            }
        }
        return ret;
    }
}

export function overrideTextText(text: Text, origin: Text): Text {
    let _paras: BasicArray<Para> | undefined
    let __layouts: Map<string, LayoutItem> = new Map();
    return new Proxy<Text>(text, {
        get: (target: Span, p: string | symbol, receiver: any): any => {
            const ps = p.toString();
            if (ps === "attr") {
                return origin.attr // todo merge?
            }
            if (ps === "paras") {
                if (_paras) return _paras;
                const paras = text.paras;
                
                const ret = new BasicArray<Para>()
                _paras = ret;
                paras.forEach((p, i) => {
                    ret.push(new OverrideTextPara(p, i, origin.paras))
                })

                return ret;
            }
            if (ps === "__layouts") {
                return __layouts
            }
            let val = Reflect.get(target, p, receiver);
            if (val === undefined && origin) {
                val = Reflect.get(origin, p, receiver);
            }
            return val;
        }
    })
}