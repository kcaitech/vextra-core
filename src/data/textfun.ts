import { importParaAttr, importTextAttr } from "../io/baseimport";
import { Color } from "./baseclasses";
import { BasicArray } from "./basic";
import { Para, Span, SpanAttr, ParaAttr, Text, TextAttr, SpanAttrSetter, ParaAttrSetter } from "./text";

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
    const attrIsSetter = attr instanceof SpanAttrSetter;
    let changed = false;
    if (attr.color) {
        if (!span.color ||
            attr.color.alpha !== span.color.alpha ||
            attr.color.red !== span.color.red ||
            attr.color.green !== span.color.green ||
            attr.color.blue !== span.color.blue) {
            span.color = new Color(attr.color.alpha, attr.color.red, attr.color.green, attr.color.blue)
            changed = true;
        }
    } else if (attrIsSetter && span.color) {
        span.color = undefined;
        changed = true;
    }

    if (attr.fontName) {
        if (!span.fontName || attr.fontName !== span.fontName) {
            span.fontName = attr.fontName;
            changed = true;
        }
    } else if (attrIsSetter && span.fontName) {
        span.fontName = undefined;
        changed = true;
    }

    if (attr.fontSize) {
        if (!span.fontSize || attr.fontSize !== span.fontSize) {
            span.fontSize = attr.fontSize;
            changed = true;
        }
    } else if (attrIsSetter && span.fontSize) {
        span.fontSize = undefined;
        changed = true;
    }

    return changed;
}

function mergeParaAttr(para: Para, attr: ParaAttr): boolean {
    if (!para.attr) {
        para.attr = importParaAttr(attr); // deep clone
        return true;
    }
    return _mergeParaAttr(para.attr, attr);
}

function _mergeParaAttr(paraAttr: ParaAttr, attr: ParaAttr): boolean {
    const attrIsSetter = attr instanceof ParaAttrSetter;
    let changed = false;
    if (attr.color) {
        if (!paraAttr.color ||
            attr.color.alpha !== paraAttr.color.alpha ||
            attr.color.red !== paraAttr.color.red ||
            attr.color.green !== paraAttr.color.green ||
            attr.color.blue !== paraAttr.color.blue) {
            paraAttr.color = new Color(attr.color.alpha, attr.color.red, attr.color.green, attr.color.blue)
            changed = true;
        }
    } else if (attrIsSetter && paraAttr.color) {
        paraAttr.color = undefined;
        changed = true;
    }

    if (attr.fontName) {
        if (!paraAttr.fontName || attr.fontName !== paraAttr.fontName) {
            paraAttr.fontName = attr.fontName;
            changed = true;
        }
    } else if (attrIsSetter && paraAttr.fontName) {
        paraAttr.fontName = undefined;
        changed = true;
    }

    if (attr.fontSize) {
        if (!paraAttr.fontSize || attr.fontSize !== paraAttr.fontSize) {
            paraAttr.fontSize = attr.fontSize;
            changed = true;
        }
    } else if (attrIsSetter && paraAttr.fontSize) {
        paraAttr.fontSize = undefined;
        changed = true;
    }
    return changed;
}

function _insertText(paraArray: Para[], paraIndex: number, para: Para, text: string, index: number, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
    const attr = props && props.attr;
    const paraAttr = props && props.paraAttr;
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
            if (paraAttr) mergeParaAttr(_para, paraAttr);
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
            if (paraAttr) mergeParaAttr(para, paraAttr);
            const _para = new Para(_text, _spans);
            paraArray.splice(paraIndex + 1, 0, _para);
            para = _para;
            index = 0;
        }
        else { // 回车前插入回车
            if (paraAttr) mergeParaAttr(para, paraAttr);
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

export function insertSimpleText(shapetext: Text, text: string, index: number, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
    // 定位index
    // const shapetext = shape.text;
    const paras = shapetext.paras;
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        if (index < p.length) {
            _insertText(paras, i, p, text, index, props);
            break;
        }
        else if (i === len - 1) {
            _insertText(paras, i, p, text, p.length - 1, props);
            break;
        }
        else {
            index -= p.length;
        }
    }
}

function insertTextParas(shapetext: Text, paras: Para[], index: number) {
    if (paras.length === 0) return;

    for (let i = 0, len = paras.length; i < len; i++) {
        const para = paras[i];
        const spans = para.spans;
        let idx = 0;
        for (let j = 0, spanlen = spans.length; j < spanlen; j++) {
            const span = spans[j];
            const text = para.text.slice(idx, idx + span.length);
            insertSimpleText(shapetext, text, index + idx, { attr: span, paraAttr: para.attr });
            idx += span.length;
        }
        if (idx < para.length) {
            const text = para.text.slice(idx);
            insertSimpleText(shapetext, text, index + idx);
        }
        index += para.length;
    }
}

function mergeTextAttr(text: Text, attr: TextAttr) {
    if (!text.attr) {
        text.attr = importTextAttr(attr);
        return;
    }
    _mergeParaAttr(text.attr, attr);
    if (attr.verAlign) text.attr.verAlign = attr.verAlign;
    if (attr.orientation) text.attr.orientation = attr.orientation;
    if (attr.textBehaviour) text.attr.textBehaviour = attr.textBehaviour;
}

export function insertComplexText(shapetext: Text, text: Text, index: number) {
    if (shapetext.length === 1 && text.attr) { // empty
        mergeTextAttr(shapetext, text.attr);
    }
    insertTextParas(shapetext, text.paras, index);
}

function __formatTextSpan(spans: Span[], spanIndex: number, index: number, length: number, attr: SpanAttr): Span[] {
    const ret: Span[] = [];
    while (length > 0 && spanIndex < spans.length) {
        const span = spans[spanIndex];
        if (index > 0) {
            // split span
            const span1 = new Span(span.length - index);
            mergeSpanAttr(span1, span);
            span.length = index;
            spans.splice(spanIndex + 1, 0, span1);
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
        const span1 = new Span(span.length);
        mergeSpanAttr(span1, span);
        ret.push(span1);

        mergeSpanAttr(span, attr);
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

function _formatTextSpan(spans: Span[], index: number, length: number, attr: SpanAttr): Span[] {
    // 定位到span
    for (let i = 0, len = spans.length; i < len; i++) {
        const span = spans[i];
        if (index < span.length) {
            return __formatTextSpan(spans, i, index, length, attr);
        }
        else {
            index -= span.length;
        }
    }
    return [];
}

function _formatText(paraArray: Para[], paraIndex: number, index: number, length: number, props: { attr?: SpanAttrSetter, paraAttr?: ParaAttrSetter }): { spans: Span[], paras: (ParaAttr & { length: number })[] } {
    const ret: { spans: Span[], paras: (ParaAttr & { length: number })[] } = { spans: [], paras: [] };
    while (length > 0 && paraIndex < paraArray.length) {
        const para = paraArray[index];
        if (props.paraAttr) {
            // save origin
            const para1 = new ParaAttr();
            if (para.attr) _mergeParaAttr(para1, para.attr);
            const end = Math.min(para.length, index + length);
            const origin: ParaAttr & { length: number } = para1 as ParaAttr & { length: number };
            origin.length = end - index;
            ret.paras.push(origin);

            mergeParaAttr(para, props.paraAttr);
        }

        if (props.attr) {
            _formatTextSpan(para.spans, index, length, props.attr)
        }

        length -= para.length - index;
        index = 0;
        paraIndex++;
    }
    return ret;
}

export function formatText(shapetext: Text, index: number, length: number, props: { attr?: SpanAttrSetter, paraAttr?: ParaAttrSetter }): { spans: Span[], paras: (ParaAttr & { length: number })[] } {
    // const shapetext = shape.text;
    const paras = shapetext.paras;
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        if (index < p.length) {
            return _formatText(paras, i, index, length, props);
        }
        else {
            index -= p.length;
        }
    }
    return { spans: [], paras: [] };
}

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

function _deleteSpan(spans: Span[], index: number, count: number): BasicArray<Span> {
    const delspans: BasicArray<Span> = new BasicArray();
    const saveCount = count;
    for (let i = 0, len = spans.length; i < len && count > 0;) {
        const span = spans[i];
        if (index < span.length) {
            if (index === 0 && count >= span.length) {
                delspans.push(span);
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
            const delspan = span.clone();
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

        // 如果删除了回车
        if (isDel0A) {
            // 不是最后一段
            // 合并两段
            const nextpara = paraArray[paraIndex + 1];
            paraArray.splice(paraIndex + 1, 1);
            mergePara(para, nextpara);
        }
        const para1 = new Para(savetext, delspans);
        mergeParaAttr(para1, para);
        const ret = new Text(new BasicArray<Para>());
        ret.paras.push(para1);
        return ret;
    }

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
            const para1 = new Para(deltext, delspans);
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
