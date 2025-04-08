/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BasicArray } from "../basic";
import { Para, AttrGetter, Span, SpanAttr, Text, ParaAttr, UnderlineType, StrikethroughType, TextTransformType, TextAttr, TextHorAlign } from "./text";
import { _travelTextPara } from "./texttravel";
import { mergeParaAttr, mergeSpanAttr } from "./textutils";
import { Color } from "../color";
import { FillType } from "../style";
import { gradient_equals } from "./textutils";
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
            mergeSpanAttr(span1, span, true);
            text.paras.at(-1)?.spans.push(span1);
        })
    return text;
}

const _NullColor = new Color(1, 0, 0, 0);
const _NullMask = ''

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
    else if (!(color.equals(attrGetter.color))) {
        // 两个都不是_NullColor
        attrGetter.colorIsMulti = true;
    }
    const gradient = attr.gradient ?? (paraAttr?.gradient) ?? (textAttr?.gradient);
    if (attrGetter.gradient === undefined) {
        attrGetter.gradient = gradient;
    } else if (gradient === undefined) {
        attrGetter.gradientIsMulti = true;
    } else if (!gradient_equals(attrGetter.gradient, gradient)) {
        attrGetter.gradientIsMulti = true;
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
    else if(fontSize === undefined || attrGetter.fontSize !== fontSize){
        attrGetter.fontSizeIsMulti=true
    }

    const textMask = attr.textMask ?? (paraAttr?.textMask) ?? (textAttr?.textMask) ?? _NullMask;
    if (attrGetter.textMask === undefined) {
        attrGetter.textMask = textMask;
    }
    else if (attrGetter.textMask !== textMask) {
        attrGetter.textMaskIsMulti = true;
    }

    const highlight = attr.highlight ?? (paraAttr?.highlight) ?? (textAttr?.highlight) ?? _NullColor;
    if (attrGetter.highlight === undefined) {
        attrGetter.highlight = highlight;
    }
    else if (highlight === attrGetter.highlight) {
        // 同时为_NullColor
    }
    else if (highlight === _NullColor || attrGetter.highlight === _NullColor) {
        // 其中一个为_NullColor
        attrGetter.highlightIsMulti = true;
    }
    else if (!(highlight.equals(attrGetter.highlight))) {
        // 两个都不是_NullColor
        attrGetter.highlightIsMulti = true;
    }

    const weight = attr.weight ?? (paraAttr?.weight) ?? (textAttr?.weight) ?? 400;
    if (attrGetter.weight === undefined) {
        attrGetter.weight = weight;
    }
    else if (weight === undefined || attrGetter.weight !== weight) {
        attrGetter.weightIsMulti = true;
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

    const fillType = attr.fillType ?? (paraAttr?.fillType) ?? (textAttr?.fillType) ?? FillType.SolidColor;
    if (attrGetter.fillType === undefined) {
        if (fillType) attrGetter.fillType = fillType;
    }
    else if (fillType && attrGetter.fillType !== fillType) {
        attrGetter.fillTypeIsMulti = true;
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

    // weight
    if (from.weightIsMulti) to.weightIsMulti = true;
    else if (from.weight !== undefined) to.weight = from.weight;

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

    if (from.fillTypeIsMulti) to.fillTypeIsMulti = true;
    else if (from.fillType) to.fillType = from.fillType;

    if (from.gradientIsMulti) to.gradientIsMulti = true;
    else if (from.gradient) to.gradient = from.gradient;

    if (from.textMaskIsMulti) to.textMaskIsMulti = true;
    else if (from.textMask) to.textMask = from.textMask;
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

    const autoLineHeight = attr.autoLineHeight ?? (defaultAttr?.autoLineHeight) ?? true;
    if (attrGetter.autoLineHeight === undefined) {
        attrGetter.autoLineHeight = autoLineHeight;
    }
    else if (attrGetter.autoLineHeight !== !!autoLineHeight) {
        attrGetter.autoLineHeightIsMulti = true;
    }

    const maximumLineHeight = attr.maximumLineHeight ?? (defaultAttr?.maximumLineHeight);
    if (attrGetter.maximumLineHeight === undefined) {
        attrGetter.maximumLineHeight = maximumLineHeight;
    }
    else if (attrGetter.maximumLineHeight !== maximumLineHeight) {
        attrGetter.maximumLineHeightIsMulti = true;
    }

    const minimumLineHeight = attr.minimumLineHeight ?? (defaultAttr?.minimumLineHeight);
    if (attrGetter.minimumLineHeight === undefined) {
        attrGetter.minimumLineHeight = minimumLineHeight;
    }
    else if (attrGetter.minimumLineHeight !== minimumLineHeight) {
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

    if (from.autoLineHeightIsMulti) to.autoLineHeightIsMulti = true;
    else if (from.autoLineHeight !== undefined) to.autoLineHeight = from.autoLineHeight;

    if (from.maximumLineHeightIsMulti) to.maximumLineHeightIsMulti = true;
    else if (from.maximumLineHeight !== undefined) to.maximumLineHeight = from.maximumLineHeight;

    if (from.minimumLineHeightIsMulti) to.minimumLineHeightIsMulti = true;
    else if (from.minimumLineHeight !== undefined) to.minimumLineHeight = from.minimumLineHeight;

    if (from.paraSpacingIsMulti) to.paraSpacingIsMulti = true;
    else if (from.paraSpacing !== undefined) to.paraSpacing = from.paraSpacing;
}

function coverFormat(fmt: AttrGetter, attr: SpanAttr) {
    // fontNameIsSet: boolean = false;
    // fontSizeIsSet: boolean = false;
    // colorIsSet: boolean = false;
    // highlightIsSet: boolean = false;
    // weightIsSet: boolean = false;
    // italicIsSet: boolean = false;
    // underlineIsSet: boolean = false;
    // strikethroughIsSet: boolean = false;
    // kerningIsSet: boolean = false;
    // transformIsSet: boolean = false;
    if (attr.fontName) {
        fmt.fontName = attr.fontName;
        fmt.fontNameIsMulti = false;
    }
    if (attr.fontSize !== undefined) {
        fmt.fontSize = attr.fontSize;
        fmt.fontSizeIsMulti = false;
    }
    if (attr.color) {
        fmt.color = attr.color;
        fmt.colorIsMulti = false;
    }
    if (attr.highlight) {
        fmt.highlight = attr.highlight;
        fmt.highlightIsMulti = false;
    }
    if (attr.weight !== undefined) {
        fmt.weight = attr.weight;
        fmt.weightIsMulti = false;
    }
    if (attr.italic !== undefined) {
        fmt.italic = attr.italic;
        fmt.italicIsMulti = false;
    }
    if (attr.underline) {
        fmt.underline = attr.underline;
        fmt.underlineIsMulti = false;
    }
    if (attr.strikethrough) {
        fmt.strikethrough = attr.strikethrough;
        fmt.strikethroughIsMulti = false;
    }
    if (attr.kerning !== undefined) {
        fmt.kerning = attr.kerning;
        fmt.kerningIsMulti = false;
    }
    if (attr.transform) {
        fmt.transform = attr.transform;
        fmt.transformIsMulti = false;
    }
    if (attr.fillType) {
        fmt.fillType = attr.fillType;
        fmt.fillTypeIsMulti = false;
    }
    if (attr.gradient) {
        fmt.gradient = attr.gradient;
        fmt.gradientIsMulti = false;
    }
}

export function getTextFormat(shapetext: Text, index: number, length: number, cachedAttr?: SpanAttr): AttrGetter {
    const spanfmt = new AttrGetter();
    const parafmt = new AttrGetter();
    const textfmt = new AttrGetter();

    if (shapetext.attr) {
        _getParaFormat(shapetext.attr, textfmt, shapetext.attr);
        textfmt.verAlign = shapetext.attr.verAlign;
        textfmt.orientation = shapetext.attr.orientation;
        textfmt.textBehaviour = shapetext.attr.textBehaviour;
    }

    // length === 0时，获取光标属性
    if (length === 0) {
        const ret = shapetext.alignParaRange(index, length);
        if (ret.index !== index) {
            --index;
        }
        length = 1;
    } else {
        cachedAttr = undefined; // 仅光标有效
    }

    let _para: Para | undefined;
    let _paraIndex = 0;
    let _hasSpan = false;
    _travelTextPara(shapetext.paras, index, length,
        (paraArray, paraIndex, para, index, length) => {
            _hasSpan = false
            _para = para;
            _paraIndex = index;
            const attr = para.attr;
            if (attr) _getParaFormat(attr, parafmt, shapetext.attr);
        },
        (span, index, length) => {
            _hasSpan = true
            _paraIndex += index;
            const isNewLineSpan = span.length === 1 && _paraIndex === _para!.length - 1;
            // 忽略回车属性
            if (!isNewLineSpan || _para!.spans.length <= 1) _getSpanFormat(span, spanfmt, _para!.attr, shapetext.attr);
            _paraIndex += length;
        },
        () => {
            if (!_hasSpan) {
                const span = _para!.spans[_para!.spans.length - 1];
                _getSpanFormat(span, spanfmt, _para!.attr, shapetext.attr);
            }
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
    if (textfmt.textMask === _NullMask) {
        textfmt.textMask = undefined;
    }
    if (cachedAttr) {
        coverFormat(textfmt, cachedAttr);
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