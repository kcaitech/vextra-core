/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BulletNumbersType, ParaIter, ParaIterItem, Text, TextBehaviour } from "./text";
import { Para, Span, SpanAttr, TextHorAlign, TextVerAlign } from "./text";
import { layoutBulletNumber } from "./textbnlayout";
import { transformText } from "./textlayouttransform";
import { gPal } from "../../basic/pal";
import { ParaAttr, ShapeSize, TextTransformType } from "../typesdefine";
import { autoLineHeight, TEXT_BASELINE_RATIO } from "./basic";
import { isLetter, isNewLineCharCode, isPureHeadPunc, isTailPunc } from "./basic";

const TAB_WIDTH = 28;
const INDENT_WIDTH = TAB_WIDTH;

export interface IGraphy {
    char: string, // 可能是多个字符，在项目符号编号中
    metrics: TextMetrics | undefined,
    cw: number,
    ch: number,
    index: number,
    x: number,
    cc: number // char count
    subgraphys?: IGraphy[] // 用于项目符号编号等的排版
}

export class GraphArray extends Array<IGraphy> {
    public attr: SpanAttr | undefined;
    // public actualBoundingBoxDescent: number = 0;
    get graphCount() {
        return this.length;
    }
    // get charCount() {
    //     return this.reduce((c, g) => c + g.cc, 0);
    // }
    public charCount: number = 0;

    push(...items: IGraphy[]): number {
        if (items.length === 1) {
            // this.actualBoundingBoxDescent = Math.max(this.actualBoundingBoxDescent, items[0].metrics?.actualBoundingBoxDescent || 0);
            this.charCount += items[0].cc;
        } else {
            // this.actualBoundingBoxDescent = items.reduce((p, c) => Math.max(p, c.metrics?.actualBoundingBoxDescent || 0), this.actualBoundingBoxDescent);
            this.charCount += items.reduce((c, g) => c + g.cc, 0);
        }
        return super.push(...items);
    }
}
export class Line extends Array<GraphArray> {
    public maxFontSize: number = 0;
    // public actualBoundingBoxDescent: number = 0;

    get actualBoundingBoxDescent() {
        return Math.round(this.maxFontSize * TEXT_BASELINE_RATIO);
    }
    public x: number = 0;
    public y: number = 0;
    public lineHeight: number = 0;
    public lineWidth: number = 0; // adjust后的宽度

    public graphWidth: number = 0; // graph+kerning的宽度
    public graphCount: number = 0;
    public charCount: number = 0; // graph跟char数量不一定一致，如emoji用两个字符表示

    public alignment: TextHorAlign = TextHorAlign.Left;
    public layoutWidth: number = 0;

    push(...items: GraphArray[]): number {
        if (items.length === 0) return 0
        if (items.length === 1) {
            // this.actualBoundingBoxDescent = Math.max(this.actualBoundingBoxDescent, items[0].actualBoundingBoxDescent || 0);
            this.maxFontSize = Math.max(this.maxFontSize, items[0].attr?.fontSize || 0);
            this.charCount += items[0].charCount;
            ++this.graphCount;
        } else {
            // this.actualBoundingBoxDescent = items.reduce((p, c) => Math.max(p, c.actualBoundingBoxDescent || 0), this.actualBoundingBoxDescent);
            this.maxFontSize = items.reduce((p, c) => Math.max(p, c.attr?.fontSize || 0), this.maxFontSize);
            this.charCount += items.reduce((p, c) => p + c.charCount, 0);
            this.graphCount += items.length;
        }
        if (this.length > 0) {
            const pre = this[this.length - 1]
            const cur = items[0];
            if (pre.attr === cur.attr) { // merge
                pre.push(...cur);
                items.splice(0, 1);
            }
        }
        return super.push(...items);
    }

    toJSON() {
        const graphs: GraphArray[] = [];
        for (let i = 0; i < this.length; ++i) {
            graphs.push(this[i]);
        }
        return {
            maxFontSize: this.maxFontSize,
            actualBoundingBoxDescent: this.actualBoundingBoxDescent,
            x: this.x,
            y: this.y,
            lineHeight: this.lineHeight,
            lineWidth: this.lineWidth,
            graphWidth: this.graphWidth,
            graphCount: this.graphCount,
            charCount: this.charCount,
            alignment: this.alignment,
            layoutWidth: this.layoutWidth,

            graphs
        }
    }
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
    public paraWidth: number = 0;
    public graphCount: number = 0;
    public charCount: number = 0;
    public yOffset: number = 0;
    public xOffset: number = 0;
    public bulletNumbers?: BulletNumbersLayout;

    toJSON() {
        const lines: Line[] = [];
        for (let i = 0; i < this.length; ++i) {
            lines.push(this[i]);
        }
        return {
            paraHeight: this.paraHeight,
            graphCount: this.graphCount,
            charCount: this.charCount,
            yOffset: this.yOffset,
            xOffset: this.xOffset,
            paraWidth: this.paraWidth,
            bulletNumbers: this.bulletNumbers,
            lines
        }
    }
}

export class TextLayout {
    public alignX: number = 0;
    public xOffset: number = 0;
    public yOffset: number = 0;
    public paras: ParaLayout[] = [];
    public contentHeight: number = 0;
    public contentWidth: number = 0;
}

export class LayoutItem {
    layout: TextLayout | undefined;
    owners: string[] = [];

    // save infos
    __layoutWidth: number = 0;
    // __frameWidth: number = 0;
    // __frameHeight: number = 0;
    __textBehaviour: TextBehaviour | undefined;
    __verAlign: TextVerAlign | undefined;
    __frame: ShapeSize = { width: 0, height: 0 }

    update(frame: ShapeSize, text: Text) {
        const layoutWidth = ((b: TextBehaviour) => {
            switch (b) {
                case TextBehaviour.Flexible: return Number.MAX_VALUE;
                case TextBehaviour.Fixed: return frame.width;
                case TextBehaviour.FixWidthAndHeight: return frame.width;
            }
            // return Number.MAX_VALUE
        })(text.attr?.textBehaviour ?? TextBehaviour.Flexible)

        if (this.__layoutWidth !== layoutWidth) {
            this.__layoutWidth = layoutWidth;
            // this.reLayout();
            this.layout = undefined;
        }
        else if (this.layout) {
            const layout = this.layout;
            if ((this.__frame.height !== frame.height || this.__verAlign !== (text.attr?.verAlign ?? TextVerAlign.Top))) {
                const vAlign = text.attr?.verAlign ?? TextVerAlign.Top;
                const yOffset: number = ((align: TextVerAlign) => {
                    switch (align) {
                        case TextVerAlign.Top: return 0;
                        case TextVerAlign.Middle: return (frame.height - this.layout.contentHeight) / 2;
                        case TextVerAlign.Bottom: return frame.height - this.layout.contentHeight;
                    }
                })(vAlign);
                this.layout.yOffset = yOffset;
            }
            // hor align
            const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
            if (this.__frame.width !== frame.width && textBehaviour === TextBehaviour.Flexible) {
                let alignX = Number.MAX_SAFE_INTEGER;
                for (let i = 0, pc = text.paras.length; i < pc; i++) {
                    const para = text.paras[i];
                    const paraLayout = layout.paras[i];
                    const alignment = para.attr?.alignment ?? TextHorAlign.Left;
                    switch (alignment) {
                        case TextHorAlign.Centered:
                            alignX = Math.min(alignX, -(paraLayout.paraWidth - frame.width) / 2);
                            break;
                        case TextHorAlign.Left:
                        case TextHorAlign.Natural:
                            alignX = Math.min(alignX, 0);
                            break;
                        case TextHorAlign.Justified:
                        case TextHorAlign.Right:
                            alignX = Math.min(alignX, -(paraLayout.paraWidth - frame.width));
                            break;
                    }
                }
                layout.alignX = alignX === Number.MAX_SAFE_INTEGER ? 0 : alignX;
            }
        }

        // this.__frameWidth = w;
        // this.__frameHeight = h;
        // this.__frame.x = frame.x;
        // this.__frame.y = frame.y;
        this.__frame.width = frame.width;
        this.__frame.height = frame.height;

        this.__textBehaviour = text.attr?.textBehaviour;
        this.__verAlign = text.attr?.verAlign;
    }
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

function _nextGraphy(span: Span, lineArray: LineArray, c: string, idx: number, transfrom?: TextTransformType): IGraphy {
    const transformType = span.transform ?? transfrom;
    const char = transformText(c, idx === 0 || (idx === 1 && !!lineArray.bulletNumbers), transformType);

    const italic = span.italic;
    const weight = span.weight || 400;
    const fontSize = span.fontSize ?? 0;
    const font = (italic ? 'italic ' : 'normal ') + weight + ' ' + fontSize + 'px ' + span.fontName;
    const measure = gPal.text.textMeasure;
    const m = measure(char, font);
    const cw = m?.width ?? 0;
    const ch = typeof fontSize !== 'number' ? Number.parseFloat(fontSize) : fontSize; // fix bug: 数据中存在字符串类型的fontsize时，后续出错

    return {
        char,
        metrics: m,
        cw,
        ch,
        index: idx,
        x: 0,
        cc: c.length
    }
}

function nextGraphy(iter: ParaIter, lineArray: LineArray, preBulletNumbers: BulletNumbersLayout[]): { type: 'ch' | 'nl' | 'bn', graphys: GraphArray[] } { // 可能多个span，
    let cur = iter.next();
    const c = cur.char;
    const code = c.charCodeAt(0);
    const span = cur.span;

    if (c.length === 1 && isNewLineCharCode(code)) {
        // new line
        const graphArray = new GraphArray();
        // '\n'
        graphArray.attr = span;
        graphArray.push({
            char: '\n',
            metrics: undefined,
            cw: 0, // ?
            ch: span.fontSize ?? 0,
            index: cur.idx,
            x: 0,
            cc: 1
        });
        return { type: 'nl', graphys: [graphArray] }
    }

    if (c.length === 1 &&
        cur.spanIdx === 0 &&
        code === 0x2A &&
        span.placeholder &&
        span.length === 1 &&
        span.bulletNumbers) { // '*' 项目符号编号

        // bullet number
        const layout = layoutBulletNumber(iter.para, span, span.bulletNumbers, preBulletNumbers); // todo graphyGroup, 支持排版项目符号

        const graphArray = new GraphArray();
        graphArray.attr = span;

        graphArray.push(layout.graph);

        lineArray.bulletNumbers = layout;
        return { type: 'bn', graphys: [graphArray] }
    }

    // todo tab 不对
    // indent 未处理
    const transformType = iter.para.attr?.transform;

    // text
    // todo 英文字符不截断
    // todo 标点符号位置正确


    let graphArray = new GraphArray();
    graphArray.attr = span;
    graphArray.push(_nextGraphy(span, lineArray, cur.char, cur.idx, transformType));

    const appendGraphy = (next: ParaIterItem) => {
        if (graphArray.attr === next.span) {
            graphArray.push(_nextGraphy(next.span, lineArray, next.char, next.idx, transformType));
        } else {
            graphArray = new GraphArray();
            graphArray.attr = next.span;
            graphArray.push(_nextGraphy(next.span, lineArray, next.char, next.idx, transformType));
            ret.push(graphArray)
        }
    }

    const ret: GraphArray[] = [graphArray];
    while (iter.hasNext()) {
        let next = iter.peekNext();
        // 当前是字符,后面的也是字符，需要加到当前graphy，继续
        // 后面的是不可在行首的符号，需要加到当前graphy，结束
        // 当前是不可在行尾的符号，后面需要加个字符啥的，继续
        if (isLetter(cur.char) && isLetter(next.char) || isPureHeadPunc(cur.char)) {
            cur = iter.next();
            appendGraphy(cur);
            continue;
        }
        if (isTailPunc(next.char)) {
            cur = iter.next();
            appendGraphy(cur);
            break;
        }
        break;
    }
    return { type: 'ch', graphys: ret }
}

export function layoutLines(_text: Text, para: Para, width: number, preBulletNumbers: BulletNumbersLayout[]): LineArray {

    const paraCharSpace = para.attr?.kerning ?? 0;
    const indent = (para.attr?.indent || 0) * INDENT_WIDTH;
    const lineArray: LineArray = [];
    const iter = para.iter();
    let startX = Math.min(indent, width), endX = width;
    let curX = startX;
    let line: Line = new Line();

    const assignGraphysX = (graphys: GraphArray[], curX: number) => {
        graphys.forEach(arr => arr.forEach(g => {
            g.x = curX;
            curX += g.cw + (arr.attr?.kerning ?? paraCharSpace);
        }))
    }

    while (iter.hasNext()) {
        const next = nextGraphy(iter, lineArray, preBulletNumbers);
        const graphys = next.graphys;

        if (next.type === 'nl') { // new line
            assignGraphysX(graphys, curX);
            line.push(...graphys);
            lineArray.push(line);
            line = new Line();
            curX = startX;
            continue;
        }

        const lastKerning = graphys[graphys.length - 1].attr?.kerning ?? paraCharSpace;
        const cw = graphys.reduce((p, v0) => p + v0.reduce((p, g) => p + g.cw + (v0.attr?.kerning ?? paraCharSpace), 0), 0) - lastKerning; // todo字间距不对？
        if (next.type === 'bn') {
            // 调整startX
            startX += cw + lastKerning;
        }

        if (cw + curX <= endX) { // cw + curX + charSpace <= endX,兼容sketch
            assignGraphysX(graphys, curX);
            line.push(...graphys);
            curX += cw + lastKerning;
            continue;
        }

        if (line.length === 0) {
            assignGraphysX(graphys, curX);
            line.push(...graphys);
            lineArray.push(line);
            line = new Line();
            curX = startX;
            continue;
        }

        lineArray.push(line);
        line = new Line();
        assignGraphysX(graphys, startX);
        line.push(...graphys);
        curX = startX + cw + lastKerning;
        continue;
    }

    if (line.length > 0) {
        lineArray.push(line);
    }

    return lineArray;
}

function clampLineHeight(pAttr: ParaAttr | undefined, maxFontSize: number) {
    if (!pAttr) return maxFontSize;
    if (pAttr.autoLineHeight) {
        // auto lineHeight
        return autoLineHeight(maxFontSize, pAttr.minimumLineHeight)
    }

    let lineHeight = maxFontSize;
    if (pAttr.maximumLineHeight) {
        lineHeight = Math.min(pAttr.maximumLineHeight, lineHeight)
    }
    if (pAttr.minimumLineHeight) {
        lineHeight = Math.max(pAttr.minimumLineHeight, lineHeight);
    }
    return lineHeight;
}

export function layoutPara(text: Text, para: Para, layoutWidth: number, preBulletNumbers: BulletNumbersLayout[]) {
    let paraWidth = 0;
    const layouts = layoutLines(text, para, layoutWidth, preBulletNumbers);
    const pAttr = para.attr;
    let paraHeight = 0;
    let graphCount = 0;
    let charCount = 0;
    const lines = layouts.map((line) => {
        const lineHeight = clampLineHeight(pAttr, line.maxFontSize);

        const y = paraHeight;
        paraHeight += lineHeight;
        graphCount += line.graphCount;
        charCount += line.charCount;

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
    paraLayout.charCount = charCount;
    paraLayout.paraWidth = paraWidth;
    paraLayout.bulletNumbers = layouts.bulletNumbers;

    return paraLayout;
}

export function layoutText(text: Text, frame: ShapeSize, behavior?: TextBehaviour): TextLayout {    
    const layoutWidth = ((b: TextBehaviour) => {
        switch (b) {
            case TextBehaviour.Flexible: return Number.MAX_VALUE;
            case TextBehaviour.Fixed: return frame.width;
            case TextBehaviour.FixWidthAndHeight: return frame.width;
        }
        // return Number.MAX_VALUE
    })(behavior ?? text.attr?.textBehaviour ?? TextBehaviour.Flexible)

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
    let alignX = Number.MAX_SAFE_INTEGER;
    for (let i = 0, pc = text.paras.length; i < pc; i++) {
        const para = text.paras[i];
        const paraLayout = paras[i];
        const alignment = para.attr?.alignment ?? TextHorAlign.Left;
        for (let li = 0, llen = paraLayout.length; li < llen; li++) {
            const line = paraLayout[li];
            adjustLineHorAlign(line, alignment, alignWidth);
        }
        if (textBehaviour === TextBehaviour.Flexible) switch (alignment) {
            case TextHorAlign.Centered:
                alignX = Math.min(alignX, -(paraLayout.paraWidth - frame.width) / 2);
                break;
            case TextHorAlign.Left:
            case TextHorAlign.Natural:
                alignX = Math.min(alignX, 0);
                break;
            case TextHorAlign.Justified:
            case TextHorAlign.Right:
                alignX = Math.min(alignX, -(paraLayout.paraWidth - frame.width));
                break;
        }
    }

    const vAlign = text.attr?.verAlign ?? TextVerAlign.Top;
    const yOffset: number = ((align: TextVerAlign) => {
        switch (align) {
            case TextVerAlign.Top: return paddingTop;
            case TextVerAlign.Middle: return (frame.height - contentHeight - paddingTop - paddingBottom) / 2;
            case TextVerAlign.Bottom: return frame.height - contentHeight - paddingBottom;
        }
    })(vAlign);
    return { alignX: alignX === Number.MAX_SAFE_INTEGER ? 0 : alignX, xOffset: paddingLeft, yOffset, paras, contentHeight, contentWidth }
}
