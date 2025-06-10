/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */



import { DefaultColor, randomId } from "../../basic";
import { Color, FillType, Gradient, UnderlineType, StrikethroughType, Blur, BlurType, SpanAttr, ShapeSize } from '../../../data';
import { GraphArray, TextLayout } from "../../../data/text/textlayout";
import { gPal } from "../../../basic/pal";
import { render as renderGradient } from "./gradient";
import { objectId } from "../../../basic/objectid";
import { Path } from "@kcaitech/path";

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
                const bottom = lineY + line.lineHeight - (line.lineHeight - line.maxFontSize) / 2;

                // 以bottom对齐，然后再根据最大actualBoundingBoxDescent进行偏移
                const offsetY = line.actualBoundingBoxDescent;
                const baseY = bottom - offsetY;

                const weight = (span?.weight) || 400;
                const italic = !!(span?.italic);
                
                if (fontSize > 0) garr.forEach((g) => {
                    if (isBlankChar(g.char.charCodeAt(0))) return;
                    const pathstr = getTextPath(font, fontSize, italic, weight, g.char.charCodeAt(0))
                    const path = Path.fromSVGString(pathstr)
                    path.translate(g.x + lineX, baseY);
                    paths.addPath(path)
                })
            }
        }
    }
    return paths;
}

function collectDecorateRange(garr: GraphArray, decorateRange: { start: number, end: number, color: Color }[], preGarrIdx: number, garrIdx: number, color: Color) {
    if (preGarrIdx === garrIdx - 1) {
        const last = decorateRange[decorateRange.length - 1];
        if ((last.color.equals(color))) {
            const endGraph = garr[garr.length - 1];
            last.end = endGraph.x + endGraph.cw;
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
        props.stroke = (l.color.toRGBA());
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
        props.fill = (l.color.toRGBA());
        props.stroke = 'none';
        props["stroke-width"] = 1;
        childs.push(h('path', props));
    }
}


const _escapeChars: { [key: string]: string } = {};
_escapeChars['<'] = '&lt;';
_escapeChars['>'] = '&gt;';
_escapeChars['&'] = '&amp;';

function escapeWebChar(text: string) {
    const ret: string[] = [];
    let i = 0, j = 0, len = text.length;
    for (; i < len; ++i) {
        const e = _escapeChars[text[i]];
        if (e) {
            if (i > j) ret.push(text.substring(j, i));
            ret.push(e);
            j = i + 1;
        }
    }
    if (ret.length > 0) {
        if (i > j) ret.push(text.substring(j, i));
        return ret.join('');
    }
    return text;
}

export function renderTextLayout(h: Function, textlayout: TextLayout, frame?: ShapeSize, blur?: Blur) {
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
                const gText: string[] = []
                const gX = []
                // const gY = []
                const garr = line[garrIdx];
                const span = garr.attr;
                const fontSize = span?.fontSize || 0;
                const bottom = lineY + line.lineHeight - (line.lineHeight - line.maxFontSize) / 2;
                const offsetY = line.actualBoundingBoxDescent;
                const baseY = bottom - offsetY;

                for (let gIdx = 0, gCount = garr.length; gIdx < gCount; gIdx++) {
                    const graph = garr[gIdx];
                    if (isBlankChar(graph.char.charCodeAt(0))) { // 两个连续的空格或者首个空格，svg显示有问题
                        continue;
                    }
                    gText.push(graph.char);
                    gX.push(graph.x + lineX);
                }


                const fontName = span?.fontName;
                const font = "normal " + fontSize + "px " + fontName;
                const style: any = {
                    font,
                    'alignment-baseline': 'baseline'
                }
                if (span) {
                    style['font-weight'] = span.weight || 400;
                    if (span.italic) style['font-style'] = "italic";
                    if (span.gradient && span.fillType === FillType.Gradient && frame) {
                        const g_ = renderGradient(h, span.gradient as Gradient, frame);
                        const opacity = span.gradient.gradientOpacity;
                        if (g_.node) linechilds.push(g_.node);
                        const gid = g_.id;
                        style['fill'] = "url(#" + gid + ")";
                        style['fill-opacity'] = opacity === undefined ? 1 : opacity;
                    } else {
                        if (span.color) style['fill'] = (span.color.toRGBA());
                    }
                }

                if (gText.length > 0) {
                    const text = escapeWebChar(gText.join(''))
                    if (span && span.gradient && span.fillType === FillType.Gradient && frame) {
                        const g_ = renderGradient(h, span.gradient as Gradient, frame);
                        if (g_.style) {
                            const opacity = span.gradient.gradientOpacity;
                            const id = "clippath-fill-" + objectId(span.gradient) + randomId();
                            const cp = h("clipPath", { id }, [h('text', { x: gX.join(' '), y: baseY, style, "clip-rule": "evenodd" }, text)]);
                            linechilds.push(cp);
                            linechilds.push(h("foreignObject", {
                                width: textlayout.contentWidth, height: textlayout.contentHeight, x: xOffset, y: yOffset,
                                "clip-path": "url(#" + id + ")",
                                opacity: opacity === undefined ? 1 : opacity
                            },
                                h("div", { width: "100%", height: "100%", style: g_.style })));
                        } else {
                            linechilds.push(h('text', { x: gX.join(' '), y: baseY, style }, text));
                        }
                    } else {
                        linechilds.push(h('text', { x: gX.join(' '), y: baseY, style }, text));
                    }
                    if (blur && blur.isEnabled && blur.type === BlurType.Background && span && is_alpha(span)) {
                        const id = "clip-blur-" + objectId(blur) + randomId();
                        const cp = h("clipPath", { id }, [h('text', { x: gX.join(' '), y: baseY, style, "clip-rule": "evenodd" }, text)]);
                        const foreignObject = h("foreignObject",
                            {
                                width: textlayout.contentWidth, height: textlayout.contentHeight, x: xOffset, y: yOffset
                            },
                            h("div", { style: { width: "100%", height: "100%", 'backdrop-filter': `blur(${blur.saturation / 2}px)`, "clip-path": "url(#" + id + ")" } }))
                        const backgroundBlur = h("g", [cp, foreignObject])
                        linechilds.push(backgroundBlur);
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

const is_alpha = (span: SpanAttr) => {
    if (span.highlight && span.highlight.alpha === 1) return false;
    return !!(span.color && span.color.alpha > 0 && span.color.alpha < 1);
};