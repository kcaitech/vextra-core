/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { TEXT_BASELINE_RATIO } from "./basic";
import { SpanAttr } from "./text";
import { IGraphy, TextLayout } from "./textlayout";
import { Point2D } from "../typesdefine";
import { isNewLineCharCode } from "./basic";

export class TextLocate {
    index: number = 0;
    before: boolean = false;
    placeholder: boolean = false;
    attr: SpanAttr | undefined;
}

export function locateText(layout: TextLayout, x: number, y: number): TextLocate {
    const { xOffset, yOffset, paras } = layout;
    const ret = new TextLocate();
    // index line
    if (y < yOffset) return ret;
    y -= yOffset;
    x -= xOffset;
    let index = 0;
    let before = false; // 在行尾时为true
    for (let pi = 0, plen = paras.length; pi < plen; pi++) {
        const p = paras[pi];
        const pBottomY = p.yOffset + p.paraHeight;
        if (y >= pBottomY) {
            // y -= p.paraHeight;
            if (pi >= plen - 1) {
                index += p.charCount;
                continue;
            }
            const nextp = paras[pi + 1];
            const netxPTopY = nextp.yOffset;
            if (y >= netxPTopY) {
                index += p.charCount;
                continue;
            }
            y -= netxPTopY - pBottomY;
        }
        y -= p.yOffset;

        x -= p.xOffset;
        // index line
        for (let li = 0, llen = p.length; li < llen; li++) {
            const line = p[li];
            if (y >= line.y + line.lineHeight) {
                // y -= line.lineHeight;
                index += line.charCount;
                continue;
            }
            // index span
            x -= line.x;
            for (let si = 0, slen = line.length; si < slen; si++) {
                const span = line[si];
                if (span.length === 0) {
                    throw new Error("layout result error, graph array is empty")
                }
                const lastGraph = span[span.length - 1];
                if (x >= (lastGraph.x + lastGraph.cw)) {
                    index += span.charCount;
                    if (si === slen - 1) {
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
                    // end--;
                }
                else if (x > endgraph.x + endgraph.cw / 2) {
                    end++; // 修正鼠标位置
                }
                if (si === slen - 1 && end === span.length) {
                    before = true;
                }
                // index += end;
                for (let i = 0; i < end; ++i) {
                    index += span[i].cc;
                }

                if (end < span.length) {
                    if (span.attr?.placeholder) {
                        ret.placeholder = true;
                        ret.attr = span.attr;
                    }
                } else if (si < slen - 1) {
                    const nextspan = line[si + 1];
                    if (nextspan.attr?.placeholder) {
                        ret.placeholder = true;
                        ret.attr = nextspan.attr;
                    }
                }

                break;
            }
            break;
        }
        break;
    }
    ret.index = index;
    ret.before = before;
    return ret;
}

export class CursorLocate {
    cursorPoints: Point2D[] = [];
    lineY: number = 0;
    lineHeight: number = 0;
    preLineY: number = 0;
    preLineHeight: number = 0;
    nextLineY: number = 0;
    nextLineHeight: number = 0;
    placeholder: boolean = false;
    attr: SpanAttr | undefined;
}

function makeCursorLocate(layout: TextLayout, pi: number, li: number, si: number, cursorPoints: Point2D[]) {

    const paras = layout.paras;
    const p = paras[pi];
    const line = p[li];
    const llen = p.length;
    const plen = paras.length;
    const lineY = layout.yOffset + p.yOffset + line.y;
    const span = line[si];

    const ret = new CursorLocate();
    ret.lineY = lineY;

    if (span.attr?.placeholder) {
        ret.placeholder = true;
        ret.attr = span.attr;
    }

    ret.preLineY = lineY;
    ret.nextLineY = lineY + line.lineHeight;

    ret.lineHeight = line.lineHeight;
    ret.cursorPoints.push(...cursorPoints);
    if (li > 0) {
        const preLine = p[li - 1];
        const preLineY = layout.yOffset + p.yOffset + preLine.y;
        ret.preLineHeight = preLine.lineHeight;
        ret.preLineY = preLineY;
    }
    else if (pi > 0) {
        const prep = paras[pi - 1];
        const preLine = prep[prep.length - 1];
        const preLineY = layout.yOffset + prep.yOffset + preLine.y;
        ret.preLineHeight = preLine.lineHeight;
        ret.preLineY = preLineY;
    }
    if (li < llen - 1) {
        const nextLine = p[li + 1];
        const nextLineY = layout.yOffset + p.yOffset + nextLine.y;
        ret.nextLineHeight = nextLine.lineHeight;
        ret.nextLineY = nextLineY;
    }
    else if (pi < plen - 1) {
        const nextp = paras[pi + 1];
        const nextLine = nextp[0];
        const nextLineY = layout.yOffset + nextp.yOffset + nextLine.y;
        ret.nextLineHeight = nextLine.lineHeight;
        ret.nextLineY = nextLineY;
    }
    return ret;
}

// todo 这个方法好像存在多余的调用
export function locateCursor(layout: TextLayout, index: number, cursorAtBefore: boolean): CursorLocate | undefined {
    if (index < 0) return;

    const paras = layout.paras;
    for (let pi = 0, plen = paras.length; pi < plen; pi++) {
        const p = paras[pi];
        if (!(index < p.charCount || (cursorAtBefore && index === p.charCount))) {
            index -= p.charCount;
            continue;
        }

        for (let li = 0, llen = p.length; li < llen; li++) {
            const line = p[li];
            const lineX = layout.xOffset + p.xOffset + line.x;
            const lineY = layout.yOffset + p.yOffset + line.y;
            if ((cursorAtBefore && index === line.charCount)) {
                if (line.length === 0) break; // error
                const span = line[line.length - 1];
                if (span.length === 0) break; // error
                const graph = span[span.length - 1];
                const y = lineY + line.lineHeight - (line.lineHeight - (line.maxFontSize)) / 2; // bottom
                const x = lineX + graph.x + graph.cw;
                const baseY = y - line.actualBoundingBoxDescent;
                const cb = baseY + Math.round(graph.ch * TEXT_BASELINE_RATIO);
                const p0 = { x, y: cb - graph.ch };
                const p1 = { x, y: cb };
                const ret = makeCursorLocate(layout, pi, li, line.length - 1, [p0, p1])
                return ret;
            }
            if (index >= line.charCount) {
                index -= line.charCount;
                continue;
            }

            for (let i = 0, len = line.length; i < len; i++) {
                const span = line[i];
                const spanCharCount = span.charCount;
                if (index >= spanCharCount) {
                    index -= spanCharCount;
                    continue;
                }
                // 光标要取前一个字符的高度
                // 光标的大小应该与即将输入的文本大小一致
                // x
                let graph; // 不对
                let preGraph;
                if (line.charCount === line.graphCount) {
                    graph = span[index];
                    preGraph = span[index - 1];
                } else {
                    for (let i = 0, c = index; i < span.length; ++i) {
                        const g = span[i];
                        if (c <= 0) {
                            graph = g;
                            break;
                        }
                        preGraph = g;
                        c -= g.cc;
                    }
                    if (!graph) throw new Error();
                }
                let x = lineX + graph.x;
                const y = lineY + line.lineHeight - (line.lineHeight - (line.maxFontSize)) / 2; // bottom
                let _g = graph;
                if (index > 0) {
                    // const preGraph = span[index - 1];
                    if (!preGraph) throw new Error();
                    if (isNewLineCharCode(graph.char.charCodeAt(0))) {
                        x = lineX + preGraph.x + preGraph.cw;
                    } else {
                        x = lineX + (preGraph.x + preGraph.cw + graph.x) / 2;
                    }
                    _g = preGraph;
                }
                else if (i > 0) {
                    const preSpan = line[i - 1];
                    const preGraph = preSpan[preSpan.length - 1];
                    if (isNewLineCharCode(graph.char.charCodeAt(0))) {
                        x = lineX + preGraph.x + preGraph.cw;
                    } else {
                        x = lineX + (preGraph.x + preGraph.cw + graph.x) / 2;
                    }
                    _g = preGraph;
                }
                const baseY = y - line.actualBoundingBoxDescent;
                const cb = baseY + Math.round(_g.ch * TEXT_BASELINE_RATIO);
                const p0 = { x, y: cb - _g.ch };
                const p1 = { x, y: cb };
                const ret = makeCursorLocate(layout, pi, li, i, [p0, p1])
                return ret;
            }
            break;
        }
        break;
    }
}

function _locateRange(layout: TextLayout, pi: number, li: number, si: number, start: number, count: number): { x: number, y: number }[] {

    const points: { x: number, y: number }[] = [];

    const paras = layout.paras;
    while (count > 0 && pi < paras.length) {
        const p = paras[pi];
        const line = p[li];

        if (si === 0 && start === 0 && line.charCount <= count) { // 整行
            const y = layout.yOffset + p.yOffset + line.y;
            const h = line.lineHeight;

            const span0 = line[0];
            const span1 = line[line.length - 1];
            const graph0 = span0[0];
            let offsetx = 0;
            if(span0.attr?.placeholder && graph0) {
                offsetx += graph0.cw;
            }
            const graph1 = span1[span1.length - 1];
            const x = layout.xOffset + graph0.x + line.x + p.xOffset + offsetx;
            const w = graph1.x + graph1.cw - graph0.x;

            points.push(
                { x, y }, // left top
                { x: x + w, y }, // right top
                { x: x + w, y: y + h }, // right bottom
                { x, y: y + h }, // left bottom
            );
            
            count -= line.charCount;
            li++;
            if (li >= p.length) {
                pi++;
                li = 0;
            }
            continue;
        }

        const span = line[si];
        // const graph = span[gi];//todo
        let graph; // 不对
        let graphIndex = 0;
        let offsetx = 0;
        if (line.charCount === line.graphCount) {
            graph = span[start];
            if(span.attr?.placeholder && span[0]) {
                offsetx += span[0].cw;
            }
            
            graphIndex = start;
        } else {
            for (let i = 0, c = start; i < span.length; ++i) {
                graph = span[i];
                graphIndex = i;
                if(span.attr?.placeholder && span[0]) {
                    offsetx = span[0].cw;
                }
                if (c <= 0) {
                    break;
                }
                c -= graph.cc;
            }
            if (!graph) throw new Error();
        }
        const lineX = layout.xOffset + p.xOffset + line.x;
        const lineY = layout.yOffset + p.yOffset + line.y;
        
        let minX = lineX + graph.x + offsetx;
        const minY = lineY; // + (line.lineHeight - graph.ch) / 2;
        const maxY = lineY + line.lineHeight;
        let maxX = lineX + graph.x + graph.cw;
        
        for (let i = si, len = line.length; i < len && count > 0; i++) {
            const span = line[i];

            let graph;
            // let charCount;
            for (let j = graphIndex; j < span.length; ++j) {
                graph = span[j];
                count -= graph.cc;
                if (count <= 0) break;
            }
            if (!graph) throw new Error();

            maxX = lineX + graph.x + graph.cw;
            graphIndex = 0;
        }

        points.push(
            { x: minX, y: minY }, // left top
            { x: maxX, y: minY }, // right top
            { x: maxX, y: maxY }, // right bottom
            { x: minX, y: maxY }, // left bottom
        )

        start = 0;
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
        if (start >= p.charCount) {
            start -= p.charCount;
            continue;
        }
        for (let li = 0, len = p.length; li < len; li++) {
            const line = p[li];

            if (start >= line.charCount) {
                start -= line.charCount;
                continue;
            }
            for (let si = 0, len = line.length; si < len; si++) {
                const span = line[si];
                const spanCharCount = span.charCount;
                if (start >= spanCharCount) {
                    start -= spanCharCount;
                    continue;
                }
                // const gi = start;
                return _locateRange(layout, pi, li, si, start, count);
            }
            break;
        }
        break;
    }
    return [];
}

function graphAt(layout: TextLayout, index: number): { graph: IGraphy, offset: number } | undefined {
    const paras = layout.paras;
    for (let pi = 0, plen = paras.length; pi < plen; pi++) {
        const p = paras[pi];
        if (!(index < p.charCount)) {
            index -= p.charCount;
            continue;
        }

        for (let li = 0, llen = p.length; li < llen; li++) {
            const line = p[li];
            if (index >= line.charCount) {
                index -= line.charCount;
                continue;
            }

            for (let i = 0, len = line.length; i < len; i++) {
                const span = line[i];
                const spanCharCount = span.charCount;
                if (index >= spanCharCount) {
                    index -= spanCharCount;
                    continue;
                }
                // 光标要取前一个字符的高度
                // 光标的大小应该与即将输入的文本大小一致
                // x
                let graph; // 不对
                let offset = 0;
                if (line.charCount === line.graphCount) {
                    graph = span[index];
                } else {
                    for (let i = 0, c = index; i < span.length; ++i) {
                        graph = span[i];
                        offset = c;
                        c -= graph.cc;
                        if (c < 0) {
                            break;
                        }
                    }
                    if (!graph) throw new Error();
                }
                return { graph, offset };
            }
            break;
        }
        break;
    }
}

// 前向光标index
export function locatePrevCursor(layout: TextLayout, index: number): number {
    if (index <= 1) return 0;
    const graph = graphAt(layout, index - 1);
    if (!graph) {
        return index; // ?
    }

    return Math.max(0, index - 1 - graph.offset);
}

// 后向光标index
export function locateNextCursor(layout: TextLayout, index: number): number {
    if (index < 0) return 0;
    const graph = graphAt(layout, index);
    if (!graph) {
        return index; // ?
    }
    return index - graph.offset + graph.graph.cc;
}