import { Para, Span } from "./text";

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

function __travelTextPara(paraArray: Para[], paraIndex: number, index: number, length: number, paratravel: (paraArray: Para[], paraIndex: number, para: Para, index: number, length: number) => void, spantravel?: (span: Span, index: number, length: number) => void) {
    while (length > 0 && paraIndex < paraArray.length) {
        const para = paraArray[paraIndex];
        const end = Math.min(para.length, index + length);

        paratravel(paraArray, paraIndex, para, index, end - index);

        if (spantravel) _travelTextSpan(para.spans, index, length, spantravel);

        length -= end - index;
        index = 0;
        paraIndex++;
    }
}

/**
 * 
 * @param paras 
 * @param index 
 * @param length 
 * @param paratravel 
 * @param spantravel 
 */
export function _travelTextPara(paras: Para[], index: number, length: number, paratravel: (paraArray: Para[], paraIndex: number, para: Para, index: number, length: number) => void, spantravel?: (span: Span, index: number, length: number) => void) {
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        if (index < p.length) {
            __travelTextPara(paras, i, index, length, paratravel, spantravel);
            break;
        }
        else {
            index -= p.length;
        }
    }
}
// ---------------------------------------