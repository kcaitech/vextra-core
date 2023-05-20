import { Color } from "../data/baseclasses";
import { BasicArray } from "../data/basic";
import { TextShape } from "../data/shape";
import { Para, Span, SpanAttr } from "../data/text";

function isDiffSpanAttr(span: SpanAttr, attr: SpanAttr): boolean {
    if (attr.color) {
        if (!span.color) return true;
        // compare color
        const c1 = attr.color;
        const c2 = span.color;
        if (c1.alpha !== c2.alpha || c1.red != c2.red || c1.green !== c2.green || c1.blue !== c2.blue) {
            return true;
        }
    }
    else if (span.color) {
        return true;
    }
    if (attr.fontName !== attr.fontName) {
        return true;
    }
    if (attr.fontSize !== attr.fontSize) {
        return true;
    }
    return false;
}

function __insertText(para: Para, text: string, index: number, attr?: SpanAttr) {
    const spans = para.spans;
    para.text = para.text.slice(0, index) + text + para.text.slice(index);

    for (let count = 0, i = 0, len = spans.length, idx = index; i < len; i++) {
        const span = spans[i];
        count += span.length;
        if (idx === 0) {
            if (attr) {
                const _span = new Span(text.length);
                mergeSpanAttr(_span, attr);
                if (isDiffSpanAttr(span, _span)) {
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
                mergeSpanAttr(_span, attr);
                if (isDiffSpanAttr(span, _span)) {
                    // split
                    const _span2 = new Span(span.length - idx);
                    mergeSpanAttr(_span2, _span);
                    span.length = idx;
                    spans.splice(i + 1, 0, _span, _span2);
                    break;
                }
            }
            span.length += text.length;
            break;
        }
        if (idx === span.length) { // 优先继承前一个span属性
            if (attr) {
                const _span = new Span(text.length);
                mergeSpanAttr(_span, attr);
                if (isDiffSpanAttr(span, _span)) {
                    spans.splice(i + 1, 0, _span);
                    break;
                }
            }
            span.length += text.length;
            break;
        }
        if (i === len - 1) { // 原数据有错？
            if (attr) {
                const _span = new Span(text.length);
                mergeSpanAttr(_span, attr);
                if (isDiffSpanAttr(span, _span)) {
                    spans.splice(i + 1, 0, _span);
                    span.length += para.length - text.length - count; // fix
                    break;
                }
            }
            span.length += para.length - count;
            break;
        }
        idx -= span.length;
    }
}

function mergeSpanAttr(span: Span, attr: SpanAttr) {
    if (attr.color) {
        span.color = new Color(attr.color.alpha, attr.color.red, attr.color.green, attr.color.blue)
    }
    if (attr.fontName) {
        span.fontName = attr.fontName;
    }
    if (attr.fontSize) {
        span.fontSize = attr.fontSize;
    }
}

function _insertText(paraArray: Para[], paraIndex: number, para: Para, text: string, index: number, attr?: SpanAttr) {
    let newParaIndex = text.indexOf('\n');
    if (newParaIndex < 0) {
        __insertText(para, text, index, attr);
        return;
    }
    while (newParaIndex >= 0) {
        if (newParaIndex > 0) {
            const t = text.slice(0, newParaIndex);
            __insertText(para, t, index, attr);
            index += newParaIndex + 1;
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
            if (attr) mergeSpanAttr(span, attr);
            const _spans = new BasicArray<Span>(span);
            const _para = new Para(_text, _spans);
            paraArray.splice(paraIndex, 0, _para);
            paraIndex++;
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
            spans[spans.length - 1].length++; // '\n'
            const _para = new Para(_text, _spans);
            paraArray.splice(paraIndex + 1, 0, _para);
            para = _para;
            index = 0;
        }
        else { // 回车前插入回车
            // new para
            const _text = '\n';
            const span = new Span(1);
            if (para.spans.length > 0) { // 正常是要有的！
                const copy = para.spans[para.spans.length - 1];
                mergeSpanAttr(span, copy);
            }
            if (attr) mergeSpanAttr(span, attr);
            const _spans = new BasicArray<Span>(span);
            const _para = new Para(_text, _spans);
            paraArray.splice(paraIndex + 1, 0, _para);
            paraIndex++;
            para = _para;
            index = 0;
        }

        newParaIndex = text.indexOf('\n');
        if (newParaIndex < 0) {
            __insertText(para, text, index, attr);
            break;
        }
    }
}

export function insertText(shape: TextShape, text: string, index: number, attr?: SpanAttr) {
    // 定位index
    const shapetext = shape.text;
    const paras = shapetext.paras;
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        if (index < p.length) {
            _insertText(paras, i, p, text, index, attr);
            break;
        }
        else if (i === len - 1) {
            _insertText(paras, i, p, text, p.length - 1, attr);
            break;
        }
        else {
            index -= p.length;
        }
    }
}

function _deleteSpan(spans: Span[], index: number, count: number): number {
    const saveCount = count;
    for (let i = 0, len = spans.length; i < len && count > 0;) {
        const span = spans[i];
        if (index < span.length) {
            if (index === 0 && count >= span.length) {
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
        }
        else {
            index -= span.length;
            i++;
        }
    }
    return saveCount - count;
}

function mergePara(para: Para, nextpara: Para) {
    para.text += nextpara.text;
    const spans = para.spans;
    const lastspanIdx = spans.length - 1;
    spans.push(...nextpara.spans);

    if (lastspanIdx >= 0 && (spans.length - 1 > lastspanIdx)) {
        const span1 = spans[lastspanIdx];
        const span2 = spans[lastspanIdx + 1];
        if (!isDiffSpanAttr(span1, span2)) {
            span1.length += span2.length;
            spans.splice(lastspanIdx + 1, 1);
        }
    }
}

function _deleteText(paraArray: Para[], paraIndex: number, para: Para, index: number, count: number) {

    if (index + count <= para.length) { // 处理当前段就行
        let isDel0A = (index + count) === para.length;
        if (isDel0A && paraIndex === (paraArray.length - 1)) {
            count--; // 不能删除最后一个回车
            isDel0A = false;
        }

        para.text = para.text.slice(0, index) + para.text.slice(index + count);
        const spans = para.spans;
        _deleteSpan(spans, index, count);

        // 如果删除了回车
        if (isDel0A) {
            // 不是最后一段
            // 合并两段
            const nextpara = paraArray[paraIndex + 1];
            paraArray.splice(paraIndex + 1, 1);
            mergePara(para, nextpara);
        }
        return;
    }

    let needMerge = -1;
    if (index > 0) { // 第一段
        needMerge = paraIndex;
        para.text = para.text.slice(0, index);
        const spans = para.spans;
        count -= _deleteSpan(spans, index, count);
        index = 0;
        paraIndex++;
    }

    let len = paraArray.length;
    // 整段删除
    while (count > 0 && paraIndex < len) {
        const para = paraArray[paraIndex];
        if (count >= para.length) {
            paraArray.splice(paraIndex, 1);
            count -= para.length;
            len--;
            // paraIndex 不变
            continue;
        }
        break;
    }

    // 最后一段
    if (count > 0 && paraIndex < len) {
        para = paraArray[paraIndex];
        para.text = para.text.slice(count);
        const spans = para.spans;
        count -= _deleteSpan(spans, 0, count);
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
    }
}

export function deleteText(shape: TextShape, index: number, count: number) {
    if (index < 0) {
        count += index;
        index = 0;
    }
    if (count <= 0) return;
    const shapetext = shape.text;
    const paras = shapetext.paras;
    for (let i = 0, len = paras.length; i < len; i++) {
        let p = paras[i];
        if (index < p.length) {
            _deleteText(paras, i, p, index, count);
            break;
        }
        else {
            index -= p.length;
        }
    }
}

