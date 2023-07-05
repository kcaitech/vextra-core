import { BasicArray } from "./basic";
import { Para, ParaAttrGetter, Span, SpanAttr, SpanAttrGetter, Text } from "./text";
import { mergeParaAttr, mergeSpanAttr } from "./textutils";
import { isColorEqual } from "./utils";

// traveler
function __travelTextSpan(spans: Span[], spanIndex: number, index: number, length: number, travel: (span: Span, index: number, length: number) => void) {
    while (length > 0 && spanIndex < spans.length) {
        const span = spans[spanIndex];
        const end = Math.min(span.length, index + length);
        travel(span, index, end - index);
        length -= end - index;
        index = 0;
        spanIndex++;
    }
}

function _travelTextSpan(spans: Span[], index: number, length: number, travel: (span: Span, index: number, length: number) => void) {
    // 定位到span
    for (let i = 0, len = spans.length; i < len; i++) {
        const span = spans[i];
        if (index < span.length) {
            __travelTextSpan(spans, i, index, length, travel);
            break;
        }
        else {
            index -= span.length;
        }
    }
}

function __travelTextPara(paraArray: Para[], paraIndex: number, index: number, length: number, paratravel: (para: Para, index: number, length: number) => void, spantravel?: (span: Span, index: number, length: number) => void) {
    while (length > 0 && paraIndex < paraArray.length) {
        const para = paraArray[index];
        const end = Math.min(para.length, index + length);

        paratravel(para, index, end - index);

        if (spantravel) _travelTextSpan(para.spans, index, length, spantravel);

        length -= end - index;
        index = 0;
    }
}

function _travelTextPara(paras: Para[], index: number, length: number, paratravel: (para: Para, index: number, length: number) => void, spantravel?: (span: Span, index: number, length: number) => void) {
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        if (index < p.length) {
            __travelTextPara(paras, i, index, length, paratravel);
            break;
        }
        else {
            index -= p.length;
        }
    }
}
// ---------------------------------------

export function getSimpleText(shapetext: Text, index: number, length: number): string {
    let text = '';
    _travelTextPara(shapetext.paras, index, length, (para, index, length) => {
        text += para.text.slice(index, index + length);
    })
    return text;
}

export function getTextWithFmt(shapetext: Text, index: number, length: number): Text { // 带格式
    const text = new Text(new BasicArray<Para>());
    _travelTextPara(shapetext.paras, index, length,
        (para, index, length) => {
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

function _getSpanFormat(attr: SpanAttr, attrGetter: SpanAttrGetter | ParaAttrGetter) {
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

export function getTextFormat(shapetext: Text, index: number, length: number): { attr: SpanAttrGetter, paraAttr: ParaAttrGetter } {
    const fmt = { attr: new SpanAttrGetter(), paraAttr: new ParaAttrGetter() }
    _travelTextPara(shapetext.paras, index, length,
        (para, index, length) => {
            const attr = para.attr;
            if (!attr) return;
            _getSpanFormat(attr, fmt.paraAttr);

            if (attr.alignment != undefined && attr.alignment !== fmt.paraAttr.alignment) {
                if (fmt.paraAttr.alignment == undefined) {
                    fmt.paraAttr.alignment = attr.alignment;
                } else {
                    fmt.paraAttr.alignmentIsMulti = true;
                }
            }
            if (attr.kerning != undefined && attr.kerning !== fmt.paraAttr.kerning) {
                if (fmt.paraAttr.kerning == undefined) {
                    fmt.paraAttr.kerning = attr.kerning;
                } else {
                    fmt.paraAttr.kerningIsMulti = true;
                }
            }
            if (attr.maximumLineHeight != undefined && attr.maximumLineHeight !== fmt.paraAttr.maximumLineHeight) {
                if (fmt.paraAttr.maximumLineHeight == undefined) {
                    fmt.paraAttr.maximumLineHeight = attr.maximumLineHeight;
                } else {
                    fmt.paraAttr.maximumLineHeightIsMulti = true;
                }
            }
            if (attr.minimumLineHeight != undefined && attr.minimumLineHeight !== fmt.paraAttr.minimumLineHeight) {
                if (fmt.paraAttr.minimumLineHeight == undefined) {
                    fmt.paraAttr.minimumLineHeight = attr.minimumLineHeight;
                } else {
                    fmt.paraAttr.minimumLineHeightIsMulti = true;
                }
            }
            if (attr.paraSpacing != undefined && attr.paraSpacing !== fmt.paraAttr.paraSpacing) {
                if (fmt.paraAttr.paraSpacing == undefined) {
                    fmt.paraAttr.paraSpacing = attr.paraSpacing;
                } else {
                    fmt.paraAttr.paraSpacingIsMulti = true;
                }
            }
        },
        (span, index, length) => {
            _getSpanFormat(span, fmt.attr);
        })
    return fmt;
}