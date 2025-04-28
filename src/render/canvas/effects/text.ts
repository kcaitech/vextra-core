

import { DefaultColor } from "../../basic";
import { Color, FillType, Gradient, UnderlineType, StrikethroughType, GradientType } from '../../../data/classes';
import { GraphArray, TextLayout } from "../../../data/text/textlayout";
import { render as renderGradient } from "./gradient";
import { Props } from "../painters/view";
import { TextShapeView } from "src/dataview";

interface DecorateRange {
    start: number,
    end: number,
    color: Color,
    fontSize: number,
    gradient?: CanvasGradient
}
function collectDecorateRange(garr: GraphArray, decorateRange: DecorateRange[], preGarrIdx: number, garrIdx: number, color: Color, fontSize: number, gradient?: CanvasGradient) {
    if (preGarrIdx === garrIdx - 1) {
        const last = decorateRange[decorateRange.length - 1];
        if ((last.color.equals(color))) {
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
    decorateRange.push({ start, end, color, fontSize, gradient })
}

function renderDecorateLines(ctx: CanvasRenderingContext2D, x: number, y: number, decorateRange: DecorateRange[]) {
    for (let i = 0, len = decorateRange.length; i < len; i++) {
        ctx.save();
        const l = decorateRange[i];
        const d = "M" + (x + l.start) + ' ' + y + " L" + (x + l.end) + ' ' + y;
        ctx.lineWidth = l.fontSize / 20;
        ctx.strokeStyle = l.gradient ? l.gradient : l.color.toRGBA();
        ctx.stroke(new Path2D(d));
        ctx.restore();
    }
}

function renderDecorateRects(ctx: CanvasRenderingContext2D, x: number, y: number, hight: number, decorateRange: { start: number, end: number, color: Color }[]) {
    for (let i = 0, len = decorateRange.length; i < len; i++) {
        ctx.save();
        const l = decorateRange[i];
        const d = "M" + (x + l.start) + ' ' + y + // lt
            " L" + (x + l.end) + ' ' + y + // rt
            " L" + (x + l.end) + ' ' + (y + hight) + // rb
            " L" + ' ' + (x + l.start) + ' ' + (y + hight) + // lb
            'Z';
        ctx.fillStyle = l.color.toRGBA();
        ctx.fill(new Path2D(d));
        ctx.restore();
    }
}


const _escapeChars: { [key: string]: string } = {};
_escapeChars['<'] = '&lt;';
_escapeChars['>'] = '&gt;';
_escapeChars['&'] = '&amp;';

function isBlankChar(charCode: number) {
    switch (charCode) {
        case 0x09: // '\t'
        case 0x0a: // '\n'
        case 0x20: // ' '
            return true;
    }
    return false;
}
export function renderTextLayout(props: Props, ctx: CanvasRenderingContext2D, textlayout: TextLayout, shape: TextShapeView) {
    const frame = shape.frame;
    const { xOffset, yOffset, paras } = textlayout;
    const pc = paras.length;
    ctx.save();
    ctx.transform(...props.transform);
    const getTextPath = shape.getTextPath().toSVGString();
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

            const underlines: DecorateRange[] = [];
            const strikethrouths: DecorateRange[] = [];
            const hightlights: { start: number, end: number, color: Color, fontSize: number }[] = [];

            for (let garrIdx = 0, garrCount = line.length; garrIdx < garrCount; garrIdx++) {
                ctx.save();
                const gText: string[] = []
                const gX = []
                // const gY = []
                const garr = line[garrIdx];
                const span = garr.attr;
                const fontSize = span?.fontSize || 0;
                const bottom = lineY + line.lineHeight - (line.lineHeight - line.maxFontSize) / 2;
                const offsetY = line.actualBoundingBoxDescent;
                const baseY = bottom - offsetY;
                let lineWidth = 0;
                let gradient;

                for (let gIdx = 0, gCount = garr.length; gIdx < gCount; gIdx++) {
                    const graph = garr[gIdx];
                    if (isBlankChar(graph.char.charCodeAt(0))) { // 两个连续的空格或者首个空格，svg显示有问题
                        continue;
                    }
                    gText.push(graph.char);
                    gX.push(graph.x + lineX);
                    lineWidth = graph.x + lineX + graph.cw - gX[0];
                }
                const fontName = span?.fontName || 'sans-serif';

                let font = `normal normal normal ${fontSize}px ${fontName}`;
                if (span) {
                    font = `${span.italic ? 'italic' : 'normal'} normal ${span.weight || 'normal'} ${fontSize}px ${fontName}`;
                    if (span.color && span.fillType !== FillType.Gradient) {
                        ctx.fillStyle = span.color.toRGBA();
                    }
                }
                ctx.textBaseline = "alphabetic";
                ctx.font = font;
                if (gText.length > 0) {
                    if (span && span.gradient && span.fillType === FillType.Gradient && frame) {
                        if (span.gradient.gradientType === GradientType.Radial) {
                            const dpr = typeof window !== "undefined" ? Math.ceil(window.devicePixelRatio || 1) : 1;
                            const offscreen = new OffscreenCanvas(frame.width * dpr, frame.height * dpr);
                            const offctx = offscreen.getContext("2d")!;
                            offctx.scale(dpr, dpr);
                            offctx.clip(new Path2D(getTextPath), "evenodd"); //裁剪文字路径
                            const rect = new Path2D();
                            rect.rect(gX[0], lineY, lineWidth, line.lineHeight);
                            offctx.clip(rect);
                            gradient = renderGradient(offctx, span.gradient as Gradient, frame);
                            offctx.fillStyle = gradient;
                            offctx.fillRect(0, 0, frame.width, frame.height);
                            ctx.imageSmoothingEnabled = true; // 开启抗锯齿
                            // ctx.imageSmoothingQuality = "high"; // 优化抗锯齿
                            ctx.drawImage(offscreen, 0, 0, frame.width, frame.height);
                        } else {
                            gradient = renderGradient(ctx, span.gradient as Gradient, frame);
                            ctx.fillStyle = gradient;
                            for (let i = 0; i < gX.length; i++) {
                                const x = gX[i];
                                ctx.fillText(gText[i], x, baseY);
                            }
                        }
                    } else {
                        for (let i = 0; i < gX.length; i++) {
                            const x = gX[i];
                            ctx.fillText(gText[i], x, baseY);
                        }
                    }
                }

                // 下划线、删除线、高亮
                if (span) {
                    const color = span.color ?? DefaultColor;
                    if (span.underline && span.underline !== UnderlineType.None) {
                        collectDecorateRange(garr, underlines, preUnderlineGIdx, garrIdx, color, fontSize, gradient);
                        preUnderlineGIdx = garrIdx;
                    }
                    if (span.strikethrough && span.strikethrough !== StrikethroughType.None) {
                        collectDecorateRange(garr, strikethrouths, preStrikethrouthGIdx, garrIdx, color, fontSize, gradient);
                        preStrikethrouthGIdx = garrIdx;
                    }
                    if (span.highlight) {
                        collectDecorateRange(garr, hightlights, preHightlightGIdx, garrIdx, span.highlight, fontSize);
                        preHightlightGIdx = garrIdx;
                    }
                }
                ctx.restore();
            }
            // 高亮
            renderDecorateRects(ctx, lineX, lineY, line.lineHeight, hightlights);


            // 下划线、删除线
            const strikethroughY = lineY + (line.lineHeight) / 2;
            const underlineY = lineY + line.lineHeight;
            renderDecorateLines(ctx, lineX, strikethroughY, strikethrouths);
            renderDecorateLines(ctx, lineX, underlineY, underlines);
        }
    }
    ctx.restore();
}