
import { Para, ParaAttr, Span, Text, TextAttr, TextTransformType } from "../../../data/text";
import { importColor } from "./common";
import * as types from "../../../data/classes"
import { BasicArray } from "../../../data/basic";
import { IJSON } from "./basic";

function importHorzAlignment(align: string) {
    switch (align) {
        case "RIGHT": return types.TextHorAlign.Right;
        case "CENTER": return types.TextHorAlign.Centered;
        default: return types.TextHorAlign.Left;
    }
}
function importVertAlignment(align: string) {
    switch (align) {
        case 'TOP': return types.TextVerAlign.Top;
        case "CENTER": return types.TextVerAlign.Middle;
        case 'BOTTOM': return types.TextVerAlign.Bottom;
        default: return types.TextVerAlign.Top;
    }
}

const fontWeightMap: { [key: string]: number } = {
    "Regular": 400,
    "Bold": 700,
    "Black": 900,
    "Medium": 500,
    "Semi Bold": 600,
    "Extra Bold": 800,
    "Light": 300,
    "Extra Light": 200,
    "Thin": 100,
}

export function importText(data: IJSON, textStyle: IJSON): Text {

    // 默认字体颜色
    const fillPaints = textStyle.fillPaints;
    const fontColor = fillPaints && fillPaints[0] && importColor(fillPaints[0].color, fillPaints[0].opacity);
    const fontSize = textStyle.fontSize;
    /**
    family: "Inter"
    postscript: ""
    style: "Regular"
     */
    const font = textStyle.fontName;
    const fontName = font?.family;
    const weight = fontWeightMap[font?.style];
    /**
    units: "PERCENT" "PIXELS"
    value: 100
     */
    const lineHeight = textStyle.lineHeight;

    // 默认字体边框
    // const strokePaints = data.strokePaints; // 还不支持

    const alignment = textStyle.textAlignHorizontal && importHorzAlignment(textStyle.textAlignHorizontal);
    const verAlign = textStyle.textAlignVertical && importVertAlignment(textStyle.textAlignVertical);

    let text: string = data["characters"] || "";
    if (text[text.length - 1] != '\n') {
        text = text + "\n"; // attr也要修正
    }
    const lines = data['lines']; // 段落
    const styleOverrideTable = ((styleOverrideTable: any[]) => {
        const t = {} as { [key: number]: any };
        styleOverrideTable.forEach(s => {
            t[s.styleID] = s;
        })
        return t;
    })(data.styleOverrideTable || []);
    let index = 0;
    const characterStyleIDs = (data["characterStyleIDs"] || {}) as { [key: number]: number | undefined };
    const paras = new BasicArray<Para>();

    // let attrIdx = 0;

    while (index < text.length) {

        const end = text.indexOf('\n', index) + 1;
        const ptext = text.substring(index, end);
        const paraAttr: ParaAttr = new ParaAttr(); // todo
        const spans = new BasicArray<Span>();

        let spanIndex = index;
        while (spanIndex < end) {
            const styleId = characterStyleIDs[spanIndex];
            let spanEnd = spanIndex + 1;
            while (spanEnd < end && styleId === characterStyleIDs[spanEnd]) ++spanEnd;
            const spanattr = styleId !== undefined && styleOverrideTable[styleId];
            const span = new Span(spanEnd - spanIndex);
            span.fontSize = fontSize;
            span.weight = weight;
            span.fontName = fontName;
            span.color = fontColor;
            if (spanattr) {
                const fillPaints = spanattr.fillPaints;
                const fontColor = fillPaints && fillPaints[0] && importColor(fillPaints[0].color, fillPaints[0].opacity);
                if (fontColor) span.color = fontColor;
                const fontSize = spanattr.fontSize;
                const font = spanattr.fontName;
                const fontName = font?.family;
                const weight = fontWeightMap[font?.style];
                if (fontSize) span.fontSize = fontSize;
                if (weight) span.weight = weight;
                if (fontName) span.fontName = fontName;
            }
            // span.fontName = "PingFang SC";
            // set attributes
            spans.push(span);
            spanIndex = spanEnd;
        }

        if (lineHeight && fontSize) {
            const value = lineHeight.value;
            if (lineHeight.units === 'PERCENT') {
                const v = Math.round(fontSize * 1.35 * value / 100);
                paraAttr.maximumLineHeight = v;
                paraAttr.minimumLineHeight = v;
            } else if (lineHeight.units === 'PIXELS') {
                paraAttr.maximumLineHeight = value;
                paraAttr.minimumLineHeight = value;
            }
        }
        if (alignment && alignment !== types.TextHorAlign.Left) paraAttr.alignment = alignment;

        index = end;
        const para = new Para(ptext, spans);
        para.attr = paraAttr;
        paras.push(para);
    }

    const textAttr: TextAttr = new TextAttr();
    if (verAlign && verAlign !== types.TextVerAlign.Top) textAttr.verAlign = verAlign;

    const ret = new Text(paras);
    ret.attr = textAttr;
    return ret;
}
