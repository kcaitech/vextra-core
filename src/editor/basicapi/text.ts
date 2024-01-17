import { Page } from "../../data/page";
import { ParaAttr, ParaAttrSetter, SpanAttr, SpanAttrSetter, Text, TextBehaviour, TextHorAlign, TextVerAlign } from "../../data/classes";
import { BulletNumbersBehavior, BulletNumbersType, StrikethroughType, TextTransformType, UnderlineType } from "../../data/typesdefine";
import { Color } from "../../data/classes";


export function insertSimpleText(shapetext: Text, text: string, index: number, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
    shapetext.insertText(text, index, props)
}
export function insertComplexText(shapetext: Text, text: Text, index: number) {
    shapetext.insertFormatText(text, index);
}
export function deleteText(shapetext: Text, index: number, count: number): Text | undefined {
    return shapetext.deleteText(index, count);
}


export function textModifyColor(shapetext: Text, idx: number, len: number, color: Color | undefined) {
    const attr = new SpanAttrSetter();
    attr.color = color;
    attr.colorIsSet = true;
    const ret = shapetext.formatText(idx, len, { attr })
    const spans = ret.spans;
    const origin: { color: Color | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ color: span.color, length: span.length })
    })
    return origin;
}
export function textModifyFontName(shapetext: Text, idx: number, len: number, fontname: string | undefined) {
    const attr = new SpanAttrSetter();
    attr.fontName = fontname;
    attr.fontNameIsSet = true;
    const ret = shapetext.formatText(idx, len, { attr })
    const spans = ret.spans;
    const origin: { fontName: string | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ fontName: span.fontName, length: span.length })
    })
    return origin;
}
export function textModifyFontSize(shapetext: Text, idx: number, len: number, fontsize: number | undefined) {
    const attr = new SpanAttrSetter();
    attr.fontSize = fontsize;
    attr.fontSizeIsSet = true;
    const ret = shapetext.formatText(idx, len, { attr })
    const spans = ret.spans;
    const origin: { fontSize: number | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ fontSize: span.fontSize, length: span.length })
    })
    return origin;
}

export function shapeModifyTextBehaviour(page: Page, shapetext: Text, textBehaviour: TextBehaviour) {
    const text = shapetext;
    if (textBehaviour === TextBehaviour.Flexible) {
        // default
        if (!text.attr || !text.attr.textBehaviour || text.attr.textBehaviour === TextBehaviour.Flexible) return TextBehaviour.Flexible;
    }
    const origin = text.attr?.textBehaviour;
    text.setTextBehaviour(textBehaviour);
    return origin ?? TextBehaviour.Flexible;
}
export function shapeModifyTextVerAlign(shapetext: Text, verAlign: TextVerAlign) {
    const text = shapetext;
    if (verAlign === TextVerAlign.Top) {
        // default
        if (!text.attr || !text.attr.verAlign || text.attr.verAlign === TextVerAlign.Top) return TextVerAlign.Top;
    }
    const origin = text.attr?.verAlign;
    text.setTextVerAlign(verAlign);
    return origin ?? TextVerAlign.Top;
}
export function textModifyHorAlign(shapetext: Text, horAlign: TextHorAlign, index: number, len: number) {
    const attr = new ParaAttrSetter();
    attr.alignment = horAlign;
    attr.alignmentIsSet = true;
    const ret = shapetext.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { alignment: TextHorAlign | undefined, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ alignment: para.alignment, length: para.length })
    })
    return origin;
}
export function shapeModifyTextDefaultHorAlign(shapetext: Text, horAlign: TextHorAlign) {
    const text = shapetext;
    if (horAlign === TextHorAlign.Left) {
        // default
        if (!text.attr || !text.attr.alignment || text.attr.alignment === TextHorAlign.Left) return TextHorAlign.Left;
    }
    const origin = text.attr?.alignment;
    text.setDefaultTextHorAlign(horAlign);
    return origin ?? TextHorAlign.Left;
}
export function textModifyMinLineHeight(shapetext: Text, minLineheight: number, index: number, len: number) {
    const attr = new ParaAttrSetter();
    attr.minimumLineHeight = minLineheight;
    attr.minimumLineHeightIsSet = true;
    const ret = shapetext.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { minimumLineHeight?: number, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ minimumLineHeight: para.minimumLineHeight, length: para.length })
    })
    return origin;
}
export function textModifyMaxLineHeight(shapetext: Text, maxLineheight: number, index: number, len: number) {
    const attr = new ParaAttrSetter();
    attr.maximumLineHeight = maxLineheight;
    attr.maximumLineHeightIsSet = true;
    const ret = shapetext.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { maximumLineHeight: number | undefined, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ maximumLineHeight: para.maximumLineHeight, length: para.length })
    })
    return origin;
}
export function textModifyParaKerning(shapetext: Text, kerning: number | undefined, index: number, len: number) {
    const attr = new ParaAttrSetter();
    attr.kerning = kerning;
    attr.kerningIsSet = true;
    const ret = shapetext.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { kerning: number | undefined, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ kerning: para.kerning, length: para.length })
    })
    return origin;
}
export function textModifySpanKerning(shapetext: Text, kerning: number | undefined, index: number, len: number) {
    const attr = new SpanAttrSetter();
    attr.kerning = kerning;
    attr.kerningIsSet = true;
    const ret = shapetext.formatText(index, len, { attr: attr })
    const spans = ret.spans;
    const origin: { kerning: number | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ kerning: span.kerning, length: span.length })
    })
    return origin;
}
export function textModifyParaSpacing(shapetext: Text, paraSpacing: number, index: number, len: number) {
    const attr = new ParaAttrSetter();
    attr.paraSpacing = paraSpacing;
    attr.paraSpacingIsSet = true;
    const ret = shapetext.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { paraSpacing: number | undefined, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ paraSpacing: para.paraSpacing, length: para.length })
    })
    return origin;
}

export function textModifySpanTransfrom(shapetext: Text, transform: TextTransformType | undefined, index: number, len: number) {
    // 句属性
    const attr = new SpanAttrSetter();
    attr.transform = transform;
    attr.transformIsSet = true;
    const ret = shapetext.formatText(index, len, { attr: attr })
    const spans = ret.spans;
    const origin: { transform: TextTransformType | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ transform: span.transform, length: span.length })
    })
    return origin;
}
export function textModifyParaTransfrom(shapetext: Text, transform: TextTransformType | undefined, index: number, len: number) {
    // 段落属性
    const attr = new ParaAttrSetter();
    attr.transform = transform;
    attr.transformIsSet = true;
    const ret = shapetext.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { transform: TextTransformType | undefined, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ transform: para.transform, length: para.length })
    })
    return origin;
}
export function shapeModifyTextTransform(shapetext: Text, transform: TextTransformType | undefined) {
    const text = shapetext;
    const origin = text.attr?.transform;
    text.setDefaultTransform(transform);
    return origin ?? 0;
}

export function textModifyHighlightColor(shapetext: Text, idx: number, len: number, color: Color | undefined) {
    const attr = new SpanAttrSetter();
    attr.highlight = color;
    attr.highlightIsSet = true;
    const ret = shapetext.formatText(idx, len, { attr })
    const spans = ret.spans;
    const origin: { highlight: Color | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ highlight: span.highlight, length: span.length })
    })
    return origin;
}
export function textModifyUnderline(shapetext: Text, underline: UnderlineType | undefined, index: number, len: number) {
    const attr = new SpanAttrSetter();
    attr.underline = underline;
    attr.underlineIsSet = true;
    const ret = shapetext.formatText(index, len, { attr })
    const spans = ret.spans;
    const origin: { underline: UnderlineType | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ underline: span.underline, length: span.length })
    })
    return origin;
}
export function textModifyStrikethrough(shapetext: Text, strikethrough: StrikethroughType | undefined, index: number, len: number) {
    const attr = new SpanAttrSetter();
    attr.strikethrough = strikethrough;
    attr.strikethroughIsSet = true;
    const ret = shapetext.formatText(index, len, { attr })
    const spans = ret.spans;
    const origin: { strikethrough: StrikethroughType | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ strikethrough: span.strikethrough, length: span.length })
    })
    return origin;
}
export function textModifyBold(shapetext: Text, bold: boolean, index: number, len: number) {
    const attr = new SpanAttrSetter();
    attr.bold = bold;
    attr.boldIsSet = true;
    const ret = shapetext.formatText(index, len, { attr })
    const spans = ret.spans;
    const origin: { bold: boolean | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ bold: span.bold, length: span.length })
    })
    return origin;
}
export function textModifyItalic(shapetext: Text, italic: boolean, index: number, len: number) {
    const attr = new SpanAttrSetter();
    attr.italic = italic;
    attr.italicIsSet = true;
    const ret = shapetext.formatText(index, len, { attr })
    const spans = ret.spans;
    const origin: { italic: boolean | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ italic: span.italic, length: span.length })
    })
    return origin;
}

export function textModifyBulletNumbersType(shapetext: Text, type: BulletNumbersType, index: number, len: number) {
    shapetext.setBulletNumbersType(type, index, len);
}

export function textModifyBulletNumbersStart(shapetext: Text, start: number, index: number, len: number) {
    shapetext.setBulletNumbersStart(start, index, len);
}

export function textModifyBulletNumbersBehavior(shapetext: Text, behavior: BulletNumbersBehavior, index: number, len: number) {
    shapetext.setBulletNumbersBehavior(behavior, index, len);
}

export function textModifyParaIndent(shapetext: Text, indent: number | undefined, index: number, len: number) {
    shapetext.setParaIndent(indent, index, len);
}
