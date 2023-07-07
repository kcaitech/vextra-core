import { BasicArray } from "./basic";
import { Para, AttrGetter, Span, SpanAttr, Text, ParaAttr } from "./text";
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

function _getSpanFormat(attr: SpanAttr, attrGetter: AttrGetter) {
    if (attr.color != undefined && (attrGetter.color == undefined || !isColorEqual(attr.color, attrGetter.color))) {
        if (attrGetter.color == undefined) {
            attrGetter.color = attr.color;
        } else {
            attrGetter.colorIsMulti = true;
        }
    }
    if (attr.fontName != undefined && attr.fontName !== attrGetter.fontName) {
        if (attrGetter.fontName == undefined) {
            attrGetter.fontName = attr.fontName;
        } else {
            attrGetter.fontNameIsMulti = true;
        }
    }
    if (attr.fontSize != undefined && attr.fontSize !== attrGetter.fontSize) {
        if (attrGetter.fontSize == undefined) {
            attrGetter.fontSize = attr.fontSize;
        } else {
            attrGetter.fontSizeIsMulti = true;
        }
    }
}

function _mergeSpanFormat(from: AttrGetter, to: AttrGetter) {
    if (from.fontNameIsMulti) to.fontNameIsMulti = true;
    else if (from.fontName) to.fontName = from.fontName;

    if (from.colorIsMulti) to.colorIsMulti = true;
    else if (from.color) to.color = from.color;

    if (from.fontSizeIsMulti) to.fontSizeIsMulti = true;
    else if (from.fontSize !== undefined) to.fontSize = from.fontSize;
}

function _getParaFormat(attr: ParaAttr, attrGetter: AttrGetter) {
    _getSpanFormat(attr, attrGetter);

    if (attr.alignment != undefined && attr.alignment !== attrGetter.alignment) {
        if (attrGetter.alignment == undefined) {
            attrGetter.alignment = attr.alignment;
        } else {
            attrGetter.alignmentIsMulti = true;
        }
    }
    if (attr.kerning != undefined && attr.kerning !== attrGetter.kerning) {
        if (attrGetter.kerning == undefined) {
            attrGetter.kerning = attr.kerning;
        } else {
            attrGetter.kerningIsMulti = true;
        }
    }
    if (attr.maximumLineHeight != undefined && attr.maximumLineHeight !== attrGetter.maximumLineHeight) {
        if (attrGetter.maximumLineHeight == undefined) {
            attrGetter.maximumLineHeight = attr.maximumLineHeight;
        } else {
            attrGetter.maximumLineHeightIsMulti = true;
        }
    }
    if (attr.minimumLineHeight != undefined && attr.minimumLineHeight !== attrGetter.minimumLineHeight) {
        if (attrGetter.minimumLineHeight == undefined) {
            attrGetter.minimumLineHeight = attr.minimumLineHeight;
        } else {
            attrGetter.minimumLineHeightIsMulti = true;
        }
    }
    if (attr.paraSpacing != undefined && attr.paraSpacing !== attrGetter.paraSpacing) {
        if (attrGetter.paraSpacing == undefined) {
            attrGetter.paraSpacing = attr.paraSpacing;
        } else {
            attrGetter.paraSpacingIsMulti = true;
        }
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
        _getParaFormat(shapetext.attr, textfmt);
        textfmt.verAlign = shapetext.attr.verAlign;
        textfmt.orientation = shapetext.attr.orientation;
        textfmt.textBehaviour = shapetext.attr.textBehaviour;
    }

    _travelTextPara(shapetext.paras, index, length,
        (paraArray, paraIndex, para, index, length) => {
            const attr = para.attr;
            if (attr) _getParaFormat(attr, parafmt);
        },
        (span, index, length) => {
            _getSpanFormat(span, spanfmt); // todo 考虑默认属性
        })

    // merge
    _mergeSpanFormat(spanfmt, parafmt);
    _mergeParaAttr(parafmt, textfmt);

    return textfmt;
}