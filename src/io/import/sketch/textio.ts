import { IJSON } from "@/data/lzdata";
import { Para, Span, Text } from "@/data/text";
import { importColor } from "./styleio";

export function importText(data:IJSON): Text {

    let text: string = data["string"] || "";
    if (text[text.length - 1] != '\n') {
        text = text + "\n"; // attr也要修正
    }
    let index = 0;
    let defaultAttr; // todo
    const attributes = data["attributes"] || [];
    const paras: Para[] = [];

    let attrIdx = 0;

    while(index < text.length) {

        const end = text.indexOf('\n', index) + 1;
        const ptext = text.substring(index, end);
        let paraAttr; // todo
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
        }

        index = end;
        paras.push(new Para(ptext, spans, paraAttr));
    }

    return new Text(paras, defaultAttr);
}
