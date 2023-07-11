import { ParaLayout, TextLayout, isNewLineCharCode } from "./textlayout";
import { Point2D } from "./typesdefine";

export function locateText(layout: TextLayout, x: number, y: number): { index: number, before: boolean } {
    const { yOffset, paras } = layout;
    // index line
    if (y < yOffset) return { index: 0, before: false };
    y -= yOffset;
    let index = 0;
    let before = false; // 在行尾时为true
    for (let i = 0, len = paras.length; i < len; i++) {
        const p = paras[i];
        const pBottomY = p.yOffset + p.paraHeight;
        if (y >= pBottomY) {
            // y -= p.paraHeight;
            if (i >= len - 1) {
                index += p.graphCount;
                continue;
            }
            const nextp = paras[i + 1];
            const netxPTopY = nextp.yOffset;
            if (y >= netxPTopY) {
                index += p.graphCount;
                continue;
            }
            y -= netxPTopY - pBottomY;
        }
        y -= p.yOffset;

        // index line
        for (let i = 0, len = p.length; i < len; i++) {
            const line = p[i];
            if (y >= line.y + line.lineHeight) {
                // y -= line.lineHeight;
                index += line.graphCount;
                continue;
            }
            // index span
            x -= line.x;
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
                    // end--;
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

export class CursorLocate {
    cursorPoints: Point2D[] = [];
    lineY: number = 0;
    lineHeight: number = 0;
    preLineY: number = 0;
    preLineHeight: number = 0;
    nextLineY: number = 0;
    nextLineHeight: number = 0;
}

function makeCursorLocate(layout: TextLayout, pi: number, li: number, cursorPoints: Point2D[]) {

    const paras = layout.paras;
    const p = paras[pi];
    const line = p[li];
    const llen = p.length;
    const plen = paras.length;
    const lineY = layout.yOffset + p.yOffset + line.y;

    const ret = new CursorLocate();
    ret.lineY = lineY;

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

export function locateCursor(layout: TextLayout, index: number, cursorAtBefore: boolean): CursorLocate | undefined {
    if (index < 0) return;

    const paras = layout.paras;
    for (let pi = 0, plen = paras.length; pi < plen; pi++) {
        const p = paras[pi];
        if (!(index < p.graphCount || (cursorAtBefore && index === p.graphCount))) {
            index -= p.graphCount;
            continue;
        }

        for (let li = 0, llen = p.length; li < llen; li++) {
            const line = p[li];
            const lineY = layout.yOffset + p.yOffset + line.y;
            if ((cursorAtBefore && index === line.graphCount)) {
                if (line.length === 0) break; // error
                const span = line[line.length - 1];
                if (span.length === 0) break; // error
                const graph = span[span.length - 1];
                const y = lineY + (line.lineHeight - graph.ch) / 2;
                const x = line.x + graph.x + graph.cw;
                const p0 = { x, y };
                const p1 = { x, y: y + graph.ch };
                const ret = makeCursorLocate(layout, pi, li, [p0, p1])
                return ret;
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
                // 光标要取前一个字符的高度
                // 光标的大小应该与即将输入的文本大小一致
                // x
                let graph = span[index];
                let x = line.x + graph.x;
                let y = lineY + (line.lineHeight - graph.ch) / 2;
                let ch = graph.ch;
                if (index > 0) {
                    const preGraph = span[index - 1];
                    if (isNewLineCharCode(graph.char.charCodeAt(0))) {
                        x = line.x + preGraph.x + preGraph.cw;
                    } else {
                        x = line.x + (preGraph.x + preGraph.cw + graph.x) / 2;
                    }
                    y = lineY + (line.lineHeight - preGraph.ch) / 2;
                    ch = preGraph.ch;
                }
                else if (i > 0) {
                    const preSpan = line[i - 1];
                    const preGraph = preSpan[preSpan.length - 1];
                    if (isNewLineCharCode(graph.char.charCodeAt(0))) {
                        x = line.x + preGraph.x + preGraph.cw;
                    } else {
                        x = line.x + (preGraph.x + preGraph.cw + graph.x) / 2;
                    }
                    y = lineY + (line.lineHeight - preGraph.ch) / 2;
                    ch = preGraph.ch;
                }

                const p0 = { x, y };
                const p1 = { x, y: y + ch };
                const ret = makeCursorLocate(layout, pi, li, [p0, p1])
                return ret;
            }
            break;
        }
        break;
    }
}

function _locateRange(layout: TextLayout, pi: number, li: number, si: number, gi: number, count: number): { x: number, y: number }[] {

    const points: { x: number, y: number }[] = [];

    const paras = layout.paras;
    while (count > 0 && pi < paras.length) {
        const p = paras[pi];
        const line = p[li];

        if (si === 0 && gi === 0 && line.graphCount <= count) { // 整行
            const y = layout.yOffset + p.yOffset + line.y;
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
        const minY = layout.yOffset + p.yOffset + line.y; // + (line.lineHeight - graph.ch) / 2;
        const maxY = layout.yOffset + p.yOffset + line.y + line.lineHeight;
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
                start -= line.graphCount;
                continue;
            }

            for (let si = 0, len = line.length; si < len; si++) {
                const span = line[si];
                if (start >= span.graphCount) {
                    start -= span.graphCount;
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