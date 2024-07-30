
import { Para, ParaAttr, Span, Text, TextAttr, TextTransformType } from "../../../data/text";
import { importColor } from "./common";
import * as types from "../../../data/classes"
import { BasicArray } from "../../../data/basic";
import { IJSON } from "./basic";

function importHorzAlignment(align: number) {
    return [types.TextHorAlign.Left,
    types.TextHorAlign.Right,
    types.TextHorAlign.Centered,
    types.TextHorAlign.Justified,
    types.TextHorAlign.Natural][align] ?? types.TextHorAlign.Left;
}
function importVertAlignment(align: string) {
    switch (align) {
        case 'TOP': return types.TextVerAlign.Top;
        case 'MIDDLE': return types.TextVerAlign.Middle;
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
    const fontSize = textStyle.fontSize;
    /**
    family: "Inter"
    postscript: ""
    style: "Regular"
     */
    const fontName = textStyle.fontName;
    const weight = fontWeightMap[fontName?.style];

    // 默认字体边框
    // const strokePaints = data.strokePaints; // 还不支持

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
            if (spanattr) {
                const fillPaints = spanattr.fillPaints;
                const fontSize = spanattr.fontSize;
                const fontName = spanattr.fontName;
                const weight = fontWeightMap[fontName?.style];
                if (fontSize) span.fontSize = fontSize;
                if (weight) span.weight = weight;
            }
            // span.fontName = "PingFang SC";
            // set attributes
            spans.push(span);
            spanIndex = spanEnd;
        }

        // paraAttr.maximumLineHeight = 24;
        // paraAttr.minimumLineHeight = 24;

        index = end;
        const para = new Para(ptext, spans);
        para.attr = paraAttr;
        paras.push(para);
    }

    const textAttr: TextAttr = new TextAttr();
    if (textStyle) {
        // textAttr.verticalAlignment = importVertAlignment(textStyle['textAlignVertical']);
        // textAttr.alignment = importHorzAlignment(styParaAttr['alignment']);
        // textAttr.minimumLineHeight = styParaAttr['minimumLineHeight'];
        // textAttr.maximumLineHeight = styParaAttr['maximumLineHeight'];
    }

    const ret = new Text(paras);
    ret.attr = textAttr;
    return ret;
}
