import { Text } from "./text";
import { Para, Span, SpanAttr, TextBehaviour, TextHorAlign, TextVerAlign } from "./text";
import { BasicArray } from "./basic"
import { ShapeFrame } from "./classes";

export interface IGraphy {
    char: string,
    metrics: TextMetrics | undefined,
    cw: number,
    ch: number,
    index: number,
    x: number
}

export class GraphArray extends Array<IGraphy> {
    public attr: SpanAttr | undefined;
    get graphCount() {
        return this.length;
    }
}
export class Line extends Array<GraphArray> {
    public maxFontSize: number = 0;
    public y: number = 0;
    public lineHeight: number = 0;
    public lineWidth: number = 0;
    public graphCount: number = 0;
}
export type LineArray = Array<Line>

export class ParaLayout extends Array<Line> {
    public paraHeight: number = 0;
    public graphCount: number = 0;
}

export class TextLayout {
    public yOffset: number = 0;
    public paras: ParaLayout[] = [];
    public contentHeight: number = 0;
    public contentWidth: number = 0;
}

export function adjustLines(lineArray: LineArray, align: TextHorAlign) {
    // TODO
}

export function adjustLinesVertical(lines: LineArray, align: TextVerAlign) {

}

export type MeasureFun = (code: number, font: string) => TextMetrics | undefined;

export function layoutLines(para: Para, width: number, measure: MeasureFun): LineArray {
    let spans = para.spans;
    let spansCount = spans.length;
    if (spansCount === 0) {
        if (para.length === 0) {
            return [];
        }
        spansCount = 1;
        spans = new BasicArray<Span>(new Span(para.length)); // fix
    }
    // const frame = shape.frame;
    // const width = frame.width;
    const charSpace = para.attr?.kerning ?? 0;

    const text = para.text;
    let textIdx = 0
    const textLen = text.length

    let spanIdx = 0, spanOffset = 0
    let span = spans[spanIdx];
    let font = "normal " + span.fontSize + "px " + span.fontName;

    const startX = 0, endX = startX + width;
    let curX = 0

    let graphArray: GraphArray | undefined;
    let line: Line = new Line();
    line.maxFontSize = span.fontSize ?? 0;
    const lineArray: LineArray = [];

    let preSpanIdx = spanIdx;

    for (; textIdx < textLen;) {
        if (spanIdx >= spansCount) spanIdx = spansCount - 1; // fix

        if (preSpanIdx !== spanIdx) {
            span = spans[spanIdx];
            font = "normal " + span.fontSize + "px " + span.fontName;
        }

        const c = text.charCodeAt(textIdx);
        if (c === 0x0A) {
            // '\n'
            if (!graphArray) {
                graphArray = new GraphArray();
                graphArray.attr = span;
            }
            graphArray.push({
                char: '\n',
                metrics: undefined,
                cw: 0, // ?
                ch: span.fontSize ?? 0,
                index: textIdx,
                x: curX
            });
            textIdx++;
            spanOffset++;
            if (spanOffset >= span.length) {
                spanOffset = 0;
                spanIdx++;
            }
            if (preSpanIdx !== spanIdx) {
                line.maxFontSize = Math.max(line.maxFontSize, span.fontSize ?? 0)
            }

            line.push(graphArray);
            line.graphCount += graphArray.length;
            graphArray = undefined; //new GraphArray();
            lineArray.push(line);
            line = new Line();
            if (preSpanIdx === spanIdx || spanIdx >= spansCount) {
                line.maxFontSize = span.fontSize ?? 0;
            }

            preSpanIdx = spanIdx;
            continue;
        }
        const m = measure(c, font);
        const cw = m?.width ?? 0;
        const ch = span.fontSize ?? 0;

        if (cw + curX + charSpace <= endX) {
            if (!graphArray) {
                graphArray = new GraphArray();
                graphArray.attr = span;
            }
            graphArray.push({
                char: text.at(textIdx) as string,
                metrics: m,
                cw,
                ch,
                index: textIdx,
                x: curX
            });

            curX += cw + charSpace;
            textIdx++;
            spanOffset++;
            if (spanOffset >= span.length) {
                spanOffset = 0;
                spanIdx++;
                line.push(graphArray);
                line.graphCount += graphArray.length;
                graphArray = undefined;
            }
            if (preSpanIdx !== spanIdx || spanIdx >= spansCount) {
                line.maxFontSize = Math.max(line.maxFontSize, span.fontSize ?? 0)
            }
        }
        else if (line.length === 0 && (!graphArray || graphArray.length === 0)) {
            if (!graphArray) {
                graphArray = new GraphArray();
                graphArray.attr = span;
            }
            graphArray.push({
                char: text.at(textIdx) as string,
                metrics: m,
                cw,
                ch,
                index: textIdx,
                x: curX
            });

            line.maxFontSize = span.fontSize ?? 0;
            line.push(graphArray);
            line.graphCount += graphArray.length;
            graphArray = undefined;
            lineArray.push(line);
            line = new Line();

            curX = startX;
            textIdx++;
            spanOffset++;
            if (spanOffset >= span.length) {
                spanOffset = 0;
                spanIdx++;
                if (spanIdx >= spansCount) line.maxFontSize = span.fontSize ?? 0;
            }
            else {
                line.maxFontSize = span.fontSize ?? 0;
            }
        }
        else {
            if (graphArray) {
                line.push(graphArray);
                line.graphCount += graphArray.length;
            }

            graphArray = new GraphArray();
            graphArray.attr = span;
            lineArray.push(line);
            line = new Line();
            line.maxFontSize = span.fontSize ?? 0;

            curX = startX;
            graphArray.push({
                char: text.at(textIdx) as string,
                metrics: m,
                cw,
                ch,
                index: textIdx,
                x: curX
            });

            curX += cw + charSpace;
            textIdx++;
            spanOffset++;
            if (spanOffset >= span.length) {
                spanOffset = 0;
                spanIdx++;
                line.push(graphArray);
                line.graphCount += graphArray.length;
                graphArray = undefined;
            }
        }
        preSpanIdx = spanIdx;
    }

    if (graphArray && graphArray.length > 0) {
        line.push(graphArray);
        line.graphCount += graphArray.length;
    }
    if (line.length > 0) {
        lineArray.push(line);
    }

    return lineArray;
}

export function layoutText(text: Text, layoutWidth: number, layoutHeight: number, measure: MeasureFun): TextLayout {
    // const layoutWidth = ((b: TextBehaviour) => {
    //     switch (b) {
    //         case TextBehaviour.Flexible: return Number.MAX_VALUE;
    //         case TextBehaviour.Fixed: return frame.width;
    //         case TextBehaviour.FixWidthAndHeight: return frame.width;
    //     }
    //     // return Number.MAX_VALUE
    // })(text.attr?.textBehaviour ?? TextBehaviour.Flexible)

    const paras: ParaLayout[] = []
    let contentHeight = 0;
    let contentWidth = 0;
    for (let i = 0, pc = text.paras.length; i < pc; i++) {
        const para = text.paras[i];
        const layouts = layoutLines(para, layoutWidth, measure);
        const pAttr = para.attr;
        let paraHeight = 0;
        let graphCount = 0;
        const lines = layouts.map((line) => {
            let lineHeight = pAttr && pAttr.minimumLineHeight || 0;
            if (pAttr && pAttr.maximumLineHeight === pAttr.minimumLineHeight) {
                lineHeight = pAttr.minimumLineHeight || 0;
            }
            else {
                lineHeight = line.maxFontSize;
            }
            const y = contentHeight;
            contentHeight += lineHeight;
            paraHeight += lineHeight;
            graphCount += line.graphCount;

            line.y = y;
            line.lineHeight = lineHeight;
            // return {y, line, lineHeight}

            const lastspan = line[line.length - 1];
            const lastgraph = lastspan[lastspan.length - 1];
            line.lineWidth = lastgraph.x + lastgraph.cw;

            contentWidth = Math.max(line.lineWidth, contentWidth);
            return line;
        })
        const paraLayout = new ParaLayout(...lines);
        paraLayout.paraHeight = paraHeight;
        paraLayout.graphCount = graphCount;

        paras.push(paraLayout);
    }

    const vAlign = text.attr?.verAlign ?? TextVerAlign.Top;
    const yOffset: number = ((align: TextVerAlign) => {
        switch (align) {
            case TextVerAlign.Top: return 0;
            case TextVerAlign.Middle: return (layoutHeight - contentHeight) / 2;
            case TextVerAlign.Bottom: return layoutHeight - contentHeight;
        }
    })(vAlign);
    return { yOffset, paras, contentHeight, contentWidth }
}

export function locateText(layout: TextLayout, x: number, y: number): { index: number, before: boolean } {
    const { yOffset, paras } = layout;
    // index line
    if (y < yOffset) return { index: 0, before: false };
    y -= yOffset;
    let index = 0;
    let before = false; // 在行尾时为true
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        if (y >= p.paraHeight) {
            y -= p.paraHeight;
            index += p.graphCount;
            continue;
        }
        // index line
        for (let i = 0, len = p.length; i < len; i++) {
            const line = p[i];
            if (y >= line.lineHeight) {
                y -= line.lineHeight;
                index += line.graphCount;
                continue;
            }
            // index span
            for (let i = 0, len = line.length; i < len; i++) {
                const span = line[i];
                if (span.length === 0) {
                    throw new Error("layout result error, graph array is empty")
                }
                const lastGraph = span[span.length - 1];
                if (x >= (lastGraph.x + lastGraph.cw)) {
                    index += span.graphCount;
                    if (i === len - 1) {
                        // before = true;
                        if (lastGraph.char === '\n') index--; // 忽略回车
                        else before = true;
                    }
                    continue;
                }
                // index graph
                // 二分查找
                let start = 0, end = span.length - 1;
                let mid = Math.floor((start + end) / 2);
                while (start < end) {
                    const graph = span[mid];
                    if (x < (graph.x + graph.cw)) {
                        end = mid;
                    }
                    else {
                        start = mid + 1;
                    }
                    mid = Math.floor((start + end) / 2);
                }
                // get end
                const endgraph = span[end];
                if (endgraph.char === '\n') {
                    end--;
                }
                else if (x > endgraph.x + endgraph.cw / 2) {
                    end++; // 修正鼠标位置
                }
                if (i === len - 1 && end === span.length) {
                    before = true;
                }
                index += end;
                break;
            }
            break;
        }
        break;
    }
    return { index, before };
}


export function locateCursor(layout: TextLayout, index: number, cursorAtBefore: boolean): { x: number, y: number }[] {
    if (index < 0) return [];

    const paras = layout.paras;
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        if (!(index < p.graphCount || (cursorAtBefore && index === p.graphCount))) {
            index -= p.graphCount;
            continue;
        }

        for (let i = 0, len = p.length; i < len; i++) {
            const line = p[i];
            if ((cursorAtBefore && index === line.graphCount)) {
                if (line.length === 0) break; // error
                const span = line[line.length - 1];
                if (span.length === 0) break; // error
                const graph = span[span.length - 1];
                const y = line.y + (line.lineHeight - graph.ch) / 2;
                const x = graph.x + graph.cw;
                const p0 = { x, y };
                const p1 = { x, y: y + graph.ch };
                return [p0, p1]
            }
            if (index >= line.graphCount) {
                index -= line.graphCount;
                continue;
            }

            for (let i = 0, len = line.length; i < len; i++) {
                const span = line[i];
                if (index >= span.graphCount) {
                    index -= span.graphCount;
                    continue;
                }

                const graph = span[index];
                const y = line.y + (line.lineHeight - graph.ch) / 2;
                const x = graph.x;
                const p0 = { x, y };
                const p1 = { x, y: y + graph.ch };
                return [p0, p1]
            }
            break;
        }
        break;
    }
    return [];
}

function _locateRange(layout: TextLayout, pi: number, li: number, si: number, gi: number, count: number): { x: number, y: number }[] {

    const points: { x: number, y: number }[] = [];

    const paras = layout.paras;
    while (count > 0 && pi < paras.length) {
        const p = paras[pi];
        const line = p[li];

        if (si === 0 && gi === 0 && line.graphCount <= count) { // 整行
            const y = line.y;
            const h = line.lineHeight;

            const span0 = line[0];
            const span1 = line[line.length - 1];
            const graph0 = span0[0];
            const graph1 = span1[span1.length - 1];
            const x = graph0.x;
            const w = graph1.x + graph1.cw - x;

            points.push(
                { x, y }, // left top
                { x: x + w, y }, // right top
                { x: x + w, y: y + h }, // right bottom
                { x, y: y + h }, // left bottom
            );

            count -= line.graphCount;
            li++;
            if (li >= p.length) {
                pi++;
                li = 0;
            }
            continue;
        }

        const span = line[si];
        const graph = span[gi];
        const minX = graph.x;
        const minY = line.y; // + (line.lineHeight - graph.ch) / 2;
        const maxY = line.y + line.lineHeight;
        let maxX = graph.x + graph.cw;

        for (let i = si, len = line.length; i < len && count > 0; i++) {
            const span = line[i];

            const last = Math.min(span.length - 1, gi + count - 1);
            const graph = span[last]; // 同一span里的字符都有相同的大小属性,取最后一个就行

            maxX = graph.x + graph.cw;

            // const y = line.y + (line.lineHeight - graph.ch) / 2;
            // if (minY > y) minY = y;

            count -= (last - gi + 1);
            gi = 0;
        }

        points.push(
            { x: minX, y: minY }, // left top
            { x: maxX, y: minY }, // right top
            { x: maxX, y: maxY }, // right bottom
            { x: minX, y: maxY }, // left bottom
        )

        si = 0;
        li++;
        if (li >= p.length) {
            pi++;
            li = 0;
        }
    }

    return points;
}

export function locateRange(layout: TextLayout, start: number, end: number): { x: number, y: number }[] {
    if (end < start) {
        const tmp = start;
        start = end;
        end = tmp;
    }
    if (start < 0) start = 0;
    if (end <= start) return [];
    const count = end - start;

    const paras = layout.paras;
    for (let pi = 0, len = paras.length; pi < len; pi++) {
        const p = paras[pi];
        if (start >= p.graphCount) {
            start -= p.graphCount;
            continue;
        }

        for (let li = 0, len = p.length; li < len; li++) {
            const line = p[li];

            if (start >= line.graphCount) {
                start -= line.length;
                continue;
            }

            for (let si = 0, len = line.length; si < len; si++) {
                const span = line[si];
                if (start >= span.length) {
                    start -= span.length;
                    continue;
                }
                const gi = start;
                return _locateRange(layout, pi, li, si, gi, count);
            }
            break;
        }
        break;
    }
    return [];
}