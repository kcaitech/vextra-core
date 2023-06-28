import { Text } from "./text";
import { Para, Span, SpanAttr, TextHorAlign, TextVerAlign } from "./text";
import { BasicArray } from "./basic"

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
    public yOffset: number = 0;
    public paraWidth: number = 0;
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

export function layoutPara(para: Para, layoutWidth: number, measure: MeasureFun) {
    let paraWidth = 0;
    const layouts = layoutLines(para, layoutWidth, measure);
    const pAttr = para.attr;
    let paraHeight = 0;
    let graphCount = 0;
    const lines = layouts.map((line) => {
        let lineHeight = line.maxFontSize;
        if (pAttr && pAttr.maximumLineHeight != undefined) {
            lineHeight = Math.min(pAttr.maximumLineHeight, lineHeight)
        }
        if (pAttr && pAttr.minimumLineHeight != undefined) {
            lineHeight = Math.max(pAttr.minimumLineHeight, lineHeight);
        }
        const y = paraHeight;
        paraHeight += lineHeight;
        graphCount += line.graphCount;

        line.y = y;
        line.lineHeight = lineHeight;
        // return {y, line, lineHeight}

        const lastspan = line[line.length - 1];
        const lastgraph = lastspan[lastspan.length - 1];
        line.lineWidth = lastgraph.x + lastgraph.cw;

        paraWidth = Math.max(line.lineWidth, paraWidth);
        return line;
    })
    const paraLayout = new ParaLayout(...lines);
    paraLayout.paraHeight = paraHeight;
    paraLayout.graphCount = graphCount;
    paraLayout.paraWidth = paraWidth;

    return paraLayout;
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
        const paraLayout = layoutPara(para, layoutWidth, measure);
        paraLayout.yOffset = contentHeight;
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
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
