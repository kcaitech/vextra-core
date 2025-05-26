/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

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

function __travelTextPara(paraArray: Para[],
    paraIndex: number,
    index: number,
    length: number,
    paratravel: (paraArray: Para[], paraIndex: number, para: Para, index: number, length: number) => void,
    spantravel?: (span: Span, index: number, length: number) => void,
    paratravelEnd?: () => void) {
    while (length > 0 && paraIndex < paraArray.length) {
        const para = paraArray[paraIndex];
        const end = Math.min(para.length, index + length);

        paratravel(paraArray, paraIndex, para, index, end - index);

        if (spantravel) _travelTextSpan(para.spans, index, length, spantravel);

        if (paratravelEnd) paratravelEnd();
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
export function _travelTextPara(paras: Para[],
    index: number,
    length: number,
    paratravel: (paraArray: Para[], paraIndex: number, para: Para, index: number, length: number) => void,
    spantravel?: (span: Span, index: number, length: number) => void,
    paratravelEnd?: () => void) {
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        if (index < p.length) {
            __travelTextPara(paras, i, index, length, paratravel, spantravel, paratravelEnd);
            break;
        }
        else {
            index -= p.length;
        }
    }
}
// ---------------------------------------