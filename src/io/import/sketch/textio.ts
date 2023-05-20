
import { Para, ParaAttr, Span, Text, TextAttr } from "../../../data/text";
import { importColor } from "./styleio";
import * as types from "../../../data/classes"
import { BasicArray } from "../../../data/basic";

interface IJSON {
    [key: string]: any
}

function importHorzAlignment(align: number) {
    return [types.TextHorAlign.Left, 
        types.TextHorAlign.Right, 
        types.TextHorAlign.Centered, 
        types.TextHorAlign.Justified, 
        types.TextHorAlign.Natural][align] ?? types.TextHorAlign.Left;
}
function importVertAlignment(align: number) {
    return [types.TextVerAlign.Top, 
        types.TextVerAlign.Middle, 
        types.TextVerAlign.Bottom][align] ?? types.TextVerAlign.Top;
}

export function importText(data:IJSON, textStyle:IJSON): Text {

    let text: string = data["string"] || "";
    if (text[text.length - 1] != '\n') {
        text = text + "\n"; // attr也要修正
    }
    let index = 0;
    const attributes = data["attributes"] || [];
    const paras = new BasicArray<Para>();

    let attrIdx = 0;

    while(index < text.length) {

        const end = text.indexOf('\n', index) + 1;
        const ptext = text.substring(index, end);
        const paraAttr: ParaAttr = new ParaAttr(); // todo
        const spans = new BasicArray<Span>();

        let spanIndex = index;
        while(attrIdx < attributes.length && spanIndex < end) {
            const attr:IJSON = attributes[attrIdx];
            const location: number = attr['location'];
            const length: number = attr['length'];
            const attrAttr = attr['attributes'];
            const font:IJSON = attrAttr && attrAttr['MSAttributedStringFontAttribute'] && attrAttr['MSAttributedStringFontAttribute']['attributes'];
            const color:IJSON = attrAttr && attrAttr['MSAttributedStringColorAttribute'];
            const kerning = attrAttr && attrAttr['kerning'];

            let len = Math.min(location + length - spanIndex, end - spanIndex);

            if (attrIdx == attributes.length - 1) {
                len = end - spanIndex;
            }

            const span = new Span(len);
            span.fontName = font['name'];
            span.fontSize = font['size'];
            span.color = color && importColor(color)
            spans.push(span);

            spanIndex = spanIndex + len;
            if (spanIndex >= location + length) {
                attrIdx = attrIdx + 1;
            }

            const pAttr = attrAttr && attrAttr["paragraphStyle"];
            if (pAttr) {
                paraAttr.paraSpacing = pAttr["paragraphSpacing"] || 0;
                paraAttr.alignment = importHorzAlignment(pAttr["alignment"]);
                // paraAttr.allowsDefaultTighteningForTruncation = pAttr["allowsDefaultTighteningForTruncation"] || 0;
                paraAttr.maximumLineHeight = pAttr["maximumLineHeight"] || Number.MAX_VALUE;
                paraAttr.minimumLineHeight = pAttr["minimumLineHeight"] || 0;
                paraAttr.kerning = kerning || 0;
            }
        }

        index = end;
        const para = new Para(ptext, spans);
        para.attr = paraAttr;
        paras.push(para);
    }

    const textAttr: TextAttr = new TextAttr();
    if (textStyle) {
        const styAttr = textStyle['encodedAttributes'];
        const styParaAttr = styAttr['paragraphStyle'];
        // textAttr.verticalAlignment = importVertAlignment(textStyle['verticalAlignment']);
        if (styParaAttr) {
            textAttr.alignment = importHorzAlignment(styParaAttr['alignment']);
            // textAttr.allowsDefaultTighteningForTruncation = styParaAttr['allowsDefaultTighteningForTruncation'];
            textAttr.minimumLineHeight = styParaAttr['minimumLineHeight'];
            textAttr.maximumLineHeight = styParaAttr['maximumLineHeight'];
        }
        // const font:IJSON = styAttr['MSAttributedStringFontAttribute'] && styAttr['MSAttributedStringFontAttribute']['attributes'];
        // const color:IJSON = styAttr['MSAttributedStringColorAttribute'];
        // defaultAttr.fontName = font['name'];
    }

    const ret = new Text(paras);
    ret.attr = textAttr;
    return ret;
}
