/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { importSpan } from "../baseimport";
import { BasicArray } from "../basic";
import { Para, Span, SpanAttr, ParaAttr, Text, BulletNumbersType, BulletNumbersBehavior } from "./text";
import { _travelTextPara } from "./texttravel";
import { isDiffSpanAttr, mergeParaAttr, mergeSpanAttr, mergeTextAttr } from "./textutils";

function __insertText(para: Para, text: string, index: number, propType: "complex" | "simple", attr?: SpanAttr) {
    const spans = para.spans;
    para.text = para.text.slice(0, index) + text + para.text.slice(index);

    for (let count = 0, i = 0, len = spans.length, idx = index; i < len; i++) {
        let span = spans[i];
        count += span.length;
        if (idx === 0) {
            if (attr || span.placeholder) {
                const _span = new Span(text.length);
                if (propType === 'simple') mergeSpanAttr(_span, span);
                if (attr) mergeSpanAttr(_span, attr, true);
                if (span.placeholder || _span.placeholder || isDiffSpanAttr(span, _span)) {
                    spans.splice(i, 0, _span);
                    break;
                }
            }
            span.length += text.length;
            break;
        }
        if (idx < span.length) { // split ?
            if (attr) {
                const _span = new Span(text.length);
                if (propType === 'simple') mergeSpanAttr(_span, span);
                mergeSpanAttr(_span, attr, true);
                if (span.placeholder || _span.placeholder || isDiffSpanAttr(span, _span)) {
                    // split
                    const _span2 = new Span(span.length - idx);
                    mergeSpanAttr(_span2, span);
                    span.length = idx;
                    spans.splice(i + 1, 0, _span, _span2);
                    break;
                }
            }
            span.length += text.length;
            break;
        }
        if (idx === span.length) { // 优先继承前一个span属性
            if (attr || span.placeholder) {
                const _span = new Span(text.length);
                if (propType === 'simple') mergeSpanAttr(_span, span);
                if (attr) mergeSpanAttr(_span, attr, true);
                if (span.placeholder || _span.placeholder || isDiffSpanAttr(span, _span)) {
                    spans.splice(i + 1, 0, _span);
                    break;
                }
            }
            span.length += text.length;
            break;
        }
        if (i === len - 1) { // 原数据有错？
            if (span.placeholder) {
                const _span = new Span(para.length - text.length - count);
                mergeSpanAttr(_span, span);
                spans.splice(i + 1, 0, _span);
                i++;
                span = spans[i];
            }
            else {
                span.length += para.length - text.length - count; // fix
            }
            if (attr || span.placeholder) {
                const _span = new Span(text.length);
                if (propType === 'simple') mergeSpanAttr(_span, span);
                if (attr) mergeSpanAttr(_span, attr, true);
                if (span.placeholder || _span.placeholder || isDiffSpanAttr(span, _span)) {
                    spans.splice(i + 1, 0, _span);
                    break;
                }
            }
            span.length += text.length;
            break;
        }
        idx -= span.length;
    }
}

function _insertText(paraArray: Para[], paraIndex: number, para: Para, text: string, index: number, propType: "complex" | "simple", props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
    const attr = props && props.attr;
    const paraAttr = props && props.paraAttr;
    let newParaIndex = text.indexOf('\n');
    if (newParaIndex < 0) {
        __insertText(para, text, index, propType, attr);
        if (paraAttr) {
            if (propType === 'simple') {
                mergeParaAttr(para, paraAttr);
            } else {
                const attr = new ParaAttr();
                mergeParaAttr(attr, paraAttr);
                para.attr = attr;
            }
        }
        return;
    }
    while (newParaIndex >= 0) {
        if (newParaIndex > 0) {
            const t = text.slice(0, newParaIndex);
            __insertText(para, t, index, propType, attr);
            if (paraAttr) {
                if (propType === 'simple') {
                    mergeParaAttr(para, paraAttr);
                } else {
                    const attr = new ParaAttr();
                    mergeParaAttr(attr, paraAttr);
                    para.attr = attr;
                }
            }
            index += newParaIndex;
        }
        text = text.slice(newParaIndex + 1)
        if (index === 0) {
            // new para
            const _text = '\n';
            const span = new Span(1);
            if (para.spans.length > 0) { // 正常是要有的！
                const copy = para.spans[0];
                mergeSpanAttr(span, copy);
            }
            if (attr) mergeSpanAttr(span, attr, true);
            const _spans = new BasicArray<Span>(span);
            const _para = new Para(_text, _spans);
            if (!paraAttr || propType === 'simple') mergeParaAttr(_para, para);
            if (paraAttr) mergeParaAttr(_para, paraAttr);
            paraArray.splice(paraIndex, 0, _para); // 前插入
            paraIndex++;
            // para 保持
            // index 继续0
        }
        else if (index < para.length - 1) { // 分裂并插入'\n'
            // split para
            const _text = para.text.slice(index)
            para.text = para.text.slice(0, index) + '\n';
            const spans = para.spans;
            // const _span = new Span(_text.length);
            const _spans = new BasicArray<Span>();
            for (let i = 0, len = spans.length, idx = index; i < len; i++) {
                const span = spans[i];
                if (idx === 0) {
                    _spans.push(...spans.splice(i, spans.length - i));
                    break;
                }
                if (idx < span.length) {
                    const _span = new Span(span.length - idx)
                    mergeSpanAttr(_span, span);
                    span.length = idx;
                    _spans.push(_span);
                    _spans.push(...spans.splice(i + 1, spans.length - i - 1))
                    break;
                }
                if (i === len - 1) { // 原数据有错？
                    const _span = new Span(_text.length)
                    mergeSpanAttr(_span, span);
                    _spans.push(_span);
                    break;
                }
                idx -= span.length;
            }
            const lastSpan = spans[spans.length - 1];
            if (!lastSpan.placeholder) {
                lastSpan.length++;// '\n'
            }
            else {
                const _span = new Span(1);
                mergeSpanAttr(_span, lastSpan);
                spans.push(_span);
            }

            const _para = new Para(_text, _spans);
            if (!paraAttr || propType === 'simple') mergeParaAttr(_para, para);
            if (paraAttr) mergeParaAttr(_para, paraAttr);
            paraArray.splice(paraIndex + 1, 0, _para);
            paraIndex++;
            para = _para; // 后插入，更换para
            index = 0;
        }
        else { // 回车前插入回车
            // new para
            // 找到'\n'的属性
            const spans = para.spans;
            let copyspanoffset = Math.max(para.length - 2, 0); // 用最后个可见字符的属性
            // 一般是最后一个
            let copyspan: Span | undefined;
            for (let nlspanindex = 0; nlspanindex < spans.length; nlspanindex++) {
                const span = spans[nlspanindex];
                if (copyspanoffset < span.length) {
                    copyspan = span;
                    break;
                }
                copyspanoffset -= span.length;
            }
            if (!copyspan && para.spans.length > 0) {
                copyspan = para.spans[para.spans.length - 1];
            }

            const _text = '\n';
            const span = new Span(1);
            if (copyspan) mergeSpanAttr(span, copyspan);
            // if (attr) mergeSpanAttr(span, attr);
            const _spans = new BasicArray<Span>(span);
            const _para = new Para(_text, _spans);
            if (!paraAttr || propType === 'simple') mergeParaAttr(_para, para);

            if (attr) { // 给para的'\n'设置上
                mergeSpanAttr(span, attr, true);
            }
            if (paraAttr) {
                mergeParaAttr(_para, paraAttr);
            }
            paraArray.splice(paraIndex + 1, 0, _para);
            paraIndex++;
            para = _para;
            index = 0;
        }

        newParaIndex = text.indexOf('\n');
        if (newParaIndex < 0) {
            __insertText(para, text, index, propType, attr);
            break;
        }
    }
}

export function insertSimpleText(shapetext: Text, text: string, index: number, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
    return _insertPropText(shapetext, text, index, "simple", props);
}

function _insertPropText(shapetext: Text, text: string, index: number, propType: "complex" | "simple", props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
    // 定位index
    // const shapetext = shape.text;
    const paras = shapetext.paras;
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        if (index < p.length) {
            _insertText(paras, i, p, text, index, propType, props);
            break;
        }
        else if (i === len - 1) { // 不兼容，方便与排版同步。由外面判断好index再插入
            // _insertText(paras, i, p, text, p.length - 1, props);
            // console.error("index outside text's range")
            // break;
            throw new Error("index outside text's range");
        }
        else {
            index -= p.length;
        }
    }
}

function insertTextParas(shapetext: Text, paras: Para[], index: number, type: "complex" | "simple",) {
    if (paras.length === 0) return;

    for (let i = 0, len = paras.length; i < len; i++) {
        const para = paras[i];
        const spans = para.spans;
        let idx = 0;
        for (let j = 0, spanlen = spans.length; j < spanlen; j++) {
            const span = spans[j];
            const text = para.text.slice(idx, idx + span.length);
            _insertPropText(shapetext, text, index + idx, type, { attr: span, paraAttr: para.attr });
            idx += text.length; // span有可能错？
        }
        if (idx < para.length) {
            const text = para.text.slice(idx);
            _insertPropText(shapetext, text, index + idx, type, { paraAttr: para.attr });
        }
        index += para.length;
    }
}

export function insertComplexText(shapetext: Text, text: Text, index: number) {
    if (shapetext.paras.length === 1 && shapetext.paras[0].length === 1 && text.attr) { // empty
        mergeTextAttr(shapetext, text.attr);
    }
    insertTextParas(shapetext, text.paras, index, "complex");
}

function __formatTextSpan(spans: Span[], spanIndex: number, index: number, length: number, key: string, value: any, offset: number): { index: number, len: number, value: any }[] {
    const ret: { index: number, len: number, value: any }[] = [];
    while (length > 0 && spanIndex < spans.length) {
        const span = spans[spanIndex];
        if (index > 0) {
            // split span
            const span1 = new Span(span.length - index);
            mergeSpanAttr(span1, span);
            span.length = index;
            spans.splice(spanIndex + 1, 0, span1);
            offset += span.length;
            index = 0;
            spanIndex++;
            continue;
        }
        if (length < span.length) {
            // split span
            const span1 = new Span(span.length - length);
            mergeSpanAttr(span1, span);
            span.length = length;
            spans.splice(spanIndex + 1, 0, span1);
            continue;
        }
        // index === 0 && span.length <= length

        // save origin
        ret.push({ index: index + offset, len: span.length, value: (span as any)[key] });
        (span as any)[key] = value;
        // mergeSpanAttr(span, attr);
        offset += span.length;
        length -= span.length;
        if (spanIndex > 0 && !isDiffSpanAttr(span, spans[spanIndex - 1])) { // merge same span
            const preSpan = spans[spanIndex - 1];
            preSpan.length += span.length;
            spans.splice(spanIndex, 1);
            continue;
        }
        spanIndex++;
        continue;
    }
    return ret;
}

function _formatTextSpan(para: Para, index: number, length: number, key: string, value: any, offset: number): { index: number, len: number, value: any }[] {
    // 定位到span
    const spans: Span[] = para.spans;
    let spanLen = 0
    for (let i = 0, len = spans.length; i < len; i++) {
        const span = spans[i];
        if (index < span.length) {
            return __formatTextSpan(spans, i, index, length, key, value, offset);
        }
        else {
            offset += span.length;
            index -= span.length;
            spanLen += span.length;
        }
    }
    // fix
    if (spanLen < para.length) {
        const span = spans[spans.length - 1]
        offset -= span.length;
        index += span.length;

        span.length += para.length - spanLen;
        if (index < span.length) {
            return __formatTextSpan(spans, spans.length - 1, index, length, key, value, offset);
        }
    }

    return [];
}

export function formatText(shapetext: Text, index: number, length: number, key: string, value: any): { index: number, len: number, value: any }[] {
    const ret: { index: number, len: number, value: any }[] = [];
    let offset = index;
    _travelTextPara(shapetext.paras, index, length, (paraArray, paraIndex, para, index, length) => {
        offset -= index;
        ret.push(..._formatTextSpan(para, index, length, key, value, offset));
        offset += para.length;
    })
    return ret;
}

export function formatPara(shapetext: Text, index: number, length: number, key: string, value: any): { index: number, len: number, value: any }[] {
    const ret: { index: number, len: number, value: any }[] = [];
    let offset = index;
    // todo layout by padding
    _travelTextPara(shapetext.paras, index, length, (paraArray, paraIndex, para, index, length) => {
        offset -= index;
        const end = Math.min(para.length, index + length);
        ret.push({ index: index + offset, len: end - index, value: (para.attr ? (para.attr as any)[key] : undefined) });
        if (!para.attr) para.attr = new ParaAttr();
        (para.attr as any)[key] = value;
        offset += para.length;
    })
    return ret;
}

function _deleteSpan(spans: Span[], index: number, count: number): BasicArray<Span> {
    const delspans: BasicArray<Span> = new BasicArray();
    for (let i = 0; i < spans.length && count > 0;) {
        const span = spans[i];
        if (index < span.length) {
            if (index === 0 && count >= span.length) {
                delspans.push(importSpan(span));
                spans.splice(i, 1);
                // i,index 不变
                count -= span.length;
                continue;
            }
            const delCount = Math.min(span.length - index, count);
            span.length -= delCount;
            count -= delCount;
            index = 0;
            i++;
            const delspan = importSpan(span);
            delspan.length = delCount;
            delspans.push(delspan);
        }
        else {
            index -= span.length;
            i++;
        }
    }
    return delspans;
}

function mergePara(para: Para, nextpara: Para) {
    para.text += nextpara.text;
    const spans = para.spans;
    const lastspanIdx = spans.length - 1;
    spans.push(...nextpara.spans.map((s) => importSpan(s)));

    if (lastspanIdx >= 0 && (spans.length - 1 > lastspanIdx)) {
        const span1 = spans[lastspanIdx];
        const span2 = spans[lastspanIdx + 1];
        if (!isDiffSpanAttr(span1, span2)) {
            span1.length += span2.length;
            spans.splice(lastspanIdx + 1, 1);
        }
    }
}

function _deleteText(paraArray: Para[], paraIndex: number, para: Para, index: number, count: number): Text {
    // fix count
    if (count > 0 &&
        paraIndex === (paraArray.length - 1) &&
        (index + count) >= para.length) {
        count = para.length - index - 1; // 不能删除最后一个回车
    }

    if (index + count <= para.length) { // 处理当前段就行
        // fix count
        let isDel0A = (index + count) === para.length;
        // if (isDel0A && paraIndex === (paraArray.length - 1)) {
        //     count--; // 不能删除最后一个回车
        //     isDel0A = false;
        // }
        const savetext = para.text.slice(index, index + count);
        para.text = para.text.slice(0, index) + para.text.slice(index + count);
        const delspans = _deleteSpan(para.spans, index, count);

        const para1 = new Para(savetext, delspans);
        mergeParaAttr(para1, para);
        const ret = new Text(new BasicArray<Para>());
        ret.paras.push(para1);
        // 如果删除了回车
        if (isDel0A) {
            // 不是最后一段
            // 合并两段
            const nextpara = paraArray[paraIndex + 1];
            paraArray.splice(paraIndex + 1, 1);
            mergePara(para, nextpara);
        }
        return ret;
    }

    // 删除后使用第一段的段落属性
    const saveParaProp = paraArray[paraIndex].attr;
    const ret = new Text(new BasicArray<Para>());
    // let deltext = "";
    // let delspans: Span[] = [];
    let needMerge = -1;
    if (index > 0) { // 第一段 // 这里至少有多段
        needMerge = paraIndex;
        const savelen = para.length;
        const deltext = para.text.slice(index);
        para.text = para.text.slice(0, index);
        const delspans = _deleteSpan(para.spans, index, count);
        count -= savelen - para.length;
        index = 0;
        paraIndex++;
        const para1 = new Para(deltext, delspans);
        mergeParaAttr(para1, para);
        ret.paras.push(para1);
    }

    let len = paraArray.length;
    // 整段删除
    while (count > 0 && paraIndex < len && len > 1) { // 不能删除光
        const para = paraArray[paraIndex];
        if (count >= para.length) {
            const deltext = para.text;
            const delspans = para.spans.slice(0) as BasicArray<Span>;
            paraArray.splice(paraIndex, 1);
            count -= para.length;
            len--;
            // paraIndex 不变
            const para1 = new Para(deltext, delspans.map((span) => importSpan(span)) as BasicArray<Span>); // 需要clone下
            mergeParaAttr(para1, para);
            ret.paras.push(para1);
            continue;
        }
        break;
    }

    // fix count
    para = paraArray[paraIndex];
    if (count > 0 &&
        paraIndex === (paraArray.length - 1) &&
        (index + count) >= para.length) {
        count = para.length - index - 1; // 不能删除最后一个回车
    }

    // 最后一段
    if (count > 0 && paraIndex < len) {
        para = paraArray[paraIndex];
        const deltext = para.text.slice(0, count);
        para.text = para.text.slice(count);
        const delspans = _deleteSpan(para.spans, 0, count);
        count -= para.text.length;

        const para1 = new Para(deltext, delspans);
        mergeParaAttr(para1, para);
        ret.paras.push(para1);
    }

    if (needMerge >= 0) {
        const para = paraArray[needMerge];
        const spans = para.spans;
        if (needMerge === paraArray.length - 1) {
            para.text += '\n'; // 补回'\n'
            if (spans.length > 0) spans[spans.length - 1].length++;
        }
        else {
            // 不是最后一段
            // 合并两段
            const nextpara = paraArray[needMerge + 1];
            paraArray.splice(needMerge + 1, 1);
            mergePara(para, nextpara);
        }
    } else {
        // 使用第一段的段落属性
        para = paraArray[paraIndex];
        if (saveParaProp !== para.attr) { // 都是undefined时是相等的
            if (!saveParaProp) {
                para.attr = undefined;
            } else {
                const attr = new ParaAttr();
                mergeParaAttr(attr, saveParaProp);
                para.attr = attr;
            }
        }
    }
    return ret;
}

export function deleteText(shapetext: Text, index: number, count: number): Text | undefined { // 返回删除的text及属性
    if (index < 0) {
        count += index;
        index = 0;
    }
    if (count <= 0) return;
    // const shapetext = shape.text;
    const paras = shapetext.paras;
    for (let i = 0, len = paras.length; i < len; i++) {
        let p = paras[i];
        if (index < p.length) {
            const text = _deleteText(paras, i, p, index, count);
            if (shapetext.attr) mergeTextAttr(text, shapetext.attr)
            return text;
        }
        else {
            index -= p.length;
        }
    }
}

export function setBulletNumbersType(shapetext: Text, type: BulletNumbersType, index: number, len: number): { index: number, len: number, value: BulletNumbersType | undefined }[] {
    const ret: { index: number, len: number, value: BulletNumbersType | undefined }[] = [];
    _travelTextPara(shapetext.paras, index, len, (paraArray, paraIndex, para, _index, length) => {
        index -= _index; // 对齐到0
        if (_index === 0 && para.text[0] === '*' && para.spans[0].bulletNumbers && para.spans[0].length === 1) {
            const cur = para.spans[0].bulletNumbers;
            if (cur.type !== type) {
                // fmt
                const origin = cur.type;
                cur.type = type;

                ret.push({ index, len: 1, value: origin })
            }
        }
        index += para.length;
    })
    return ret;
}

export function setBulletNumbersStart(shapetext: Text, start: number, index: number, len: number): { index: number, len: number, value: number }[] {
    const ret: { index: number, len: number, value: number }[] = [];
    _travelTextPara(shapetext.paras, index, len, (paraArray, paraIndex, para, _index, length) => {
        index -= _index; // 对齐到0
        if (_index === 0 && para.text[0] === '*' && para.spans[0].bulletNumbers && para.spans[0].length === 1) {
            const cur = para.spans[0].bulletNumbers;
            if (cur.offset !== start) {
                // fmt
                const origin = cur.offset || 0;
                cur.offset = start;
                ret.push({ index, len: 1, value: origin })
            }
        }
        index += para.length;
    })
    return ret;
}

export function setBulletNumbersBehavior(shapetext: Text, behavior: BulletNumbersBehavior, index: number, len: number): { index: number, len: number, value: BulletNumbersBehavior | undefined }[] {
    const ret: { index: number, len: number, value: BulletNumbersBehavior | undefined }[] = [];
    _travelTextPara(shapetext.paras, index, len, (paraArray, paraIndex, para, _index, length) => {
        index -= _index; // 对齐到0
        if (_index === 0 && para.text[0] === '*' && para.spans[0].bulletNumbers && para.spans[0].length === 1) {
            const cur = para.spans[0].bulletNumbers;
            if (cur.behavior !== behavior) {
                // fmt
                const origin = cur.behavior;
                cur.behavior = behavior;
                ret.push({ index, len: 1, value: origin })
            }
        }
        index += para.length;
    })
    return ret;
}

export function setParaIndent(shapetext: Text, indent: number | undefined, index: number, len: number): { index: number, len: number, value: number | undefined }[] {
    const ret: { index: number, len: number, value: number | undefined }[] = [];
    _travelTextPara(shapetext.paras, index, len, (paraArray, paraIndex, para, _index, length) => {
        index -= _index; // 对齐到0

        const origin = para.attr?.indent || 0;
        const cur = indent ?? 0;
        if (cur !== origin) {
            // fmt
            if (!para.attr) para.attr = new ParaAttr();
            para.attr.indent = indent;
            ret.push({ index, len: para.length, value: origin })
        }

        index += para.length;
    })
    return ret;
}