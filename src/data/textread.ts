import { BasicArray } from "./basic";
import { Color } from "./classes";
import { Para, AttrGetter, Span, SpanAttr, Text, ParaAttr, UnderlineType, StrikethroughType, TextTransformType, TextAttr, TextHorAlign } from "./text";
import { _travelTextPara } from "./texttravel";
import { mergeParaAttr, mergeSpanAttr } from "./textutils";
import { isColorEqual } from "./utils";


export function getSimpleText(shapetext: Text, index: number, length: number): string {
    let text = '';
    _travelTextPara(shapetext.paras, index, length, (paraArray, paraIndex, para, index, length) => {
        text += para.text.slice(index, index + length);
    })
    return text;
}

export function getTextWithFmt(shapetext: Text, index: number, length: number): Text { // 带格式
    const text = new Text(new BasicArray<Para>());
    _travelTextPara(shapetext.paras, index, length,
        (paraArray, paraIndex, para, index, length) => {
            const end = index + length;
            const _text = para.text.slice(index, end);
            const para1 = new Para(_text, new BasicArray<Span>());
            mergeParaAttr(para1, para);
            text.paras.push(para1);
        },
        (span, index, length) => {
            const end = index + length;
            const span1 = new Span(end - index);
            mergeSpanAttr(span1, span);
            text.paras.at(-1)?.spans.push(span1);
        })
    return text;
}

const _NullColor = new Color(1, 0, 0, 0);
function _getSpanFormat(attr: SpanAttr, attrGetter: AttrGetter, paraAttr: ParaAttr | undefined, textAttr: TextAttr | undefined) {
    const color = attr.color ?? (paraAttr?.color) ?? (textAttr?.color) ?? _NullColor;
    if (attrGetter.color === undefined) {
        attrGetter.color = color;
    }
    else if (color === attrGetter.color) {
        // 同时为_NullColor
    }
    else if (color === _NullColor || attrGetter.color === _NullColor) {
        // 其中一个为_NullColor
        attrGetter.colorIsMulti = true;
    }
    else if (!isColorEqual(color, attrGetter.color)) {
        // 两个都不是_NullColor
        attrGetter.colorIsMulti = true;
    }

    const fontName = attr.fontName ?? (paraAttr?.fontName) ?? (textAttr?.fontName) ?? '';
    if (attrGetter.fontName === undefined) {
        attrGetter.fontName = fontName;
    }
    else if (fontName === undefined || attrGetter.fontName !== fontName) {
        attrGetter.fontNameIsMulti = true;
    }

    const fontSize = attr.fontSize ?? (paraAttr?.fontSize) ?? (textAttr?.fontSize) ?? 0;
    if (attrGetter.fontSize === undefined) {
        attrGetter.fontSize = fontSize;
    }
    else if (fontSize === undefined || attrGetter.fontSize !== fontSize) {
        attrGetter.fontSizeIsMulti = true;
    }

    const highlight = attr.highlight ?? (paraAttr?.highlight) ?? (textAttr?.highlight) ?? _NullColor;
    if (attrGetter.highlight === undefined) {
        attrGetter.highlight = color;
    }
    else if (highlight === attrGetter.highlight) {
        // 同时为_NullColor
    }
    else if (highlight === _NullColor || attrGetter.highlight === _NullColor) {
        // 其中一个为_NullColor
        attrGetter.highlightIsMulti = true;
    }
    else if (!isColorEqual(highlight, attrGetter.highlight)) {
        // 两个都不是_NullColor
        attrGetter.highlightIsMulti = true;
    }

    const bold = attr.bold ?? (paraAttr?.bold) ?? (textAttr?.bold) ?? false;
    if (attrGetter.bold === undefined) {
        attrGetter.bold = bold;
    }
    else if (bold === undefined || attrGetter.bold !== bold) {
        attrGetter.boldIsMulti = true;
    }

    const italic = attr.italic ?? (paraAttr?.italic) ?? (textAttr?.italic) ?? false;
    if (attrGetter.italic === undefined) {
        attrGetter.italic = italic;
    }
    else if (italic === undefined || attrGetter.italic !== italic) {
        attrGetter.italicIsMulti = true;
    }

    const underline = attr.underline ?? (paraAttr?.underline) ?? (textAttr?.underline) ?? UnderlineType.None;
    if (attrGetter.underline === undefined) {
        attrGetter.underline = underline;
    }
    else if (underline === undefined || attrGetter.underline !== underline) {
        attrGetter.underlineIsMulti = true;
    }

    const strikethrough = attr.strikethrough ?? (paraAttr?.strikethrough) ?? (textAttr?.strikethrough) ?? StrikethroughType.None;
    if (attrGetter.strikethrough === undefined) {
        attrGetter.strikethrough = strikethrough;
    }
    else if (strikethrough === undefined || attrGetter.strikethrough !== strikethrough) {
        attrGetter.strikethroughIsMulti = true;
    }

    const kerning = attr.kerning ?? (paraAttr?.kerning) ?? (textAttr?.kerning) ?? 0;
    if (attrGetter.kerning === undefined) {
        attrGetter.kerning = kerning;
    }
    else if (kerning === undefined || attrGetter.kerning !== kerning) {
        attrGetter.kerningIsMulti = true;
    }

    const transform = attr.transform ?? (paraAttr?.transform) ?? (textAttr?.transform) ?? TextTransformType.None;
    if (attrGetter.transform === undefined) {
        attrGetter.transform = transform;
    }
    else if (transform === undefined || attrGetter.transform !== transform) {
        attrGetter.transformIsMulti = true;
    }

    const bulletNumbers = attr.bulletNumbers;
    if (attrGetter.bulletNumbers === undefined) {
        if (bulletNumbers) attrGetter.bulletNumbers = bulletNumbers;
    }
    else if (bulletNumbers && attrGetter.bulletNumbers.type !== bulletNumbers.type) {
        attrGetter.bulletNumbersIsMulti = true;
    }
}

function _mergeSpanFormat(from: AttrGetter, to: AttrGetter) {
    if (from.fontNameIsMulti) to.fontNameIsMulti = true;
    else if (from.fontName) to.fontName = from.fontName;

    if (from.colorIsMulti) to.colorIsMulti = true;
    else if (from.color) to.color = from.color;

    if (from.fontSizeIsMulti) to.fontSizeIsMulti = true;
    else if (from.fontSize !== undefined) to.fontSize = from.fontSize;

    // hightlight
    if (from.highlightIsMulti) to.highlightIsMulti = true;
    else if (from.highlight) to.highlight = from.highlight;

    // bold
    if (from.boldIsMulti) to.boldIsMulti = true;
    else if (from.bold !== undefined) to.bold = from.bold;

    // italic
    if (from.italicIsMulti) to.italicIsMulti = true;
    else if (from.italic !== undefined) to.italic = from.italic;

    // underline
    if (from.underlineIsMulti) to.underlineIsMulti = true;
    else if (from.underline !== undefined) to.underline = from.underline;

    // strikethrough
    if (from.strikethroughIsMulti) to.strikethroughIsMulti = true;
    else if (from.strikethrough !== undefined) to.strikethrough = from.strikethrough;

    // kerning
    if (from.kerningIsMulti) to.kerningIsMulti = true;
    else if (from.kerning !== undefined) to.kerning = from.kerning;

    // transform
    if (from.transformIsMulti) to.transformIsMulti = true;
    else if (from.transform !== undefined) to.transform = from.transform;

    // bulletnumbers
    if (from.bulletNumbersIsMulti) to.bulletNumbersIsMulti = true;
    else if (from.bulletNumbers !== undefined) to.bulletNumbers = from.bulletNumbers;
}

function _getParaFormat(attr: ParaAttr, attrGetter: AttrGetter, defaultAttr: TextAttr | undefined) {
    _getSpanFormat(attr, attrGetter, undefined, defaultAttr);

    const alignment = attr.alignment ?? (defaultAttr?.alignment) ?? TextHorAlign.Left;
    if (attrGetter.alignment === undefined) {
        attrGetter.alignment = alignment;
    }
    else if (alignment === undefined || attrGetter.alignment !== alignment) {
        attrGetter.alignmentIsMulti = true;
    }

    const kerning = attr.kerning ?? (defaultAttr?.kerning) ?? 0;
    if (attrGetter.kerning === undefined) {
        attrGetter.kerning = kerning;
    }
    else if (kerning === undefined || attrGetter.kerning !== kerning) {
        attrGetter.kerningIsMulti = true;
    }

    const maximumLineHeight = attr.maximumLineHeight ?? (defaultAttr?.maximumLineHeight) ?? 0;
    if (attrGetter.maximumLineHeight === undefined) {
        attrGetter.maximumLineHeight = maximumLineHeight;
    }
    else if (maximumLineHeight === undefined || attrGetter.maximumLineHeight !== maximumLineHeight) {
        attrGetter.maximumLineHeightIsMulti = true;
    }

    const minimumLineHeight = attr.minimumLineHeight ?? (defaultAttr?.minimumLineHeight) ?? 0;
    if (attrGetter.minimumLineHeight === undefined) {
        attrGetter.minimumLineHeight = minimumLineHeight;
    }
    else if (minimumLineHeight === undefined || attrGetter.minimumLineHeight !== minimumLineHeight) {
        attrGetter.minimumLineHeightIsMulti = true;
    }

    const paraSpacing = attr.paraSpacing ?? (defaultAttr?.paraSpacing) ?? 0;
    if (attrGetter.paraSpacing === undefined) {
        attrGetter.paraSpacing = paraSpacing;
    }
    else if (paraSpacing === undefined || attrGetter.paraSpacing !== paraSpacing) {
        attrGetter.paraSpacingIsMulti = true;
    }
}

function _mergeParaAttr(from: AttrGetter, to: AttrGetter) {
    _mergeSpanFormat(from, to);

    if (from.alignmentIsMulti) to.alignmentIsMulti = true;
    else if (from.alignment) to.alignment = from.alignment;

    if (from.kerningIsMulti) to.kerningIsMulti = true;
    else if (from.kerning !== undefined) to.kerning = from.kerning;

    if (from.maximumLineHeightIsMulti) to.maximumLineHeightIsMulti = true;
    else if (from.maximumLineHeight !== undefined) to.maximumLineHeight = from.maximumLineHeight;

    if (from.minimumLineHeightIsMulti) to.minimumLineHeightIsMulti = true;
    else if (from.minimumLineHeight !== undefined) to.minimumLineHeight = from.minimumLineHeight;

    if (from.paraSpacingIsMulti) to.paraSpacingIsMulti = true;
    else if (from.paraSpacing !== undefined) to.paraSpacing = from.paraSpacing;
}

export function getTextFormat(shapetext: Text, index: number, length: number): AttrGetter {
    const spanfmt = new AttrGetter();
    const parafmt = new AttrGetter();
    const textfmt = new AttrGetter();

    if (shapetext.attr) {
        _getParaFormat(shapetext.attr, textfmt, shapetext.attr);
        textfmt.verAlign = shapetext.attr.verAlign;
        textfmt.orientation = shapetext.attr.orientation;
        textfmt.textBehaviour = shapetext.attr.textBehaviour;
    }

    let _paraAttr: ParaAttr | undefined;
    _travelTextPara(shapetext.paras, index, length,
        (paraArray, paraIndex, para, index, length) => {
            const attr = para.attr;
            _paraAttr = attr;
            if (attr) _getParaFormat(attr, parafmt, shapetext.attr);
        },
        (span, index, length) => {
            _getSpanFormat(span, spanfmt, _paraAttr, shapetext.attr);
        })

    // merge
    _mergeSpanFormat(spanfmt, parafmt);
    _mergeParaAttr(parafmt, textfmt);

    if (textfmt.color === _NullColor) {
        textfmt.color = undefined;
    }
    if (textfmt.highlight === _NullColor) {
        textfmt.highlight = undefined;
    }

    return textfmt;
}

export function getUsedFontNames(shapetext: Text, fontNames?: Set<string>): Set<string> {
    const ret = fontNames ?? new Set<string>();

    if (shapetext.attr && shapetext.attr.fontName) {
        ret.add(shapetext.attr.fontName);
    }

    _travelTextPara(shapetext.paras, 0, Number.MAX_VALUE,
        (paraArray, paraIndex, para, index, length) => {
            const attr = para.attr;
            if (attr && attr.fontName) ret.add(attr.fontName);
        },
        (span, index, length) => {
            if (span.fontName) ret.add(span.fontName);
        })

    return ret;
}