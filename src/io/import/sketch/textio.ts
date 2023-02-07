import { IJSON } from "@/data/lzdata";
import { Para, ParaAttr, Span, Text, TextAttr, TextHorizontalAlignment, TextVerticalAlignment } from "@/data/text";
import { importColor } from "./styleio";

function importHorzAlignment(align: number) {
    return [TextHorizontalAlignment.Left, 
        TextHorizontalAlignment.Right, 
        TextHorizontalAlignment.Centered, 
        TextHorizontalAlignment.Justified, 
        TextHorizontalAlignment.Natural][align] ?? TextHorizontalAlignment.Left;
}
function importVertAlignment(align: number) {
    return [TextVerticalAlignment.Top, 
        TextVerticalAlignment.Middle, 
        TextVerticalAlignment.Bottom][align] ?? TextVerticalAlignment.Top;
}

export function importText(data:IJSON, textStyle:IJSON): Text {

    let text: string = data["string"] || "";
    if (text[text.length - 1] != '\n') {
        text = text + "\n"; // attr也要修正
    }
    let index = 0;
    const attributes = data["attributes"] || [];
    const paras: Para[] = [];

    let attrIdx = 0;

    while(index < text.length) {

        const end = text.indexOf('\n', index) + 1;
        const ptext = text.substring(index, end);
        const paraAttr: ParaAttr = new ParaAttr(); // todo
        const spans: Span[] = [];

        let spanIndex = index;
        while(attrIdx < attributes.length && spanIndex < end) {
            const attr:IJSON = attributes[attrIdx];
            const location: number = attr['location'];
            const length: number = attr['length'];
            const attrAttr = attr['attributes'];
            const font:IJSON = attrAttr && attrAttr['MSAttributedStringFontAttribute'] && attrAttr['MSAttributedStringFontAttribute']['attributes'];
            const color:IJSON = attrAttr && attrAttr['MSAttributedStringColorAttribute'];
            let len = Math.min(location + length - spanIndex, end - spanIndex);

            if (attrIdx == attributes.length - 1) {
                len = end - spanIndex;
            }
            spans.push(new Span(len, font && font['name'], font && font['size'], color && importColor(color)));

            spanIndex = spanIndex + len;
            if (spanIndex >= location + length) {
                attrIdx = attrIdx + 1;
            }

            const pAttr = attrAttr && attrAttr["paragraphStyle"];
            if (pAttr) {
                paraAttr.paragraphSpacing = pAttr["paragraphSpacing"] || 0;
                paraAttr.alignment = importHorzAlignment(pAttr["alignment"]);
                paraAttr.allowsDefaultTighteningForTruncation = pAttr["allowsDefaultTighteningForTruncation"] || 0;
                paraAttr.maximumLineHeight = pAttr["maximumLineHeight"] || Number.MAX_VALUE;
                paraAttr.minimumLineHeight = pAttr["minimumLineHeight"] || 0;
            }
        }

        index = end;
        paras.push(new Para(ptext, spans, paraAttr));
    }

    const defaultAttr: TextAttr = new TextAttr();
    if (textStyle) {
        const styAttr = textStyle['encodedAttributes'];
        const styParaAttr = styAttr['paragraphStyle'];
        defaultAttr.verticalAlignment = importVertAlignment(textStyle['verticalAlignment']);
        if (styParaAttr) {
            defaultAttr.alignment = importHorzAlignment(styParaAttr['alignment']);
            defaultAttr.allowsDefaultTighteningForTruncation = styParaAttr['allowsDefaultTighteningForTruncation'];
            defaultAttr.minimumLineHeight = styParaAttr['minimumLineHeight'];
            defaultAttr.maximumLineHeight = styParaAttr['maximumLineHeight'];
        }
        // const font:IJSON = styAttr['MSAttributedStringFontAttribute'] && styAttr['MSAttributedStringFontAttribute']['attributes'];
        // const color:IJSON = styAttr['MSAttributedStringColorAttribute'];
        // defaultAttr.fontName = font['name'];
    }

    return new Text(paras, defaultAttr);
}
