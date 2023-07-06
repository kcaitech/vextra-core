import { TextLayout } from "./textlayout";

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
                const y = p.yOffset + line.y + (line.lineHeight - graph.ch) / 2;
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
                // todo 光标要取前一个字符的高度
                // 光标的大小应该与即将输入的文本大小一致
                const graph = span[index];
                const y = p.yOffset + line.y + (line.lineHeight - graph.ch) / 2;
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
            const y = p.yOffset + line.y;
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
        const minY = p.yOffset + line.y; // + (line.lineHeight - graph.ch) / 2;
        const maxY = p.yOffset + line.y + line.lineHeight;
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