import { BulletNumbersType, Text, TextBehaviour } from "./text";
import { Para, Span, SpanAttr, TextHorAlign, TextVerAlign } from "./text";
import { BasicArray } from "./basic"
import { layoutBulletNumber } from "./textbnlayout";
import { transformText } from "./textlayouttransform";
import { gPal } from "../basic/pal";

const TAB_WIDTH = 28;
const INDENT_WIDTH = TAB_WIDTH;

export interface IGraphy {
    char: string, // 可能是多个字符，在项目符号编号中
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
    public x: number = 0;
    public y: number = 0;
    public lineHeight: number = 0;
    public lineWidth: number = 0; // adjust后的宽度

    public graphWidth: number = 0; // graph+kerning的宽度
    public graphCount: number = 0;

    public alignment: TextHorAlign = TextHorAlign.Left;
    public layoutWidth: number = 0;
}
export class LineArray extends Array<Line> {
    public bulletNumbers?: BulletNumbersLayout;
}

export class BulletNumbersLayout {
    public index: number = 0;
    public level: number = 0;
    public text: string = '';
    public type: BulletNumbersType = BulletNumbersType.None;
    public graph: IGraphy;
    constructor(graph: IGraphy) {
        this.graph = graph;
    }
}

export class ParaLayout extends Array<Line> {
    public paraHeight: number = 0;
    public graphCount: number = 0;
    public yOffset: number = 0;
    public paraWidth: number = 0;
    public bulletNumbers?: BulletNumbersLayout;
}

export class TextLayout {
    public xOffset: number = 0;
    public yOffset: number = 0;
    public paras: ParaLayout[] = [];
    public contentHeight: number = 0;
    public contentWidth: number = 0;
}

export function fixLineHorAlign(line: Line, align: TextHorAlign, width: number) {
    if (line.layoutWidth === width && line.alignment === align) return;
    if (line.alignment === TextHorAlign.Justified || line.alignment === TextHorAlign.Natural) {
        // revert to Left
        for (; ;) {

            const lastspan = line[line.length - 1];
            const lastgraph = lastspan[lastspan.length - 1];
            let firstGraph;
            let firstGArr
            if (line.length > 0) {
                firstGArr = line[0];
                firstGraph = firstGArr[0];
            }
            if (!firstGArr || !firstGraph) throw new Error("layout result wrong");

            let graphCount = line.graphCount;
            if (isNewLineCharCode(lastgraph.char.charCodeAt(0))) {
                graphCount--;
            }
            let ignoreFirst = false;
            if (firstGArr.length === 1 && firstGArr.attr?.placeholder) {
                graphCount--;
                ignoreFirst = true;
            }
            if (graphCount <= 1) break;

            const freeWidth = width - line.graphWidth - firstGraph.x;
            if (align === TextHorAlign.Natural) {
                const graphWidth = line.graphWidth / graphCount;
                if (freeWidth > graphWidth) break;
            }
            const padding = graphCount === 1 ? 0 : (freeWidth) / (graphCount - 1);

            let offset = 0;
            for (let i = ignoreFirst ? 1 : 0, len = line.length; i < len; i++) {
                const arr = line[i];
                for (let j = 0, len1 = arr.length; j < len1; j++) {
                    const graph = arr[j];
                    graph.x -= offset;
                    --graphCount;
                    if (graphCount > 0) offset += padding;
                }
            }
            break;
        }
    }

    adjustLineHorAlign(line, align, width);
}

function adjustLineHorAlign(line: Line, align: TextHorAlign, width: number) {

    switch (align) {
        case TextHorAlign.Left:
            {
                line.x = 0;
                break;
            }
        case TextHorAlign.Centered:
            {
                line.x = (width - line.graphWidth) / 2;
                break;
            }
        case TextHorAlign.Right:
            {
                let lastGraph;
                if (line.length > 0) {
                    const firstGArr = line[line.length - 1];
                    lastGraph = firstGArr[firstGArr.length - 1];
                }
                if (!lastGraph) throw new Error("layout result wrong");
                const offset = width - lastGraph.x - lastGraph.cw;
                line.x = offset;
                break;
            }
        case TextHorAlign.Natural:
        case TextHorAlign.Justified:
            {
                const lastspan = line[line.length - 1];
                const lastgraph = lastspan[lastspan.length - 1];

                line.x = 0;

                let firstGraph;
                let firstGArr
                if (line.length > 0) {
                    firstGArr = line[0];
                    firstGraph = firstGArr[0];
                }
                if (!firstGArr || !firstGraph) throw new Error("layout result wrong");

                let graphCount = line.graphCount;
                if (isNewLineCharCode(lastgraph.char.charCodeAt(0))) {
                    graphCount--;
                }
                // 项目符号编号不参与
                let ignoreFirst = false;
                if (firstGArr.length === 1 && firstGArr.attr?.placeholder) {
                    graphCount--;
                    ignoreFirst = true;
                }
                if (graphCount <= 1) break;
                const freeWidth = width - line.graphWidth - firstGraph.x;
                if (align === TextHorAlign.Natural) {
                    const graphWidth = line.graphWidth / graphCount;
                    if (freeWidth > graphWidth) break;
                }
                let offset = 0;
                const padding = graphCount === 1 ? 0 : (freeWidth) / (graphCount - 1);

                for (let i = ignoreFirst ? 1 : 0, len = line.length; i < len; i++) {
                    const arr = line[i];
                    for (let j = 0, len1 = arr.length; j < len1; j++) {
                        const graph = arr[j];
                        graph.x += offset;
                        --graphCount;
                        if (graphCount > 0) offset += padding;
                    }
                }
                break;
            }
    }

    line.alignment = align;
    line.layoutWidth = width;
}

export function isNewLineCharCode(code: number) {
    // U+0009: Horizontal tab
    // U+000A: Line feed
    // U+000B: Vertical tab
    // U+000C: Form feed
    // U+000D: Carriage return
    // U+0020: Space
    // U+00A0: Non-breaking space
    // U+2028: Line separator
    // U+2029: Paragraph separator
    switch (code) {
        case 0x0A:
        case 0x0D:
        case 0x2028:
        case 0x2029:
            return true;
    }
    return false;
}

export function layoutLines(_text: Text, para: Para, width: number, preBulletNumbers: BulletNumbersLayout[]): LineArray {
    const measure = gPal.text.textMeasure;
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
    const paraCharSpace = para.attr?.kerning ?? 0;

    const text = para.text;
    let textIdx = 0
    const textLen = text.length

    let spanIdx = 0, spanOffset = 0
    let span = spans[spanIdx];
    let font = "normal " + span.fontSize + "px " + span.fontName;

    const indent = (para.attr?.indent || 0) * INDENT_WIDTH;
    const startX = Math.min(indent, width), endX = width;
    let curX = startX;

    let graphArray: GraphArray | undefined;
    let line: Line = new Line();
    line.maxFontSize = span.fontSize ?? 0;
    const lineArray: LineArray = [];

    let preSpanIdx = spanIdx;

    const defaultTransform = (para.attr?.transform) ?? (_text.attr?.transform);

    for (; textIdx < textLen;) {
        if (spanIdx >= spansCount) spanIdx = spansCount - 1; // fix

        if (preSpanIdx !== spanIdx) {
            preSpanIdx = spanIdx;
            span = spans[spanIdx];
            font = "normal " + span.fontSize + "px " + span.fontName;
        }

        if (span.length === 0 && spanIdx < spansCount - 1) { // 不是最后一个空的span
            spanIdx++;
            continue;
        }

        const c = text.charCodeAt(textIdx);
        if (isNewLineCharCode(c)) {
            // '\n'
            if (!graphArray) {
                graphArray = new GraphArray();
                graphArray.attr = span;
            }

            let preGraph;
            if (graphArray.length > 0) {
                preGraph = graphArray[graphArray.length - 1];
            }
            else if (line.length > 0) {
                const preGArr = line[line.length - 1];
                preGraph = preGArr[preGArr.length - 1];
            }
            if (preGraph) {
                curX = preGraph.x + preGraph.cw;
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
            if (line.length === 0 && graphArray.length === 1) { // 回车换行，如果不是空行不计算行高
                line.maxFontSize = Math.max(line.maxFontSize, span.fontSize ?? 0)
            }

            line.push(graphArray);
            line.graphCount += graphArray.length;
            graphArray = undefined; //new GraphArray();
            lineArray.push(line);
            line = new Line();
            curX = startX;
            // if (preSpanIdx === spanIdx || spanIdx >= spansCount) {
            //     line.maxFontSize = span.fontSize ?? 0;
            // }
            continue;
        }

        const charSpace = span.kerning ?? paraCharSpace;
        if (spanIdx === 0 &&
            c === 0x2A &&
            span.placeholder &&
            span.length === 1 &&
            span.bulletNumbers) { // '*' 项目符号编号
            const layout = layoutBulletNumber(para, span, span.bulletNumbers, preBulletNumbers);
            layout.graph.x += curX;

            if (!graphArray) {
                graphArray = new GraphArray();
                graphArray.attr = span;
            }

            graphArray.push(layout.graph);
            curX = layout.graph.x + layout.graph.cw + charSpace;
            textIdx++;
            spanOffset++;
            if (spanOffset >= span.length) {
                spanOffset = 0;
                spanIdx++;
                line.push(graphArray);
                line.graphCount += graphArray.length;
                graphArray = undefined;
            }
            line.maxFontSize = Math.max(line.maxFontSize, span.fontSize ?? 0)

            lineArray.bulletNumbers = layout;
            continue;
        }

        // todo tab 不对
        // indent 未处理
        const transformType = span.transform ?? defaultTransform;
        const char = transformText(text.charAt(textIdx), textIdx === 0 || (textIdx === 1 && !!lineArray.bulletNumbers), transformType);

        const m = measure(char.charCodeAt(0), font);
        const cw = m?.width ?? 0;
        const ch = span.fontSize ?? 0;


        if (cw + curX <= endX) { // cw + curX + charSpace <= endX,兼容sketch
            if (!graphArray) {
                graphArray = new GraphArray();
                graphArray.attr = span;
            }
            graphArray.push({
                char,
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
            // if (preSpanIdx !== spanIdx || spanIdx >= spansCount) {
            line.maxFontSize = Math.max(line.maxFontSize, span.fontSize ?? 0)
            // }
        }
        else if (line.length === 0 && (!graphArray || graphArray.length === 0)) { // 至少一个字符
            if (!graphArray) {
                graphArray = new GraphArray();
                graphArray.attr = span;
            }
            graphArray.push({
                char,
                metrics: m,
                cw,
                ch,
                index: textIdx,
                x: Math.max(0, endX - cw) // 挤进一个
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
                // if (spanIdx >= spansCount) line.maxFontSize = span.fontSize ?? 0;
            }
            // else {
            //     line.maxFontSize = span.fontSize ?? 0;
            // }
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
                char,
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

export function layoutPara(text: Text, para: Para, layoutWidth: number, preBulletNumbers: BulletNumbersLayout[]) {
    let paraWidth = 0;
    const layouts = layoutLines(text, para, layoutWidth, preBulletNumbers);
    const pAttr = para.attr;
    let paraHeight = 0;
    let graphCount = 0;
    const lines = layouts.map((line) => {
        let lineHeight = line.maxFontSize;
        if (pAttr && pAttr.maximumLineHeight) {
            lineHeight = Math.min(pAttr.maximumLineHeight, lineHeight)
        }
        if (pAttr && pAttr.minimumLineHeight) {
            lineHeight = Math.max(pAttr.minimumLineHeight, lineHeight);
        }
        const y = paraHeight;
        paraHeight += lineHeight;
        graphCount += line.graphCount;

        line.y = y;
        line.lineHeight = lineHeight;

        const firstspan = line[0];
        const firstgraph = firstspan[0];

        const lastspan = line[line.length - 1];
        const lastgraph = lastspan[lastspan.length - 1];
        line.graphWidth = lastgraph.x + lastgraph.cw - firstgraph.x;

        // const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
        // if (pAttr && pAttr.alignment && textBehaviour !== TextBehaviour.Flexible) {
        //     adjustLineHorAlign(line, pAttr.alignment, layoutWidth);
        // }
        // line.x = firstgraph.x;
        line.lineWidth = lastgraph.x + lastgraph.cw;

        paraWidth = Math.max(line.lineWidth + line.x, paraWidth);
        return line;
    })
    const paraLayout = new ParaLayout(...lines);
    paraLayout.paraHeight = paraHeight;
    paraLayout.graphCount = graphCount;
    paraLayout.paraWidth = paraWidth;
    paraLayout.bulletNumbers = layouts.bulletNumbers;

    return paraLayout;
}

export function layoutText(text: Text, layoutWidth: number, layoutHeight: number): TextLayout {
    // const layoutWidth = ((b: TextBehaviour) => {
    //     switch (b) {
    //         case TextBehaviour.Flexible: return Number.MAX_VALUE;
    //         case TextBehaviour.Fixed: return frame.width;
    //         case TextBehaviour.FixWidthAndHeight: return frame.width;
    //     }
    //     // return Number.MAX_VALUE
    // })(text.attr?.textBehaviour ?? TextBehaviour.Flexible)

    const padding = text.attr?.padding;
    const paddingLeft = padding?.left ?? 0;
    const paddingTop = padding?.top ?? 0;
    const paddingRight = padding?.right ?? 0;
    const paddingBottom = padding?.bottom ?? 0;

    const paras: ParaLayout[] = []
    let contentHeight = 0;
    let contentWidth = 0;
    const preBulletNumbers: BulletNumbersLayout[] = [];
    const coreLayoutWidth = layoutWidth - paddingLeft - paddingRight;
    for (let i = 0, pc = text.paras.length; i < pc; i++) {
        const para = text.paras[i];
        const paraLayout = layoutPara(text, para, coreLayoutWidth, preBulletNumbers);
        if (i > 0) {
            const prePara = text.paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        paraLayout.yOffset = contentHeight;
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        paras.push(paraLayout);
    }

    // hor align
    const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    const alignWidth = textBehaviour === TextBehaviour.Flexible ? contentWidth : coreLayoutWidth;
    for (let i = 0, pc = text.paras.length; i < pc; i++) {
        const para = text.paras[i];
        const paraLayout = paras[i];
        const alignment = para.attr?.alignment ?? TextHorAlign.Left;
        for (let li = 0, llen = paraLayout.length; li < llen; li++) {
            const line = paraLayout[li];
            adjustLineHorAlign(line, alignment, alignWidth);
        }
    }

    const vAlign = text.attr?.verAlign ?? TextVerAlign.Top;
    const yOffset: number = ((align: TextVerAlign) => {
        switch (align) {
            case TextVerAlign.Top: return paddingTop;
            case TextVerAlign.Middle: return (layoutHeight - contentHeight - paddingTop - paddingBottom) / 2;
            case TextVerAlign.Bottom: return layoutHeight - contentHeight - paddingBottom;
        }
    })(vAlign);
    return { xOffset: paddingLeft, yOffset, paras, contentHeight, contentWidth }
}
