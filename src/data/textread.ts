import { BasicArray } from "./basic";
import { Para, Span, Text } from "./text";
import { mergeParaAttr, mergeSpanAttr } from "./textutils";

function _getText(paraArray: Para[], paraIndex: number, index: number, length: number) {
    let text = '';
    while (length > 0 && paraIndex < paraArray.length) {
        const para = paraArray[index];
        const end = Math.min(para.length, index + length);
        text += para.text.slice(index, end);
        length -= end - index;
        index = 0;
    }
    return text;
}

export function getText(shapetext: Text, index: number, length: number): string {
    // const shapetext = shape.text;
    const paras = shapetext.paras;
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        if (index < p.length) {
            return _getText(paras, i, index, length);
        }
        else {
            index -= p.length;
        }
    }
    return '';
}

function __getTextSpan(spans: Span[], spanIndex: number, index: number, length: number, retspans: Span[]) {
    while (length > 0 && spanIndex < spans.length) {
        const span = spans[spanIndex];
        const end = Math.min(span.length, index + length);
        const span1 = new Span(end - index);
        mergeSpanAttr(span1, span);
        retspans.push(span1);
        length -= end - index;
        index = 0;
        spanIndex++;
    }
}

function _getTextSpan(spans: Span[], index: number, length: number, retspans: Span[]) {
    // 定位到span
    for (let i = 0, len = spans.length; i < len; i++) {
        const span = spans[i];
        if (index < span.length) {
            __getTextSpan(spans, i, index, length, retspans);
            break;
        }
        else {
            index -= span.length;
        }
    }
}

function _getTextPara(paraArray: Para[], paraIndex: number, index: number, length: number, text: Text) {
    while (length > 0 && paraIndex < paraArray.length) {
        const para = paraArray[index];
        const end = Math.min(para.length, index + length);
        const _text = para.text.slice(index, end);

        const para1 = new Para(_text, new BasicArray<Span>());
        mergeParaAttr(para1, para);
        text.paras.push(para1);

        _getTextSpan(para.spans, index, length, para1.spans);

        length -= end - index;
        index = 0;
    }
    return text;
}

export function getTextText(shapetext: Text, index: number, length: number): Text { // 带格式
    const text = new Text(new BasicArray<Para>());
    // const shapetext = shape.text;
    const paras = shapetext.paras;
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        if (index < p.length) {
            _getTextPara(paras, i, index, length, text);
            break;
        }
        else {
            index -= p.length;
        }
    }
    return text;
}
