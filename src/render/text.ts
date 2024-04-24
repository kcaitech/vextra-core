

import { DefaultColor, findOverrideAndVar, isColorEqual, isVisible, randomId } from "./basic";
import { TextShape, Path, Color, SymbolShape, SymbolRefShape, OverrideType, VariableType, Para, ParaAttr, Text, Span, FillType, Gradient, ShapeFrame, UnderlineType, StrikethroughType } from '../data/classes';
import { GraphArray, TextLayout } from "../data/textlayout";
import { gPal } from "../basic/pal";
import { renderWithVars as fillR } from "./fill";
import { renderWithVars as borderR } from "./border";
import { BasicArray } from "../data/basic";
import { mergeParaAttr, mergeSpanAttr, mergeTextAttr } from "../data/textutils";
import { innerShadowId, renderWithVars as shadowR } from "./shadow";
import { render as renderGradient } from "./gradient";
import { objectId } from "../basic/objectid";

function toRGBA(color: Color): string {
    return "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
}

function isBlankChar(charCode: number) {
    switch (charCode) {
        case 0x09: // '\t'
        case 0x0a: // '\n'
        case 0x20: // ' '
            return true;
    }
    return false;
}

export function renderText2Path(layout: TextLayout, offsetX: number, offsetY: number): Path {
    const getTextPath = gPal.text.getTextPath;
    const { yOffset, xOffset, paras } = layout;
    const pc = paras.length;

    const paths = new Path();
    for (let i = 0; i < pc; i++) {
        const lines = paras[i];

        for (let lineIndex = 0, lineCount = lines.length; lineIndex < lineCount; lineIndex++) {
            const line = lines[lineIndex];
            const lineX = offsetX + xOffset + lines.xOffset + line.x;
            const lineY = offsetY + yOffset + lines.yOffset + line.y;
            for (let garrIdx = 0, garrCount = line.length; garrIdx < garrCount; garrIdx++) {
                const garr = line[garrIdx];
                const span = garr.attr;
                const font = span?.fontName || '';
                const fontSize = span?.fontSize || 0;
                const y = lineY + (line.lineHeight - fontSize) / 2; // top

                paths.push(...garr.map((g) => {
                    if (isBlankChar(g.char.charCodeAt(0))) return new Path();
                    const pathstr = getTextPath(font, fontSize, g.char.charCodeAt(0))
                    const path = new Path(pathstr)
                    path.translate(g.x + lineX, y);
                    return path;
                }))
            }
        }
    }
    return paths;
}

function collectDecorateRange(garr: GraphArray, decorateRange: { start: number, end: number, color: Color }[], preGarrIdx: number, garrIdx: number, color: Color) {
    if (preGarrIdx === garrIdx - 1) {
        const last = decorateRange[decorateRange.length - 1];
        if (isColorEqual(last.color, color)) {
            const endGraph = garr[garr.length - 1];
            const end = endGraph.x + endGraph.cw;
            last.end = end;
            return;
        }
    }
    const startGraph = garr[0];
    const endGraph = garr[garr.length - 1];
    const start = startGraph.x;
    const end = endGraph.x + endGraph.cw;
    decorateRange.push({ start, end, color })
}

function renderDecorateLines(h: Function, x: number, y: number, decorateRange: { start: number, end: number, color: Color }[], childs: any[]) {
    for (let i = 0, len = decorateRange.length; i < len; i++) {
        const l = decorateRange[i];
        const d = "M" + (x + l.start) + ' ' + y + " L" + (x + l.end) + ' ' + y;
        const props: any = {};
        props["fill-opacity"] = 1;
        props.d = d;
        props.fill = 'none';
        props.stroke = toRGBA(l.color);
        props["stroke-width"] = 1;
        childs.push(h('path', props));
    }
}

function renderDecorateRects(h: Function, x: number, y: number, hight: number, decorateRange: { start: number, end: number, color: Color }[], childs: any[]) {
    for (let i = 0, len = decorateRange.length; i < len; i++) {
        const l = decorateRange[i];
        const d = "M" + (x + l.start) + ' ' + y + // lt
            " L" + (x + l.end) + ' ' + y + // rt
            " L" + (x + l.end) + ' ' + (y + hight) + // rb
            " L" + ' ' + (x + l.start) + ' ' + (y + hight) + // lb
            'Z';
        const props: any = {};
        props["fill-opacity"] = 1;
        props.d = d;
        props.fill = toRGBA(l.color);
        props.stroke = 'none';
        props["stroke-width"] = 1;
        childs.push(h('path', props));
    }
}

export function renderTextLayout(h: Function, textlayout: TextLayout, frame?: ShapeFrame) {
    const childs = [];

    const { xOffset, yOffset, paras } = textlayout;
    const pc = paras.length;
    for (let i = 0; i < pc; i++) {
        const lines = paras[i];

        for (let lineIndex = 0, lineCount = lines.length; lineIndex < lineCount; lineIndex++) {
            const line = lines[lineIndex];
            const lineX = line.x + xOffset + lines.xOffset;
            const lineY = yOffset + lines.yOffset + line.y;
            // 收集下划线、删除线、高亮
            let preUnderlineGIdx = Number.NEGATIVE_INFINITY;
            let preStrikethrouthGIdx = Number.NEGATIVE_INFINITY;
            let preHightlightGIdx = Number.NEGATIVE_INFINITY;

            const underlines: { start: number, end: number, color: Color }[] = [];
            const strikethrouths: { start: number, end: number, color: Color }[] = [];
            const hightlights: { start: number, end: number, color: Color }[] = [];

            const linechilds = [];

            for (let garrIdx = 0, garrCount = line.length; garrIdx < garrCount; garrIdx++) {
                const gText = []
                const gX = []
                // const gY = []
                const garr = line[garrIdx];
                for (let gIdx = 0, gCount = garr.length; gIdx < gCount; gIdx++) {
                    const graph = garr[gIdx];
                    if (isBlankChar(graph.char.charCodeAt(0))) { // 两个连续的空格或者首个空格，svg显示有问题
                        continue;
                    }
                    gText.push(graph.char);
                    gX.push(graph.x + lineX);
                }

                const span = garr.attr;
                const fontSize = span?.fontSize || 0;
                const fontName = span?.fontName;
                const y = lineY + (line.lineHeight) / 2;

                const font = "normal " + fontSize + "px " + fontName;
                const style: any = {
                    font,
                    'alignment-baseline': 'central'
                }
                if (span) {
                    style['font-weight'] = span.bold || 400;
                    if (span.italic) style['font-style'] = "italic";
                    if (span.gradient && span.fillType === FillType.Gradient && frame) {
                        const g_ = renderGradient(h, span.gradient as Gradient, frame);
                        const opacity = span.gradient.gradientOpacity;
                        if (g_.node) linechilds.push(g_.node);
                        const gid = g_.id;
                        style['fill'] = "url(#" + gid + ")";
                        style['fill-opacity'] = opacity === undefined ? 1 : opacity;
                    } else {
                        if (span.color) style['fill'] = toRGBA(span.color);
                    }
                }

                if (gText.length > 0) {
                    if (span && span.gradient && span.fillType === FillType.Gradient && frame) {
                        const g_ = renderGradient(h, span.gradient as Gradient, frame);
                        if (g_.style) {
                            const opacity = span.gradient.gradientOpacity;
                            const id = "clippath-fill-" + objectId(span.gradient) + randomId();
                            const cp = h("clipPath", { id }, [h('text', { x: gX.join(' '), y, style, "clip-rule": "evenodd" }, gText.join(''))]);
                            linechilds.push(cp);
                            linechilds.push(h("foreignObject", {
                                width: textlayout.contentWidth, height: textlayout.contentHeight, x: xOffset, y: yOffset,
                                "clip-path": "url(#" + id + ")",
                                opacity: opacity === undefined ? 1 : opacity
                            },
                                h("div", { width: "100%", height: "100%", style: g_.style })));
                        } else {
                            linechilds.push(h('text', { x: gX.join(' '), y, style }, gText.join(''),));
                        }
                    } else {
                        linechilds.push(h('text', { x: gX.join(' '), y, style }, gText.join(''),));
                    }
                }

                // 下划线、删除线、高亮
                if (span) {
                    const color = span.color ?? DefaultColor;
                    if (span.underline && span.underline !== UnderlineType.None) {
                        collectDecorateRange(garr, underlines, preUnderlineGIdx, garrIdx, color);
                        preUnderlineGIdx = garrIdx;
                    }
                    if (span.strikethrough && span.strikethrough !== StrikethroughType.None) {
                        collectDecorateRange(garr, strikethrouths, preStrikethrouthGIdx, garrIdx, color);
                        preStrikethrouthGIdx = garrIdx;
                    }
                    if (span.highlight) {
                        collectDecorateRange(garr, hightlights, preHightlightGIdx, garrIdx, span.highlight);
                        preHightlightGIdx = garrIdx;
                    }
                }
            }
            // 高亮
            renderDecorateRects(h, lineX, lineY, line.lineHeight, hightlights, childs);

            childs.push(...linechilds);

            // 下划线、删除线
            const strikethroughY = lineY + (line.lineHeight) / 2;
            const underlineY = lineY + line.lineHeight;
            renderDecorateLines(h, lineX, strikethroughY, strikethrouths, childs);
            renderDecorateLines(h, lineX, underlineY, underlines, childs);
        }
    }
    return childs;
}


function createTextByString(stringValue: string, refShape: TextShape) {
    const text = new Text(new BasicArray());
    if (refShape.text.attr) {
        mergeTextAttr(text, refShape.text.attr);
    }
    const para = new Para('\n', new BasicArray());
    para.attr = new ParaAttr();
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    mergeParaAttr(para, refShape.text.paras[0]);
    mergeSpanAttr(span, refShape.text.paras[0].spans[0]);
    text.insertText(stringValue, 0);
    return text;
}
